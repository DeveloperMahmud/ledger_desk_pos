import "server-only";
import {cookies} from "next/headers";
import {createServerClient} from "@supabase/ssr";
import {createClient} from "@supabase/supabase-js";

export async function createSupabaseSessionClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)throw new Error("Supabase is not configured.");const store=await cookies();return createServerClient(url,key,{cookies:{getAll:()=>store.getAll(),setAll(values){try{values.forEach(({name,value,options})=>store.set(name,value,options));}catch{}}}});}
export function createSupabaseAdminClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});}
export async function requirePlatformAdmin(){const session=await createSupabaseSessionClient();const {data:{user}}=await session.auth.getUser();if(!user)throw Object.assign(new Error("Authentication required."),{status:401});const {data}=await session.from("platform_admins").select("user_id").eq("user_id",user.id).maybeSingle();if(!data)throw Object.assign(new Error("Platform administrator access required."),{status:403});return{user,session,admin:createSupabaseAdminClient()};}
