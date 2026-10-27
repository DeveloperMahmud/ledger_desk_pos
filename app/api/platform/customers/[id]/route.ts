import {NextResponse} from "next/server";
import {z} from "zod";
import {requirePlatformAdmin} from "@/lib/supabase/server";
const schema=z.object({status:z.enum(["active","suspended","archived"])});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const {user,admin}=await requirePlatformAdmin();const {id}=await params;const input=schema.parse(await request.json());const result=await admin.from("workspaces").update({status:input.status}).eq("id",id).select("id").single();if(result.error)throw result.error;const audit=await admin.from("audit_logs").insert({workspace_id:id,actor_id:user.id,action:`platform.workspace_${input.status}`,entity_type:"workspace",entity_id:id,new_values:{status:input.status}});if(audit.error)throw audit.error;return NextResponse.json({ok:true});}catch(cause){const error=cause as Error&{status?:number};return NextResponse.json({error:error.message},{status:error.status||400});}}
