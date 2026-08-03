import { requireRole } from "@/lib/route-guard";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["teacher"]);
  return children;
}