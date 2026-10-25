import { notFound } from "next/navigation";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { findProject, projects } from "@/lib/crm/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function generateStaticParams(){return projects.map(project=>({id:project.id}));}
export default async function ProjectPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const project=findProject(id);if(!project&&!isSupabaseConfigured())notFound();return <ProjectWorkspace projectId={id} initialProject={project}/>;}
