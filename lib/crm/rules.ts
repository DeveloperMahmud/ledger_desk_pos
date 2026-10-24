import type { Client, Lead, Project, Proposal, ProposalItem } from "./types";

export function proposalTotal(items: ProposalItem[]) {
  return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

export function projectProgress(project: Pick<Project, "tasks">) {
  if (!project.tasks.length) return 0;
  const completed = project.tasks.filter((task) => task.status === "done").length;
  return Math.round((completed / project.tasks.length) * 100);
}

export function canConvertProposal(proposal: Proposal) {
  return proposal.status === "accepted" && !proposal.projectId;
}

export function convertLeadToClient(lead: Lead, joinedAt = "Today"): Client {
  if (lead.stage === "lost") throw new Error("A lost lead cannot be converted.");
  return {
    id: `client-${lead.id}`,
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    projects: 0,
    lifetimeValue: 0,
    status: "active",
    joinedAt,
  };
}

export function createProjectFromProposal(proposal: Proposal, clientId: string): Project {
  if (!canConvertProposal(proposal)) throw new Error("Only an unconverted accepted proposal can become a project.");
  return {
    id: `project-${proposal.id}`,
    proposalId: proposal.id,
    clientId,
    clientName: proposal.clientName,
    title: proposal.title,
    status: "planning",
    budget: proposalTotal(proposal.items),
    startDate: "Today",
    dueDate: proposal.validUntil,
    tasks: [],
    milestones: [],
    deliverables: [],
    revisions: [],
    links: [],
  };
}
