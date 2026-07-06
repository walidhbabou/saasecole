import { getLocale } from "next-intl/server";
import { getProfile, getFees } from "@/lib/dal";
import { FeesClient } from "./_client";

export default async function AdminFeesPage() {
  const locale = await getLocale();
  const profile = await getProfile();
  const fees = await getFees(profile?.school_id ?? "");
  return <FeesClient fees={fees} locale={locale} />;
}
