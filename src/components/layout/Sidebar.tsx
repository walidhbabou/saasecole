"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  CalendarCheck, CreditCard, Settings, School,
  Receipt, GraduationCap, ChevronRight, X, UserCog, Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppProfile } from "@/components/layout/AppShell";
import type { Role } from "@/types";

interface NavItem {
  labelFr: string;
  labelAr: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { labelFr: "Tableau de bord", labelAr: "لوحة التحكم", href: "/admin/dashboard", icon: LayoutDashboard },
    { labelFr: "Élèves",          labelAr: "التلاميذ",    href: "/admin/students",  icon: Users },
    { labelFr: "Enseignants",     labelAr: "الأساتذة",    href: "/admin/teachers",  icon: UserCog },
    { labelFr: "Classes",         labelAr: "الأقسام",     href: "/admin/classes",   icon: BookOpen },
    { labelFr: "Inscriptions",    labelAr: "التسجيلات",   href: "/admin/enrollments", icon: ClipboardList },
    { labelFr: "Présences",       labelAr: "الحضور",      href: "/admin/attendance", icon: CalendarCheck },
    { labelFr: "Parents",          labelAr: "أولياء الأمور", href: "/admin/parents",  icon: Contact },
    { labelFr: "Frais scolaires", labelAr: "الرسوم",      href: "/admin/fees",      icon: CreditCard },
    { labelFr: "Paramètres",      labelAr: "الإعدادات",   href: "/admin/settings",  icon: Settings },
  ],
  teacher: [
    { labelFr: "Tableau de bord", labelAr: "لوحة التحكم", href: "/teacher/dashboard", icon: LayoutDashboard },
    { labelFr: "Faire l'appel",   labelAr: "تسجيل الحضور", href: "/teacher/attendance", icon: CalendarCheck },
    { labelFr: "Mes élèves",      labelAr: "تلاميذي",     href: "/teacher/students", icon: Users },
  ],
  parent: [
    { labelFr: "Tableau de bord", labelAr: "لوحة التحكم", href: "/parent/dashboard", icon: LayoutDashboard },
    { labelFr: "Présences",       labelAr: "الحضور",      href: "/parent/attendance", icon: CalendarCheck },
    { labelFr: "Frais scolaires", labelAr: "الرسوم",      href: "/parent/fees", icon: CreditCard },
  ],
  super: [
    { labelFr: "Tableau de bord", labelAr: "لوحة التحكم", href: "/super/dashboard", icon: LayoutDashboard },
    { labelFr: "Écoles",          labelAr: "المدارس",     href: "/super/schools",   icon: School },
    { labelFr: "Facturation",     labelAr: "الفوترة",     href: "/super/billing",   icon: Receipt },
  ],
};

const ROLE_LABELS: Record<Role, { fr: string; ar: string }> = {
  super:   { fr: "Super Admin",  ar: "مشرف المنصة" },
  admin:   { fr: "Directeur",    ar: "مدير" },
  teacher: { fr: "Enseignant",   ar: "أستاذ" },
  parent:  { fr: "Parent",       ar: "ولي أمر" },
};

interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
  profile: AppProfile;
}

export function Sidebar({ collapsed, onClose, profile }: SidebarProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const isAr = locale === "ar";
  const role = (profile.role as Role) in NAV_ITEMS ? (profile.role as Role) : "admin";
  const navItems = NAV_ITEMS[role];
  const roleLabel = ROLE_LABELS[role]?.[isAr ? "ar" : "fr"] ?? role;

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-slate-900 text-white transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-slate-800">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {isAr ? "مدرستي" : "Madrasati"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{profile.school_name}</p>
          </div>
        )}
        {onClose && !collapsed && (
          <button onClick={onClose} className="text-slate-400 hover:text-white ml-auto md:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.endsWith(item.href) || pathname.includes(item.href + "/");
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? (isAr ? item.labelAr : item.labelFr) : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{isAr ? item.labelAr : item.labelFr}</span>
                  {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800">
          <div className="rounded-xl bg-slate-800 px-3 py-2.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">
              {isAr ? "الدور" : "Rôle"}
            </p>
            <p className="text-xs text-slate-300 font-medium">{roleLabel}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
