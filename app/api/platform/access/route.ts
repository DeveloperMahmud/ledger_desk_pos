import {NextResponse} from "next/server";
import {createSupabaseSessionClient} from "@/lib/supabase/server";
export async function GET(){try{const session=await createSupabaseSessionClient();const {data:{user}}=await session.auth.getUser();if(!user)return NextResponse.json({isPlatformAdmin:false});const {data}=await session.from("platform_admins").select("user_id").eq("user_id",user.id).maybeSingle();return NextResponse.json({isPlatformAdmin:Boolean(data)});}catch{return NextResponse.json({isPlatformAdmin:false});}}
