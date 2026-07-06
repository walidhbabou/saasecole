import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await sb
    .from("profiles")
    .select("role, first_name, last_name, school:schools(name)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const school = (Array.isArray(profile.school) ? profile.school[0] : profile.school) as { name: string } | null;

  return (
    <AppShell
      profile={{
        role: profile.role,
        first_name: profile.first_name,
        last_name: profile.last_name,
        school_name: school?.name ?? (profile.role === "super" ? "Platform Console" : ""),
      }}
    >
      {children}
    </AppShell>
  );
}
