import {redirect} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {PlatformAdminDashboard} from "@/components/platform/platform-admin-dashboard";
import {requirePlatformAdmin} from "@/lib/supabase/server";

export default async function AdminPage(){try{await requirePlatformAdmin();}catch{redirect("/login?next=/admin");}return <AppShell><PlatformAdminDashboard/></AppShell>}
