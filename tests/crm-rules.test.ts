import { describe, expect, it } from "vitest";
import { canConvertProposal, convertLeadToClient, createProjectFromProposal, projectProgress, proposalTotal } from "@/lib/crm/rules";
import type { Lead, Proposal } from "@/lib/crm/types";

const acceptedProposal: Proposal = { id: "p1", number: "P-1", clientId: "c1", clientName: "Example Client", title: "Website", status: "accepted", validUntil: "30 Nov", createdAt: "24 Oct", items: [{ id: "i1", description: "Design", quantity: 2, unitPrice: 15000 }] };

describe("CRM and project rules", () => {
  it("calculates proposal totals", () => expect(proposalTotal(acceptedProposal.items)).toBe(30000));
  it("allows only accepted, unconverted proposals", () => {
    expect(canConvertProposal(acceptedProposal)).toBe(true);
    expect(canConvertProposal({ ...acceptedProposal, status: "sent" })).toBe(false);
    expect(canConvertProposal({ ...acceptedProposal, projectId: "project-1" })).toBe(false);
  });
  it("creates a project from an accepted proposal", () => {
    const project = createProjectFromProposal(acceptedProposal, "c1");
    expect(project.budget).toBe(30000);
    expect(project.status).toBe("planning");
  });
  it("rejects project creation from an unaccepted proposal", () => expect(() => createProjectFromProposal({ ...acceptedProposal, status: "draft" }, "c1")).toThrow());
  it("calculates project progress from completed tasks", () => expect(projectProgress({ tasks: [{ id: "1", title: "A", status: "done", assignee: "A", dueDate: "Today" }, { id: "2", title: "B", status: "todo", assignee: "B", dueDate: "Tomorrow" }] })).toBe(50));
  it("converts an active lead to a client but rejects lost leads", () => {
    const lead: Lead = { id: "l1", name: "Nadia", company: "Orbit", email: "n@example.com", service: "Website", source: "Referral", stage: "qualified", estimatedValue: 1000, nextFollowUp: "Today" };
    expect(convertLeadToClient(lead).company).toBe("Orbit");
    expect(() => convertLeadToClient({ ...lead, stage: "lost" })).toThrow();
  });
});
