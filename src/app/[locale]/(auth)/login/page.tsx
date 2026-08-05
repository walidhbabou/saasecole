import { getLocale } from "next-intl/server";
import { getLoginDemoUsers, getLoginPlatformStats } from "@/lib/dal";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  const locale = await getLocale();

  const [demoUsers, platformStats] = await Promise.all([
    getLoginDemoUsers(),
    getLoginPlatformStats(),
  ]);

  return <LoginClient locale={locale} demoUsers={demoUsers} platformStats={platformStats} />;
}