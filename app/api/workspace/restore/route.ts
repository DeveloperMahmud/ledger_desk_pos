import {NextResponse} from "next/server";
import {createSupabaseAdminClient,createSupabaseSessionClient} from "@/lib/supabase/server";

type Row=Record<string,unknown>;
type Config={table:string;refs?:Record<string,string>;strip?:string[]};
const configs:Config[]=[
  {table:"units"},{table:"product_categories",refs:{parent_id:"product_categories"}},{table:"catalog_items",refs:{category_id:"product_categories",unit_id:"units"},strip:["tracks_stock"]},
  {table:"branches"},{table:"inventory_locations",refs:{branch_id:"branches"}},{table:"stock_balances",refs:{item_id:"catalog_items"}},{table:"stock_movements",refs:{item_id:"catalog_items"}},{table:"stock_adjustments",refs:{item_id:"catalog_items",movement_id:"stock_movements"}},
  {table:"crm_leads",strip:["converted_client_id"]},{table:"crm_clients",strip:["source_lead_id"]},{table:"crm_contacts",refs:{client_id:"crm_clients"}},{table:"service_packages"},
  {table:"proposals",refs:{lead_id:"crm_leads",client_id:"crm_clients"}},{table:"proposal_items",refs:{proposal_id:"proposals"}},{table:"projects",refs:{proposal_id:"proposals",client_id:"crm_clients"}},{table:"project_tasks",refs:{project_id:"projects"}},{table:"project_milestones",refs:{project_id:"projects"}},{table:"project_deliverables",refs:{project_id:"projects"}},{table:"project_revisions",refs:{project_id:"projects",deliverable_id:"project_deliverables"}},{table:"project_links",refs:{project_id:"projects"}},
  {table:"invoice_templates"},{table:"invoices",refs:{client_id:"crm_clients",project_id:"projects",template_id:"invoice_templates"}},{table:"invoice_items",refs:{invoice_id:"invoices",catalog_item_id:"catalog_items"},strip:["line_total"]},{table:"invoice_payments",refs:{invoice_id:"invoices"}},
  {table:"ledger_accounts"},{table:"money_accounts"},{table:"financial_transactions",refs:{money_account_id:"money_accounts",category_account_id:"ledger_accounts"},strip:["journal_entry_id"]},{table:"accounting_periods"},{table:"journal_entries",strip:["reversal_of_id"]},{table:"journal_lines",refs:{journal_entry_id:"journal_entries",account_id:"ledger_accounts"}},{table:"email_templates"},
  {table:"suppliers"},{table:"purchase_orders",refs:{supplier_id:"suppliers",branch_id:"branches"}},{table:"purchase_order_items",refs:{purchase_order_id:"purchase_orders",inventory_item_id:"catalog_items"},strip:["line_total"]},{table:"stock_transfers",refs:{from_location_id:"inventory_locations",to_location_id:"inventory_locations"}},{table:"stock_transfer_items",refs:{transfer_id:"stock_transfers",inventory_item_id:"catalog_items"}},{table:"bills_of_materials",refs:{output_item_id:"catalog_items"}},{table:"bill_of_material_items",refs:{bill_of_material_id:"bills_of_materials",input_item_id:"catalog_items"}},{table:"production_orders",refs:{bill_of_material_id:"bills_of_materials",location_id:"inventory_locations"}},{table:"recurring_invoice_profiles",refs:{client_id:"crm_clients",template_id:"invoice_templates"}},
  {table:"money_books"},{table:"tracker_accounts",refs:{book_id:"money_books"}},{table:"tracker_categories",refs:{book_id:"money_books"},strip:["parent_id"]},{table:"tracker_import_batches",refs:{book_id:"money_books"}},{table:"tracker_transfer_groups",refs:{book_id:"money_books"}},{table:"tracker_transactions",refs:{book_id:"money_books",account_id:"tracker_accounts",category_id:"tracker_categories",transfer_group_id:"tracker_transfer_groups",import_batch_id:"tracker_import_batches"}},{table:"tracker_budgets",refs:{book_id:"money_books",category_id:"tracker_categories"}},{table:"tracker_goals",refs:{book_id:"money_books"}},{table:"tracker_recurring_rules",refs:{book_id:"money_books",account_id:"tracker_accounts",category_id:"tracker_categories"}},{table:"tracker_attachments",refs:{transaction_id:"tracker_transactions"}},
];

