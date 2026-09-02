"use client";
import { useState } from "react";
import { GraduationCap, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export function LandingNavbar() {
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isAr = locale === "ar";

  const isEn = locale === "en";
  const navLinks = isAr
    ? [{ label: "المميزات", href: "#features" }, { label: "الأسعار", href: "#pricing" }, { label: "تسجيل الدخول", href: `/${locale}/login` }]
    : isEn
      ? [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Log in", href: `/${locale}/login` }]
      : [{ label: "Fonctionnalités", href: "#features" }, { label: "Tarifs", href: "#pricing" }, { label: "Connexion", href: `/${locale}/login` }];

  const nextLocale = locale === "fr" ? "ar" : locale === "ar" ? "en" : "fr";

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href={`/${locale}`} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/30">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              {isAr ? "مدرستي" : "Madrasati"}
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.slice(0, 2).map((l) => (
              <a key={l.label} href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => router.push(`/${nextLocale}` + window.location.pathname.replace(/^\/(fr|ar|en)/, ""))}
              className="text-xs text-slate-400 hover:text-white font-medium px-2 py-1 rounded border border-slate-700 hover:border-slate-500 transition-colors"
            >
              {nextLocale.toUpperCase()}
            </button>
            <a href={`/${locale}/login`}>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10">
                {isAr ? "دخول" : isEn ? "Log in" : "Connexion"}
              </Button>
            </a>
            <a href={`/${locale}/login`}>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30">
                {isAr ? "جرّب مجاناً" : isEn ? "Start for free" : "Démarrer gratuitement"}
              </Button>
            </a>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-2">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="block px-2 py-2 text-slate-300 hover:text-white text-sm">
                {l.label}
              </a>
            ))}
            <a href={`/${locale}/login`} className="block">
              <Button className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400">
                {isAr ? "جرّب مجاناً" : isEn ? "Start for free" : "Démarrer gratuitement"}
              </Button>
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
