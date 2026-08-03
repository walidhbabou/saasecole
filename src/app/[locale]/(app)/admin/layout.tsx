import { requireRole } from "@/lib/route-guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"]);
  return children;
}