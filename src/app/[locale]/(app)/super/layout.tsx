import { requireRole } from "@/lib/route-guard";

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["super"]);
  return children;
}