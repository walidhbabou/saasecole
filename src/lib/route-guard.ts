import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import permissions from "./permissions.js";

export async function requireRole(allowedRoles: string[]) {
  const locale = await getLocale();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect(`/${locale}/login`);
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect(`/${locale}${permissions.dashboardPathForRole(profile.role)}`);
  }

  return { locale, role: profile.role };
}