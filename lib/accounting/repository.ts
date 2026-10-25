import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentWorkspaceContext } from "@/lib/supabase/workspace-client";
import type { BasicTransaction, JournalEntry, LedgerAccount, MoneyAccount } from "./types";

const dateLabel = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
type NamedRelation = { name?: string } | { name?: string }[] | null;

function relationName(value: NamedRelation) {
  return (Array.isArray(value) ? value[0]?.name : value?.name) ?? "Uncategorized";
}

export async function loadLiveAccounting() {
  const context = await getCurrentWorkspaceContext();
  const supabase = createSupabaseBrowserClient();
  const [moneyResult, ledgerResult, transactionResult, journalResult] = await Promise.all([
    supabase.from("money_accounts").select("id,name,kind,currency,opening_balance,financial_transactions(transaction_type,amount)").eq("workspace_id", context.workspaceId).eq("is_active", true).order("name"),
    supabase.from("ledger_accounts").select("id,code,name,account_type,parent_id,is_system").eq("workspace_id", context.workspaceId).eq("is_active", true).order("code"),
    supabase.from("financial_transactions").select("id,transaction_date,transaction_type,description,amount,reference,attachment_path,money:money_accounts(name),category:ledger_accounts(name)").eq("workspace_id", context.workspaceId).order("transaction_date", { ascending: false }).limit(100),
    supabase.from("journal_entries").select("id,entry_number,entry_date,memo,source_type,source_id,status,lines:journal_lines(id,account_id,debit,credit,account:ledger_accounts(name))").eq("workspace_id", context.workspaceId).order("entry_date", { ascending: false }).limit(100),
  ]);
  for (const result of [moneyResult, ledgerResult, transactionResult, journalResult]) if (result.error) throw result.error;
  const moneyAccounts: MoneyAccount[] = (moneyResult.data ?? []).map((row) => ({ id: row.id, name: row.name, kind: row.kind as MoneyAccount["kind"], currency: row.currency, balance: Number(row.opening_balance) + (row.financial_transactions ?? []).reduce((sum, item) => sum + (item.transaction_type === "income" ? Number(item.amount) : -Number(item.amount)), 0) }));
  const ledgerAccounts: LedgerAccount[] = (ledgerResult.data ?? []).map((row) => ({ id: row.id, code: row.code, name: row.name, type: row.account_type as LedgerAccount["type"], parentId: row.parent_id ?? undefined, system: row.is_system }));
  const transactions: BasicTransaction[] = (transactionResult.data ?? []).map((row) => ({ id: row.id, date: dateLabel(row.transaction_date), type: row.transaction_type as BasicTransaction["type"], category: relationName(row.category as NamedRelation), account: relationName(row.money as NamedRelation), description: row.description, amount: Number(row.amount), reference: row.reference ?? undefined, attachment: row.attachment_path ?? undefined }));
  const journals: JournalEntry[] = (journalResult.data ?? []).map((row) => ({ id: row.id, number: row.entry_number, date: dateLabel(row.entry_date), memo: row.memo, sourceType: row.source_type ?? "manual", sourceId: row.source_id ?? undefined, status: row.status as JournalEntry["status"], lines: (row.lines ?? []).map((line) => ({ id: line.id, accountId: line.account_id, accountName: relationName(line.account as NamedRelation), debit: Number(line.debit), credit: Number(line.credit) })) }));
  return { context, moneyAccounts, ledgerAccounts, transactions, journals };
}

export async function recordLiveTransaction(input: { type: "income" | "expense"; amount: number; description: string; moneyAccountId: string; categoryAccountId: string; reference?: string }) {
  const context = await getCurrentWorkspaceContext();
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("record_financial_transaction", { target_workspace_id: context.workspaceId, target_money_account_id: input.moneyAccountId, target_category_account_id: input.categoryAccountId, target_type: input.type, target_date: new Date().toISOString().slice(0, 10), target_description: input.description.trim(), target_amount: input.amount, target_reference: input.reference || null, target_attachment_path: null });
  if (error) throw error;
  return data as string;
}
