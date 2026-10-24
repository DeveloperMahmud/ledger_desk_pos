import { z } from "zod";

export const setupSchema = z.object({
  businessName: z.string().trim().min(2, "Business name must be at least 2 characters."),
  businessType: z.enum(["agency", "retail", "service", "manufacturing"]),
  language: z.enum(["english", "bangla", "both"]),
  currency: z.enum(["BDT", "USD", "BDT_USD"]),
  accountingMode: z.enum(["basic", "full"]),
  invoiceTemplate: z.enum(["modern", "minimal", "classic", "tax"]),
});

export type SetupValues = z.infer<typeof setupSchema>;

export const defaultSetup: SetupValues = {
  businessName: "",
  businessType: "agency",
  language: "both",
  currency: "BDT_USD",
  accountingMode: "basic",
  invoiceTemplate: "modern",
};

export function workspaceSlug(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "workspace";
}

export function getSetupProgress(values: Partial<SetupValues>) {
  const required: (keyof SetupValues)[] = [
    "businessName",
    "businessType",
    "language",
    "currency",
    "accountingMode",
    "invoiceTemplate",
  ];
  const completed = required.filter((key) => Boolean(values[key])).length;
  return Math.round((completed / required.length) * 100);
}
