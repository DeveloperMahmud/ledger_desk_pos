import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "./config";

export function createSupabaseBrowserClient() {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error("Supabase is not configured. Add the public URL and anon key to .env.local.");
  }

  return createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey);
}
