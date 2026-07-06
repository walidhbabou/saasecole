"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { GraduationCap, Eye, EyeOff, Loader2, ArrowRight, Shield, Users, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEMO_USERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ROLE_COLORS = {
  purple: "border-purple-200 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 data-[active=true]:border-purple-500 data-[active=true]:bg-purple-50",
  blue:   "border-blue-200   bg-blue-50   hover:border-blue-400   hover:bg-blue-100   data-[active=true]:border-blue-500   data-[active=true]:bg-blue-50",
  emerald:"border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 data-[active=true]:border-emerald-500 data-[active=true]:bg-emerald-50",
  amber:  "border-amber-200  bg-amber-50  hover:border-amber-400  hover:bg-amber-100  data-[active=true]:border-amber-500  data-[active=true]:bg-amber-50",
};
const ROLE_ICON_BG = {
  purple: "bg-purple-100 text-purple-600",
  blue:   "bg-blue-100   text-blue-600",
  emerald:"bg-emerald-100 text-emerald-600",
  amber:  "bg-amber-100  text-amber-600",
};
const ROLE_ICONS = { purple: Shield, blue: School, emerald: Users, amber: Users };

// Rôle → chemin de redirection
const ROLE_REDIRECT: Record<string, string> = {
  super:   "/super/dashboard",
  admin:   "/admin/dashboard",
  teacher: "/teacher/dashboard",
  parent:  "/parent/dashboard",
};

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";
  const supabase = createClient();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError]       = useState("");

  const handleDemoSelect = (user: typeof DEMO_USERS[0]) => {
    setSelected(user.role);
    setEmail(user.email);
    setPassword("demo123");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Authentification Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError(isAr ? "بيانات الدخول غير صحيحة" : "Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    // 2. Récupérer le rôle depuis la table profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role ?? data.user.user_metadata?.role ?? "admin";
    const redirect = ROLE_REDIRECT[role] ?? "/admin/dashboard";

    router.push(`/${locale}${redirect}`);
  };

  return (
    <div className="grid md:grid-cols-2 min-h-screen">
      {/* ── Gauche : formulaire ───────────────────── */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div>
            <a href={`/${locale}`} className="flex items-center gap-2.5 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">{isAr ? "مدرستي" : "Madrasati"}</span>
            </a>
            <h1 className="text-2xl font-bold text-slate-900">{isAr ? "مرحباً بك" : "Bienvenue"}</h1>
            <p className="text-slate-500 mt-1">
              {isAr ? "اختر دوراً للتجربة أو سجل الدخول" : "Choisissez un rôle démo ou connectez-vous"}
            </p>
          </div>

          {/* Cartes démo */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {isAr ? "حسابات تجريبية" : "Accès démo rapide"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((user) => {
                const Icon = ROLE_ICONS[user.color as keyof typeof ROLE_ICONS];
                return (
                  <button
                    key={user.role}
                    type="button"
                    data-active={selected === user.role}
                    onClick={() => handleDemoSelect(user)}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                      ROLE_COLORS[user.color as keyof typeof ROLE_COLORS]
                    )}
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", ROLE_ICON_BG[user.color as keyof typeof ROLE_ICON_BG])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{isAr ? user.labelAr : user.labelFr}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.school}</p>
                    </div>
                    {selected === user.role && (
                      <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Séparateur */}
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-xs text-slate-400">{isAr ? "أو أدخل بياناتك" : "ou saisissez vos identifiants"}</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
              <Input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAr ? "name@school.ma" : "nom@ecole.ma"}
                autoComplete="email" required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{isAr ? "كلمة المرور" : "Mot de passe"}</Label>
              <div className="relative">
                <Input
                  id="password" type={showPwd ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password" required className="pr-10"
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />{isAr ? "جاري التحميل..." : "Connexion..."}</>
                : <>{isAr ? "تسجيل الدخول" : "Se connecter"}<ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400">
            {isAr ? "كلمة المرور للحسابات التجريبية: " : "Mot de passe des comptes démo : "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">demo123</code>
          </p>
        </div>
      </div>

      {/* ── Droite : panneau marque ───────────────── */}
      <div className="hidden md:flex flex-col justify-between bg-slate-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
        <div className="relative">
          <p className="text-slate-400 text-sm mb-2">{isAr ? "موثوق به من قبل" : "Utilisé par"}</p>
          <p className="text-4xl font-extrabold text-white mb-1">48 {isAr ? "مدرسة" : "écoles"}</p>
          <p className="text-slate-400">{isAr ? "في كل أنحاء المغرب" : "à travers le Maroc"}</p>
        </div>
        <div className="relative space-y-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              {isAr
                ? "«مدرستي غيّرت طريقة إدارة مدرستنا. الآن كل شيء في مكان واحد.»"
                : "«Madrasati a transformé la gestion de notre école. Tout en un lieu — présences, frais, communication parents.»"}
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">R</div>
              <div>
                <p className="text-white text-sm font-medium">Rachid Benali</p>
                <p className="text-slate-400 text-xs">{isAr ? "مدير مدرسة الأمل" : "Directeur, École Al Amal"}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "12K+", label: isAr ? "تلميذ" : "élèves" },
              { value: "99.9%", label: isAr ? "وقت التشغيل" : "uptime" },
              { value: "FR/AR", label: isAr ? "لغات" : "langues" },
            ].map(({ value, label }) => (
              <div key={value} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
