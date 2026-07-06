import { getLocale } from "next-intl/server";
import { getAllSchools } from "@/lib/dal";
import { SuperSchoolsClient } from "./_client";

export default async function SuperSchoolsPage() {
  const locale = await getLocale();
  const schools = await getAllSchools();
  return <SuperSchoolsClient schools={schools} locale={locale} />;
}
