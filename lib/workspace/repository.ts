import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentWorkspaceContext } from "@/lib/supabase/workspace-client";

export type ModuleFlags = Record<string, boolean>;
export interface WorkspaceSettings { name: string; businessType: string; phone: string; website: string; address: string; invoiceFooter: string; paymentInstructions: string; accountingMode: "basic" | "full"; invoiceTemplate: string; primaryColor: string; accentColor: string; modules: ModuleFlags; }

export async function loadWorkspaceSettings(): Promise<WorkspaceSettings> {
  const context = await getCurrentWorkspaceContext(); const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("workspaces").select("name,business_type,settings:workspace_settings(phone,website,business_address,invoice_footer,payment_instructions,accounting_mode,invoice_template,brand_primary_color,brand_accent_color,module_flags)").eq("id", context.workspaceId).single();
  if (error) throw error; const settings = Array.isArray(data.settings) ? data.settings[0] : data.settings;
  return { name: data.name, businessType: data.business_type, phone: settings?.phone ?? "", website: settings?.website ?? "", address: settings?.business_address ?? "", invoiceFooter: settings?.invoice_footer ?? "", paymentInstructions: settings?.payment_instructions ?? "", accountingMode: settings?.accounting_mode ?? "basic", invoiceTemplate: settings?.invoice_template ?? "modern", primaryColor: settings?.brand_primary_color ?? "#246BFD", accentColor: settings?.brand_accent_color ?? "#17263F", modules: (settings?.module_flags as ModuleFlags) ?? {} };
}

export async function saveWorkspaceSettings(input: WorkspaceSettings) {
  const context = await getCurrentWorkspaceContext(); const supabase = createSupabaseBrowserClient();
  const workspace = await supabase.from("workspaces").update({ name: input.name.trim(), business_type: input.businessType }).eq("id", context.workspaceId);
  if (workspace.error) throw workspace.error;
  const settings = await supabase.from("workspace_settings").update({ phone: input.phone || null, website: input.website || null, business_address: input.address || null, invoice_footer: input.invoiceFooter || null, payment_instructions: input.paymentInstructions || null, accounting_mode: input.accountingMode, invoice_template: input.invoiceTemplate, brand_primary_color: input.primaryColor, brand_accent_color: input.accentColor, module_flags: input.modules }).eq("workspace_id", context.workspaceId);
  if (settings.error) throw settings.error;
}

export async function loadEmailTemplates() {
  const context = await getCurrentWorkspaceContext(); const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("email_templates").select("id,template_key,name,subject_template,html_template,text_template,is_active").eq("workspace_id", context.workspaceId).order("name");
  if (error) throw error; return data ?? [];
}

export async function saveEmailTemplate(id: string, subject: string, body: string) {
  const supabase = createSupabaseBrowserClient(); const { error } = await supabase.from("email_templates").update({ subject_template: subject, text_template: body, html_template: `<p>${body.replaceAll("\n", "</p><p>")}</p>` }).eq("id", id); if (error) throw error;
}

export async function exportWorkspaceBackup() {
  const context = await getCurrentWorkspaceContext(); const supabase = createSupabaseBrowserClient();
  const tables = ["workspaces","workspace_settings","workspace_memberships","catalog_items","inventory_locations","stock_balances","stock_movements","crm_leads","crm_clients","proposals","proposal_items","projects","project_tasks","invoices","invoice_items","invoice_payments","money_accounts","financial_transactions","journal_entries","journal_lines","email_templates","audit_logs","branches","suppliers","purchase_orders","stock_transfers","bills_of_materials","production_orders","recurring_invoice_profiles"];
  const data: Record<string, unknown> = {};
  for (const table of tables) { const query = table === "workspaces" ? supabase.from(table).select("*").eq("id", context.workspaceId) : supabase.from(table).select("*").eq("workspace_id", context.workspaceId); const result = await query; data[table] = result.error ? { error: result.error.message } : result.data; }
  return { format: "ledgerdesk-workspace-backup", version: 1, exportedAt: new Date().toISOString(), workspaceId: context.workspaceId, data };
}

export async function loadTeamAndActivity() {
  const context = await getCurrentWorkspaceContext(); const supabase = createSupabaseBrowserClient();
  const [members, invitations, activity, notifications] = await Promise.all([
    supabase.from("workspace_memberships").select("user_id,role,is_active,joined_at,profile:profiles(display_name)").eq("workspace_id", context.workspaceId).order("joined_at"),
    supabase.from("workspace_invitations").select("id,email,role,status,expires_at,created_at").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("id,action,entity_type,entity_id,metadata,created_at,actor:profiles(display_name)").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }).limit(100),
    supabase.from("notifications").select("id,title,message,kind,action_url,read_at,created_at").eq("workspace_id", context.workspaceId).or(`user_id.is.null,user_id.eq.${context.userId}`).order("created_at", { ascending: false }).limit(50),
  ]);
  for (const result of [members, invitations, activity, notifications]) if (result.error) throw result.error;
  return { context, members: members.data ?? [], invitations: invitations.data ?? [], activity: activity.data ?? [], notifications: notifications.data ?? [] };
}

export async function inviteTeamMember(email: string, role: string) { const context = await getCurrentWorkspaceContext(); const supabase = createSupabaseBrowserClient(); const { data, error } = await supabase.rpc("create_workspace_invitation", { target_workspace_id: context.workspaceId, target_email: email.trim(), target_role: role }); if (error) throw error; return data as string; }
export async function acceptWorkspaceInvitation(token: string) { const supabase = createSupabaseBrowserClient(); const { data, error } = await supabase.rpc("accept_workspace_invitation", { raw_token: token }); if (error) throw error; return data as string; }
export async function updateMemberRole(userId: string, role: string, active: boolean) { const context = await getCurrentWorkspaceContext(); const supabase = createSupabaseBrowserClient(); const { error } = await supabase.rpc("set_workspace_member_access", { target_workspace_id: context.workspaceId, target_user_id: userId, target_role: role, target_active: active }); if (error) throw error; }
