import { createSupabaseBrowserClient } from "./client";

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
}

export async function getCurrentWorkspaceContext(): Promise<WorkspaceContext> {
  const supabase = createSupabaseBrowserClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Sign in to access live workspace data.");
  const { data: membership, error } = await supabase.from("workspace_memberships").select("workspace_id").eq("user_id", authData.user.id).eq("is_active", true).order("joined_at").limit(1).maybeSingle();
  if (error) throw error;
  if (!membership) throw new Error("Complete workspace setup before using live data.");
  return { workspaceId: membership.workspace_id, userId: authData.user.id };
}
