export type LeadStage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
export type ProposalStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type ProjectStatus = "planning" | "active" | "review" | "completed" | "on_hold";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  service: string;
  source: string;
  stage: LeadStage;
  estimatedValue: number;
  nextFollowUp: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  projects: number;
  lifetimeValue: number;
  status: "active" | "inactive";
  joinedAt: string;
}

export interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Proposal {
  id: string;
  number: string;
  leadId?: string;
  clientId?: string;
  clientName: string;
  title: string;
  status: ProposalStatus;
  validUntil: string;
  createdAt: string;
  items: ProposalItem[];
  projectId?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface ProjectDeliverable {
  id: string;
  name: string;
  kind: "file" | "external_link";
  location: string;
  version: number;
  status: "draft" | "submitted" | "approved";
}

export interface ProjectRevision {
  id: string;
  deliverableId: string;
  request: string;
  status: "open" | "resolved";
  requestedAt: string;
}

export interface Project {
  id: string;
  proposalId?: string;
  clientId: string;
  clientName: string;
  title: string;
  status: ProjectStatus;
  budget: number;
  startDate: string;
  dueDate: string;
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  deliverables: ProjectDeliverable[];
  revisions: ProjectRevision[];
  links: { id: string; label: string; url: string }[];
}
