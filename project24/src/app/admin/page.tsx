import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminGate } from "@/components/admin/AdminGate";
import { adminConfigured, isAdmin } from "@/server/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminConfigured()) return <AdminGate disabled />;
  if (!(await isAdmin())) return <AdminGate />;
  return <AdminDashboard />;
}
