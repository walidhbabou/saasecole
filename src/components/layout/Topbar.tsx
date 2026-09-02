"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Search, Menu, LogOut, User, ChevronDown, Globe } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import type { AppProfile } from "@/components/layout/AppShell";

const ROLE_LABELS: Record<string, { fr: string; ar: string; en: string }> = {
  super:   { fr: "Super Admin",  ar: "مشرف المنصة", en: "Super Admin" },
  admin:   { fr: "Directeur",    ar: "مدير", en: "Principal" },
  teacher: { fr: "Enseignant",   ar: "أستاذ", en: "Teacher" },
  parent:  { fr: "Parent",       ar: "ولي أمر", en: "Parent" },
};

interface TopbarProps {
  onToggleSidebar: () => void;
  profile: AppProfile;
}

export function Topbar({ onToggleSidebar, profile }: TopbarProps) {
  const locale   = useLocale();
  const pathname = usePathname();
  const router   = useRouter();
  const isAr     = locale === "ar";
  const isEn     = locale === "en";
  const nextLocale = locale === "fr" ? "ar" : locale === "ar" ? "en" : "fr";

  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const fullName  = `${profile.first_name} ${profile.last_name}`.trim();
  const initials  = getInitials(profile.first_name, profile.last_name);
  const roleLabel = ROLE_LABELS[profile.role]?.[isAr ? "ar" : isEn ? "en" : "fr"] ?? profile.role;

  const switchLocale = () => {
    const newPath = pathname.replace(/^\/(fr|ar|en)/, `/${nextLocale}`);
    router.push(newPath);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="text-slate-500 hover:text-slate-700">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 max-w-xs hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder={isAr ? "بحث..." : "Rechercher..."} className="pl-9 h-8 bg-slate-50 border-slate-200 text-sm" />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={switchLocale}
          className="text-slate-500 hover:text-slate-700 gap-1.5 text-xs font-medium h-8">
          <Globe className="h-3.5 w-3.5" />
          {nextLocale.toUpperCase()}
        </Button>

        <NotificationsPanel isAr={isAr} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl pl-1 pr-2 py-1 hover:bg-slate-100 transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[11px] bg-emerald-100 text-emerald-700">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-none">{fullName}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{roleLabel}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-semibold">{fullName}</p>
              <p className="text-xs text-slate-400 font-normal">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/${locale}/profile`)}>
              <User className="h-4 w-4" />
              {isAr ? "ملفي الشخصي" : isEn ? "My profile" : "Mon profil"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {isAr ? "تسجيل الخروج" : isEn ? "Log out" : "Déconnexion"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
