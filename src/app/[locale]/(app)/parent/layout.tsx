import { requireRole } from "@/lib/route-guard";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["parent"]);
  return children;
}