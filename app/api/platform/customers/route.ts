import {NextResponse} from "next/server";
import {z} from "zod";
import {requirePlatformAdmin} from "@/lib/supabase/server";

const schema=z.object({email:z.email(),password:z.string().min(8),displayName:z.string().min(2).max(100),workspaceName:z.string().min(2).max(120),businessType:z.string().min(2).max(50).default("agency")});

export async function GET(){
  try{
    const {admin}=await requirePlatformAdmin();
    const [{data:workspaces,error},{data:memberships},users]=await Promise.all([
      admin.from("workspaces").select("id,name,slug,business_type,status,created_at").order("created_at",{ascending:false}),
      admin.from("workspace_memberships").select("workspace_id,user_id,role,is_active").eq("role","owner"),
      admin.auth.admin.listUsers({page:1,perPage:1000}),
    ]);
    if(error)throw error;if(users.error)throw users.error;
    const emailById=new Map((users.data.users||[]).map(user=>[user.id,user.email]));
    return NextResponse.json({customers:(workspaces||[]).map(workspace=>{const owner=memberships?.find(member=>member.workspace_id===workspace.id);return{...workspace,ownerEmail:owner?emailById.get(owner.user_id):undefined,ownerId:owner?.user_id};})});
  }catch(cause){const error=cause as Error&{status?:number};return NextResponse.json({error:error.message},{status:error.status||503});}
}

export async function POST(request:Request){
  let createdUserId:string|undefined;let createdWorkspaceId:string|undefined;
  try{
    const {user,admin}=await requirePlatformAdmin();const input=schema.parse(await request.json());
    const created=await admin.auth.admin.createUser({email:input.email,password:input.password,email_confirm:true,user_metadata:{display_name:input.displayName}});if(created.error)throw created.error;createdUserId=created.data.user.id;
    const slug=`${input.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"workspace"}-${crypto.randomUUID().slice(0,8)}`;
    const workspace=await admin.from("workspaces").insert({name:input.workspaceName,slug,business_type:input.businessType,status:"active",created_by:createdUserId}).select("id").single();if(workspace.error)throw workspace.error;createdWorkspaceId=workspace.data.id;
    const membership=await admin.from("workspace_memberships").insert({workspace_id:createdWorkspaceId,user_id:createdUserId,role:"owner"});if(membership.error)throw membership.error;
    const settings=await admin.from("workspace_settings").insert({workspace_id:createdWorkspaceId,onboarding_step:4,onboarding_completed_at:new Date().toISOString()});if(settings.error)throw settings.error;
    const defaults=await admin.rpc("initialize_workspace_business_defaults",{target_workspace_id:createdWorkspaceId});if(defaults.error)throw defaults.error;
    const audit=await admin.from("audit_logs").insert({workspace_id:createdWorkspaceId,actor_id:user.id,action:"platform.customer_provisioned",entity_type:"workspace",entity_id:createdWorkspaceId,new_values:{email:input.email,businessType:input.businessType}});if(audit.error)throw audit.error;
    return NextResponse.json({workspaceId:createdWorkspaceId,userId:createdUserId},{status:201});
  }catch(cause){
    try{const {admin}=await requirePlatformAdmin();if(createdWorkspaceId)await admin.from("workspaces").delete().eq("id",createdWorkspaceId);if(createdUserId)await admin.auth.admin.deleteUser(createdUserId);}catch{}
    const error=cause as Error&{status?:number};return NextResponse.json({error:error.message},{status:error.status||400});
  }
}
