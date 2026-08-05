import type { Role } from "@/types";

// ─── Demo users ───────────────────────────────────────────
export interface DemoUser {
  role: Role;
  name: string;
  nameAr: string;
  email: string;
  school: string;
  schoolId: string;
  redirect: string;
  color: string;
  labelFr: string;
  labelAr: string;
}

// ─── Pricing plans ────────────────────────────────────────
export const PLANS = [
  {
    id: "starter",
    nameFr: "Starter",
    nameAr: "المبتدئ",
    price: 29,
    popular: false,
    color: "slate",
    featuresFr: [
      "Jusqu'à 300 élèves",
      "5 enseignants",
      "Gestion des présences",
      "Suivi des frais scolaires",
      "Interface bilingue FR/AR",
      "Support par email",
    ],
    featuresAr: [
      "حتى 300 تلميذ",
      "5 أساتذة",
      "إدارة الحضور والغياب",
      "متابعة الرسوم الدراسية",
      "واجهة ثنائية اللغة",
      "دعم عبر البريد الإلكتروني",
    ],
  },
  {
    id: "professional",
    nameFr: "Professional",
    nameAr: "الاحترافي",
    price: 79,
    popular: true,
    color: "emerald",
    featuresFr: [
      "Élèves et enseignants illimités",
      "Toutes les fonctionnalités",
      "Exports PDF & Excel",
      "Tableau de bord analytics",
      "Notifications SMS parents",
      "Support prioritaire",
    ],
    featuresAr: [
      "تلاميذ وأساتذة غير محدودين",
      "جميع الميزات",
      "تصدير PDF و Excel",
      "لوحة تحليلات متقدمة",
      "إشعارات SMS للآباء",
      "دعم ذو أولوية",
    ],
  },
  {
    id: "enterprise",
    nameFr: "Enterprise",
    nameAr: "المؤسسي",
    price: null,
    popular: false,
    color: "purple",
    featuresFr: [
      "Multi-établissements",
      "API personnalisée",
      "SSO / LDAP / Active Directory",
      "SLA garanti 99.9%",
      "Onboarding & formation dédiés",
      "Support 24/7",
    ],
    featuresAr: [
      "متعدد المؤسسات",
      "API مخصصة",
      "تسجيل الدخول الموحد SSO",
      "ضمان توفر 99.9%",
      "تدريب ودعم مخصص",
      "دعم على مدار الساعة",
    ],
  },
] as const;

// ─── Landing features ─────────────────────────────────────
export const LANDING_FEATURES = [
  {
    icon: "Users",
    titleFr: "Gestion des élèves",
    titleAr: "إدارة التلاميذ",
    descFr: "Fiches complètes, matricules, contacts parents. Import/export Excel en un clic.",
    descAr: "ملفات شاملة، أرقام تسجيل، بيانات الآباء. استيراد وتصدير Excel بنقرة واحدة.",
  },
  {
    icon: "CalendarCheck",
    titleFr: "Suivi des présences",
    titleAr: "متابعة الحضور والغياب",
    descFr: "Appel quotidien par classe, alertes automatiques aux parents, rapports mensuels.",
    descAr: "النداء اليومي بالقسم، تنبيهات تلقائية للآباء، تقارير شهرية مفصلة.",
  },
  {
    icon: "CreditCard",
    titleFr: "Frais scolaires",
    titleAr: "الرسوم الدراسية",
    descFr: "Plans de paiement flexibles, suivi des impayés, reçus automatiques.",
    descAr: "خطط دفع مرنة، متابعة المتأخرات، إيصالات تلقائية للآباء.",
  },
  {
    icon: "Globe",
    titleFr: "Bilingue FR / العربية",
    titleAr: "ثنائي اللغة FR / العربية",
    descFr: "Interface complète en français et arabe avec support RTL natif intégré.",
    descAr: "واجهة كاملة بالعربية والفرنسية مع دعم الكتابة من اليمين لليسار.",
  },
  {
    icon: "Shield",
    titleFr: "Multi-tenant sécurisé",
    titleAr: "نظام متعدد المستأجرين",
    descFr: "Isolation totale des données entre établissements. Conformité RGPD.",
    descAr: "عزل كامل للبيانات بين المؤسسات. متوافق مع معايير حماية البيانات.",
  },
  {
    icon: "BarChart3",
    titleFr: "Analytics temps réel",
    titleAr: "تحليلات فورية",
    descFr: "KPIs en temps réel : taux de présence, recouvrement des frais, évolution par classe.",
    descAr: "مؤشرات فورية: نسبة الحضور، تحصيل الرسوم، تطور الأداء بالأقسام.",
  },
] as const;

// ─── Pricing MRR lookup (single source of truth) ─────────
export const PLAN_MRR: Record<string, number> = {
  free: 0, basic: 29, starter: 29, pro: 79, professional: 79, enterprise: 299,
};

// ─── Academic data ────────────────────────────────────────
export const ACADEMIC_YEAR = "2025-2026";

export const LEVELS = ["CP", "CE1", "CE2", "CM1", "CM2"];
