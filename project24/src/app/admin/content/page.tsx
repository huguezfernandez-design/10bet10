import { AdminGate } from "@/components/admin/AdminGate";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { adminConfigured, isAdmin } from "@/server/admin-auth";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  if (!adminConfigured()) return <AdminGate disabled />;
  if (!(await isAdmin())) return <AdminGate />;
  return <ContentEditor />;
}
