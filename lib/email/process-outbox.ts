import "server-only";
import { createClient } from "@supabase/supabase-js";
import { emailRetryDelayMs } from "./retry";
import { sendSmtpMessage, type OutboxMessage } from "./smtp";

type ClaimedMessage = OutboxMessage & { attempt_count: number };
type DeliveryResult = { id: string; status: "sent" | "failed"; error?: string };

export async function processEmailOutbox(limit = 10) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase service configuration is missing");

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const workerId = crypto.randomUUID();
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 25);
  const { data, error } = await supabase.rpc("claim_email_outbox", { claim_limit: safeLimit, worker_id: workerId });
  if (error) throw error;

  const results: DeliveryResult[] = [];
  for (const row of (data || []) as ClaimedMessage[]) {
    try {
      const providerId = await sendSmtpMessage(row);
      const { error: updateError } = await supabase
        .from("email_outbox")
        .update({ status: "sent", provider_message_id: providerId, sent_at: new Date().toISOString(), locked_at: null, locked_by: null })
        .eq("id", row.id)
        .eq("status", "sending")
        .eq("locked_by", workerId);
      if (updateError) throw updateError;
      results.push({ id: row.id, status: "sent" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";
      const retryAt = new Date(Date.now() + emailRetryDelayMs(row.attempt_count)).toISOString();
      await supabase
        .from("email_outbox")
        .update({ status: "failed", last_error: message.slice(0, 1000), scheduled_at: retryAt, locked_at: null, locked_by: null })
        .eq("id", row.id)
        .eq("locked_by", workerId);
      results.push({ id: row.id, status: "failed", error: message });
    }
  }

  return results;
}
