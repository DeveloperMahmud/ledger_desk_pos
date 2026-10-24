import { describe, expect, it } from "vitest";
import { defaultSetup, getSetupProgress, setupSchema, workspaceSlug } from "@/lib/setup";

describe("workspace setup", () => {
  it("requires a business name", () => {
    expect(setupSchema.safeParse(defaultSetup).success).toBe(false);
  });

  it("accepts a completed default agency setup", () => {
    const result = setupSchema.safeParse({ ...defaultSetup, businessName: "Northstar Studio" });
    expect(result.success).toBe(true);
  });

  it("calculates setup completion", () => {
    expect(getSetupProgress(defaultSetup)).toBe(83);
    expect(getSetupProgress({ ...defaultSetup, businessName: "Northstar Studio" })).toBe(100);
  });
});

describe("workspaceSlug", () => {
  it("creates a safe database slug", () => {
    expect(workspaceSlug("  Northstar Creative Studio!  ")).toBe("northstar-creative-studio");
    expect(workspaceSlug("***")).toBe("workspace");
  });
});
