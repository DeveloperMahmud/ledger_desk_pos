import type { SetupValues } from "./setup";
import { workspaceSlug } from "./setup";
import { createSupabaseBrowserClient } from "./supabase/client";

export async function persistWorkspaceSetup(values: SetupValues) {
  const supabase = createSupabaseBrowserClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("Please sign in before creating your live workspace.");
  }

  const { data: workspaceId, error: createError } = await supabase.rpc("create_workspace_with_owner", {
    workspace_name: values.businessName,
    requested_slug: workspaceSlug(values.businessName),
    requested_business_type: values.businessType,
  });

  if (createError || !workspaceId) {
    throw new Error(createError?.message || "Workspace could not be created.");
  }

  const enabledCurrencies = values.currency === "BDT_USD" ? ["BDT", "USD"] : [values.currency];
  const { error: settingsError } = await supabase
    .from("workspace_settings")
    .update({
      onboarding_step: 4,
      onboarding_completed_at: new Date().toISOString(),
      language_mode: values.language,
      default_currency: enabledCurrencies[0],
      enabled_currencies: enabledCurrencies,
      accounting_mode: values.accountingMode,
      invoice_template: values.invoiceTemplate,
      module_flags: {
        inventory: true,
        invoicing: true,
        freelancing: values.businessType === "agency" || values.businessType === "service",
        pos: values.businessType === "retail",
        manufacturing: false,
        branches: false,
        fullAccounting: values.accountingMode === "full",
      },
    })
    .eq("workspace_id", workspaceId);

  if (settingsError) throw new Error(settingsError.message);

  const { error: workspaceError } = await supabase
    .from("workspaces")
    .update({ status: "active" })
    .eq("id", workspaceId);

  if (workspaceError) throw new Error(workspaceError.message);
  return workspaceId as string;
}
