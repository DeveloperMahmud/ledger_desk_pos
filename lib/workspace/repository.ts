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
  const run=await supabase.from("workspace_backup_runs").insert({workspace_id:context.workspaceId,operation:"export",format_version:3,status:"started",created_by:context.userId}).select("id").single();
  if(run.error)throw run.error;
  const tables = ["workspaces","workspace_settings","workspace_memberships","units","product_categories","catalog_items","inventory_locations","stock_balances","stock_movements","stock_adjustments","crm_leads","crm_clients","crm_contacts","service_packages","proposals","proposal_items","projects","project_tasks","project_milestones","project_deliverables","project_revisions","project_links","invoice_templates","invoice_sequences","invoices","invoice_items","invoice_payments","invoice_public_links","ledger_accounts","money_accounts","financial_transactions","accounting_periods","journal_entries","journal_lines","email_templates","email_outbox","branches","suppliers","purchase_orders","purchase_order_items","stock_transfers","stock_transfer_items","bills_of_materials","bill_of_material_items","production_orders","recurring_invoice_profiles","money_books","tracker_accounts","tracker_categories","tracker_import_batches","tracker_transfer_groups","tracker_transactions","tracker_budgets","tracker_goals","tracker_recurring_rules","tracker_attachments","notifications","audit_logs"];
  const data: Record<string, unknown> = {};
  try{for (const table of tables) { const query = table === "workspaces" ? supabase.from(table).select("*").eq("id", context.workspaceId) : supabase.from(table).select("*").eq("workspace_id", context.workspaceId); const result = await query;if(result.error)throw new Error(`${table}: ${result.error.message}`);data[table]=result.data; }}catch(cause){await supabase.from("workspace_backup_runs").update({status:"failed",error_message:cause instanceof Error?cause.message:"Export failed",completed_at:new Date().toISOString()}).eq("id",run.data.id);throw cause;}
  const counts=Object.fromEntries(Object.entries(data).map(([table,rows])=>[table,Array.isArray(rows)?rows.length:0]));
  const attachmentPaths=[...(data.tracker_attachments as Array<{storage_path?:string}>||[]).map(item=>item.storage_path),...(data.project_deliverables as Array<{storage_path?:string}>||[]).map(item=>item.storage_path),...(data.invoice_payments as Array<{proof_path?:string}>||[]).map(item=>item.proof_path)].filter((value):value is string=>Boolean(value));
  const encoded=new TextEncoder().encode(JSON.stringify(data));const digest=await crypto.subtle.digest("SHA-256",encoded);const checksum=Array.from(new Uint8Array(digest)).map(value=>value.toString(16).padStart(2,"0")).join("");
  const manifest={tables:Object.keys(data),counts,attachmentPaths,checksumAlgorithm:"SHA-256",dataChecksum:checksum,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,currencies:Array.from(new Set((data.tracker_transactions as Array<{currency?:string}>||[]).map(row=>row.currency).filter(Boolean)))};
  await supabase.from("workspace_backup_runs").update({status:"completed",manifest,completed_at:new Date().toISOString()}).eq("id",run.data.id);
  return { format: "ledgerdesk-workspace-backup", version: 3, exportedAt: new Date().toISOString(), source:{workspaceId:context.workspaceId,app:"LedgerDesk",schema:"2026-10-27.016",minimumAppVersion:"1.3.0"},manifest,data };
}

export async function downloadWorkspaceBackupZip(){const backup=await exportWorkspaceBackup();const JSZip=(await import("jszip")).default;const zip=new JSZip();zip.file("backup.json",JSON.stringify(backup,null,2));zip.file("manifest.json",JSON.stringify(backup.manifest,null,2));zip.file("README.txt","LedgerDesk workspace backup v3\nRestore from Settings > Security & backup.\nChecksums are validated before a new workspace is created.\n");const supabase=createSupabaseBrowserClient();const paths=backup.manifest.attachmentPaths as string[];for(const path of paths){const result=await supabase.storage.from("workspace-files").download(path);if(!result.error&&result.data)zip.file(`attachments/${path}`,result.data);}return zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});}

export async function loadBackupHistory(){const context=await getCurrentWorkspaceContext();const {data,error}=await createSupabaseBrowserClient().from("workspace_backup_runs").select("id,operation,format_version,status,manifest,error_message,created_at,completed_at").eq("workspace_id",context.workspaceId).order("created_at",{ascending:false}).limit(20);if(error)throw error;return data||[];}

type BackupPayload={format:string;version:number;manifest?:{counts?:Record<string,number>;attachmentPaths?:string[];dataChecksum?:string};data:Record<string,unknown>};
async function readBackup(file:File){let payload:BackupPayload;let archive:import("jszip")|undefined;if(file.name.toLowerCase().endsWith(".zip")){const JSZip=(await import("jszip")).default;archive=await JSZip.loadAsync(await file.arrayBuffer());const entry=archive.file("backup.json");if(!entry)throw new Error("ZIP does not contain backup.json.");payload=JSON.parse(await entry.async("text")) as BackupPayload;}else payload=JSON.parse(await file.text()) as BackupPayload;if(payload.format!=="ledgerdesk-workspace-backup"||!payload.data||!payload.version)throw new Error("This is not a supported LedgerDesk workspace backup.");return{payload,archive};}
export async function previewWorkspaceBackup(file:File){const {payload,archive}=await readBackup(file);return{version:payload.version,counts:payload.manifest?.counts||{},attachmentCount:payload.manifest?.attachmentPaths?.length||0,hasChecksum:Boolean(payload.manifest?.dataChecksum),isArchive:Boolean(archive)};}
export async function restoreWorkspaceBackup(file:File){const {payload,archive}=await readBackup(file);const response=await fetch("/api/workspace/restore",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Restore failed.");let restoredAttachments=0;const missingAttachments:string[]=[];if(archive){const db=createSupabaseBrowserClient();for(const oldPath of payload.manifest?.attachmentPaths||[]){const entry=archive.file(`attachments/${oldPath}`);if(!entry){missingAttachments.push(oldPath);continue;}const newPath=`${result.workspaceId}/restored/${crypto.randomUUID()}-${oldPath.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g,"-")||"file"}`;const upload=await db.storage.from("workspace-files").upload(newPath,await entry.async("blob"));if(upload.error){missingAttachments.push(oldPath);continue;}const updates=await Promise.all([db.from("tracker_attachments").update({storage_path:newPath}).eq("workspace_id",result.workspaceId).eq("storage_path",oldPath),db.from("project_deliverables").update({storage_path:newPath}).eq("workspace_id",result.workspaceId).eq("storage_path",oldPath),db.from("invoice_payments").update({proof_path:newPath}).eq("workspace_id",result.workspaceId).eq("proof_path",oldPath)]);if(updates.some(update=>update.error))missingAttachments.push(oldPath);else restoredAttachments++;}}return{...result,restoredAttachments,missingAttachments} as {workspaceId:string;name:string;restored:Record<string,number>;restoredAttachments:number;missingAttachments:string[]};}

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
