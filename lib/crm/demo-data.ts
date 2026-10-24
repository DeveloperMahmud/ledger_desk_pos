import type { Client, Lead, Project, Proposal } from "./types";

export const leads: Lead[] = [
  { id: "lead-orbit", name: "Nadia Rahman", company: "Orbit Commerce", email: "nadia@orbit.example", phone: "+880 17 1234 0088", service: "E-commerce website", source: "Referral", stage: "qualified", estimatedValue: 85000, nextFollowUp: "26 Oct" },
  { id: "lead-aurora", name: "Fahim Ahmed", company: "Aurora Foods", email: "fahim@aurora.example", service: "Brand identity", source: "Facebook", stage: "proposal", estimatedValue: 42000, nextFollowUp: "25 Oct" },
  { id: "lead-nova", name: "Sadia Islam", company: "Nova Learning", email: "sadia@nova.example", service: "Learning portal", source: "Website", stage: "contacted", estimatedValue: 120000, nextFollowUp: "28 Oct" },
  { id: "lead-print", name: "Rakib Hasan", company: "Print Hub", email: "rakib@printhub.example", service: "Monthly design support", source: "Walk-in", stage: "new", estimatedValue: 25000, nextFollowUp: "Today" },
];

export const clients: Client[] = [
  { id: "client-bright", name: "Tahmina Chowdhury", company: "Bright Dental", email: "tahmina@bright.example", projects: 3, lifetimeValue: 138000, status: "active", joinedAt: "12 Jul 2026" },
  { id: "client-kite", name: "Adnan Karim", company: "Kite Logistics", email: "adnan@kite.example", projects: 2, lifetimeValue: 92000, status: "active", joinedAt: "03 Sep 2026" },
  { id: "client-mango", name: "Maliha Noor", company: "Mango Home", email: "maliha@mango.example", projects: 1, lifetimeValue: 36000, status: "active", joinedAt: "18 Oct 2026" },
];

export const proposals: Proposal[] = [
  { id: "prop-024", number: "PROP-2026-024", leadId: "lead-aurora", clientName: "Aurora Foods", title: "Brand identity system", status: "sent", validUntil: "02 Nov 2026", createdAt: "23 Oct 2026", items: [{ id: "pi-1", description: "Brand identity kit", quantity: 1, unitPrice: 42000 }] },
  { id: "prop-023", number: "PROP-2026-023", clientId: "client-bright", clientName: "Bright Dental", title: "Patient portal redesign", status: "accepted", validUntil: "15 Dec 2026", createdAt: "20 Oct 2026", items: [{ id: "pi-2", description: "UX and UI design", quantity: 1, unitPrice: 65000 }, { id: "pi-3", description: "Frontend implementation", quantity: 1, unitPrice: 80000 }] },
  { id: "prop-022", number: "PROP-2026-022", clientId: "client-kite", clientName: "Kite Logistics", title: "Campaign landing pages", status: "draft", validUntil: "08 Nov 2026", createdAt: "18 Oct 2026", items: [{ id: "pi-4", description: "Landing page", quantity: 3, unitPrice: 18000 }] },
];

export const projects: Project[] = [
  {
    id: "bright-portal", proposalId: "prop-019", clientId: "client-bright", clientName: "Bright Dental", title: "Bright Dental Website", status: "active", budget: 95000, startDate: "01 Oct 2026", dueDate: "12 Nov 2026",
    tasks: [
      { id: "t1", title: "Finalize responsive homepage", status: "done", assignee: "Mahmudul", dueDate: "18 Oct" },
      { id: "t2", title: "Build appointment flow", status: "in_progress", assignee: "Mahmudul", dueDate: "29 Oct" },
      { id: "t3", title: "Client content review", status: "review", assignee: "Tahmina", dueDate: "02 Nov" },
      { id: "t4", title: "Production launch", status: "todo", assignee: "Mahmudul", dueDate: "12 Nov" },
    ],
    milestones: [{ id: "m1", title: "Design approval", dueDate: "17 Oct", completed: true }, { id: "m2", title: "Development complete", dueDate: "05 Nov", completed: false }, { id: "m3", title: "Launch", dueDate: "12 Nov", completed: false }],
    deliverables: [{ id: "d1", name: "Homepage UI v2", kind: "external_link", location: "https://figma.com/", version: 2, status: "approved" }, { id: "d2", name: "Website staging", kind: "external_link", location: "https://example.com/", version: 1, status: "submitted" }],
    revisions: [{ id: "r1", deliverableId: "d2", request: "Increase appointment button contrast on mobile.", status: "open", requestedAt: "24 Oct" }],
    links: [{ id: "l1", label: "Figma workspace", url: "https://figma.com/" }, { id: "l2", label: "Client assets", url: "https://drive.google.com/" }],
  },
  {
    id: "kite-dashboard", clientId: "client-kite", clientName: "Kite Logistics", title: "Operations Dashboard", status: "review", budget: 78000, startDate: "15 Sep 2026", dueDate: "30 Oct 2026",
    tasks: [{ id: "kt1", title: "Dashboard QA", status: "done", assignee: "Mahmudul", dueDate: "22 Oct" }, { id: "kt2", title: "Client sign-off", status: "review", assignee: "Adnan", dueDate: "30 Oct" }],
    milestones: [{ id: "km1", title: "UAT", dueDate: "30 Oct", completed: false }], deliverables: [], revisions: [], links: [],
  },
  {
    id: "mango-catalog", clientId: "client-mango", clientName: "Mango Home", title: "Autumn Product Catalog", status: "planning", budget: 36000, startDate: "28 Oct 2026", dueDate: "18 Nov 2026",
    tasks: [{ id: "mt1", title: "Collect product images", status: "todo", assignee: "Maliha", dueDate: "30 Oct" }], milestones: [], deliverables: [], revisions: [], links: [],
  },
];

export function findProject(id: string) {
  return projects.find((project) => project.id === id);
}