export async function POST(request:Request){
  let workspaceId:string|undefined;
  try{
    const session=await createSupabaseSessionClient();
    const {data:{user}}=await session.auth.getUser();
    if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
    const body=await request.json() as {format?:string;version?:number;data?:Record<string,unknown>};
    if(body.format!=="ledgerdesk-workspace-backup"||!body.data||!body.version||body.version>2)return NextResponse.json({error:"Unsupported or invalid LedgerDesk backup."},{status:400});
    const sourceWorkspace=(body.data.workspaces as Row[]|undefined)?.[0];
    if(!sourceWorkspace)return NextResponse.json({error:"Backup has no workspace record."},{status:400});
    const admin=createSupabaseAdminClient();
    const name=`${String(sourceWorkspace.name||"Restored workspace")} (Restored)`;
    const slug=`${String(sourceWorkspace.slug||"restored").replace(/[^a-z0-9-]/gi,"-").toLowerCase()}-restore-${crypto.randomUUID().slice(0,8)}`;
    const created=await admin.from("workspaces").insert({name,slug,business_type:sourceWorkspace.business_type||"agency",status:"active",created_by:user.id}).select("id").single();
    if(created.error)throw created.error;
    workspaceId=created.data.id;
    const member=await admin.from("workspace_memberships").insert({workspace_id:workspaceId,user_id:user.id,role:"owner"});
    if(member.error)throw member.error;
    const sourceSettings=(body.data.workspace_settings as Row[]|undefined)?.[0]||{};
    const settings:Row={...sourceSettings,workspace_id:workspaceId};delete settings.created_at;delete settings.updated_at;
    const settingsInsert=await admin.from("workspace_settings").insert(settings);if(settingsInsert.error)throw settingsInsert.error;
    const sourceSequence=(body.data.invoice_sequences as Row[]|undefined)?.[0];
    const sequence=await admin.from("invoice_sequences").insert({workspace_id:workspaceId,prefix:String(sourceSequence?.prefix||"INV"),next_number:Number(sourceSequence?.next_number||1),reset_yearly:sourceSequence?.reset_yearly!==false,sequence_year:Number(sourceSequence?.sequence_year||new Date().getFullYear())});if(sequence.error)throw sequence.error;

    const maps=new Map<string,Map<string,string>>();const restored:Record<string,number>={};
    const userColumns=new Set(["created_by","updated_by","uploaded_by","actor_id","invited_by","posted_by","assigned_to"]);
    for(const config of configs){
      const source=body.data[config.table];if(!Array.isArray(source)||!source.length)continue;
      const idMap=new Map<string,string>();maps.set(config.table,idMap);let count=0;
      for(const raw of source as Row[]){
        const row:Row={...raw,workspace_id:workspaceId};const oldId=typeof row.id==="string"?row.id:undefined;delete row.id;delete row.created_at;delete row.updated_at;delete row.joined_at;
        for(const column of userColumns)if(column in row)row[column]=column==="assigned_to"?null:user.id;
        for(const column of config.strip||[])delete row[column];
        for(const [column,target] of Object.entries(config.refs||{})){const value=row[column];if(typeof value==="string")row[column]=maps.get(target)?.get(value)||null;}
        if(oldId){const inserted=await admin.from(config.table).insert(row).select("id").single();if(inserted.error)throw new Error(`${config.table}: ${inserted.error.message}`);idMap.set(oldId,String(inserted.data.id));}
        else{const inserted=await admin.from(config.table).insert(row);if(inserted.error)throw new Error(`${config.table}: ${inserted.error.message}`);}
        count++;
      }
      restored[config.table]=count;
    }
    await admin.from("audit_logs").insert({workspace_id:workspaceId,actor_id:user.id,action:"workspace.restored",entity_type:"workspace",entity_id:workspaceId,new_values:{backupVersion:body.version,restored}});
    return NextResponse.json({workspaceId,name,restored});
  }catch(cause){
    if(workspaceId){try{await createSupabaseAdminClient().from("workspaces").delete().eq("id",workspaceId);}catch{}}
    return NextResponse.json({error:cause instanceof Error?cause.message:"Restore failed."},{status:400});
  }
}
