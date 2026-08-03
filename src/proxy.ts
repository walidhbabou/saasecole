import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];

const ROLE_HOME: Record<string, string> = {
  super:   "/super/dashboard",
  admin:   "/admin/dashboard",
  teacher: "/teacher/dashboard",
  parent:  "/parent/dashboard",
};

const ROLE_PREFIX: Record<string, string> = {
  super:   "/super",
  admin:   "/admin",
  teacher: "/teacher",
  parent:  "/parent",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameWithoutLocale = pathname.replace(/^\/(fr|ar)/, "") || "/";
  const locale = pathname.match(/^\/(fr|ar)/)?.[1] ?? "fr";

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathnameWithoutLocale === p || pathnameWithoutLocale.startsWith(p + "/")
  );

  if (isPublicPath) return intlMiddleware(request);

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (pathnameWithoutLocale === "/") return intlMiddleware(request);
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;

  if (role) {
    const allowedPrefix = ROLE_PREFIX[role];
    const protectedPrefixes = Object.values(ROLE_PREFIX);
    const accessingProtected = protectedPrefixes.find(p => pathnameWithoutLocale.startsWith(p));

    if (accessingProtected && accessingProtected !== allowedPrefix) {
      return NextResponse.redirect(new URL(`/${locale}${ROLE_HOME[role]}`, request.url));
    }

    if (pathnameWithoutLocale === "/") {
      return NextResponse.redirect(new URL(`/${locale}${ROLE_HOME[role]}`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
