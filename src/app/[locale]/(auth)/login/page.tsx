"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale } from "next-intl";
import { Eye, EyeOff, Loader2, ArrowRight, GraduationCap, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEMO_USERS } from "@/lib/constants";

const ROLE_DOT: Record<string, string> = {
  purple: "#8B5CF6",
  blue:   "#3B82F6",
  emerald:"#10B981",
  amber:  "#F59E0B",
};

const ROLE_REDIRECT: Record<string, string> = {
  super:   "/super/dashboard",
  admin:   "/admin/dashboard",
  teacher: "/teacher/dashboard",
  parent:  "/parent/dashboard",
};

// Gradient mesh points — each drifts on sin/cos paths
const MESH_PTS = [
  { r: .45, ox:.18, oy:.28, sx:.22, sy:.18, spx:.7,  spy:.5,  c:[16,185,129,.13]  },
  { r: .38, ox:.72, oy:.65, sx:.18, sy:.22, spx:.4,  spy:.65, c:[4,120,87,.09]    },
  { r: .30, ox:.50, oy:.20, sx:.28, sy:.16, spx:.9,  spy:.8,  c:[5,150,105,.07]   },
  { r: .25, ox:.25, oy:.75, sx:.15, sy:.25, spx:.55, spy:.35, c:[52,211,153,.06]  },
] as const;

export default function LoginPage() {
  const locale   = useLocale();
  const router   = useRouter();
  const isAr     = locale === "ar";
  const supabase = createClient();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error,    setError]    = useState("");
  const [errKey,   setErrKey]   = useState(0);

  // Canvas gradient mesh
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let t = 0;
    function resize() {
      if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      t += 0.004;
      for (const p of MESH_PTS) {
        const x = (p.ox + Math.sin(t * p.spx + p.oy * 3) * p.sx) * w;
        const y = (p.oy + Math.cos(t * p.spy + p.ox * 2) * p.sy) * h;
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.r * Math.max(w, h));
        const [r, gr, b, a] = p.c;
        g.addColorStop(0, `rgba(${r},${gr},${b},${a})`);
        g.addColorStop(1, `rgba(${r},${gr},${b},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleDemoSelect = useCallback((user: typeof DEMO_USERS[0]) => {
    setSelected(user.role);
    setEmail(user.email);
    setPassword("demo123");
    setError("");
  }, []);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError(isAr ? "بيانات الدخول غير صحيحة" : "Email ou mot de passe incorrect");
      setErrKey(k => k + 1);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", data.user.id).single();

    const role     = profile?.role ?? data.user.user_metadata?.role ?? "admin";
    const redirect = ROLE_REDIRECT[role] ?? "/admin/dashboard";
    router.push(`/${locale}${redirect}`);
  }

  return (
    <div
      className="flex min-h-screen flex-col md:flex-row"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* ══════════════════════════════════════════
          BRAND — canvas mesh + Arabic display type
      ══════════════════════════════════════════ */}
      <div
        className="relative hidden flex-1 flex-col justify-between overflow-hidden md:flex"
        style={{ background: "#080e09", padding: "40px 56px" }}
      >
        {/* Animated gradient mesh */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        {/* SVG grain texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo */}
        <div className="login-brand-top relative z-10 flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px]"
            style={{ background: "#10B981" }}
          >
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span
            className="text-[15px] font-semibold tracking-[-0.2px]"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {isAr ? "مدرستي" : "Madrasati"}
          </span>
        </div>

        {/* Arabic display — hero typographic element */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
          <span
            className="login-text-reveal block font-bold leading-none"
            style={{
              fontSize: "clamp(72px, 9vw, 128px)",
              color: "rgba(255,255,255,0.92)",
              letterSpacing: "-0.02em",
              textShadow: "0 0 120px rgba(16,185,129,0.20)",
            }}
          >
            {isAr ? "مدرستي" : "مدرستي"}
          </span>
          <span
            className="mt-5 block text-[11px] font-medium uppercase tracking-[0.45em]"
            style={{ color: "rgba(16,185,129,0.7)" }}
          >
            {isAr ? "منصة إدارة المدارس" : "Plateforme scolaire"}
          </span>
          <span
            className="login-line-expand mt-4 block h-px"
            style={{ background: "rgba(16,185,129,0.35)", width: "40px" }}
          />
        </div>

        {/* Bottom stats */}
        <div
          className="login-brand-bottom relative z-10 text-[12px] tracking-[0.05em]"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          <span style={{ color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>48</span>{" "}
          {isAr ? "مدرسة" : "écoles"}
          <span style={{ margin: "0 12px", color: "rgba(255,255,255,0.12)" }}>·</span>
          <span style={{ color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>12 000</span>{" "}
          {isAr ? "تلميذ" : "élèves"}
          <span style={{ margin: "0 12px", color: "rgba(255,255,255,0.12)" }}>·</span>
          {isAr ? "ثنائي اللغة" : "Bilingue"}{" "}
          <span style={{ color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>FR / AR</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FORM — clean white, underline inputs
      ══════════════════════════════════════════ */}
      <div
        className="relative flex min-h-screen items-center justify-center bg-white md:min-h-0"
        style={{ width: "100%", maxWidth: "440px", flexShrink: 0, padding: "56px 52px" }}
      >
        {/* Subtle left border */}
        <div
          className="absolute bottom-[10%] left-0 top-[10%] hidden w-px md:block"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.06) 30%, rgba(0,0,0,0.06) 70%, transparent)",
          }}
        />

        <div className="login-form-slide w-full">

          {/* Mobile logo */}
          <a href={`/${locale}`} className="mb-10 flex items-center gap-2.5 md:hidden">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px]"
              style={{ background: "#10B981" }}>
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[17px] font-semibold text-slate-900">
              {isAr ? "مدرستي" : "Madrasati"}
            </span>
          </a>

          {/* Greeting */}
          <div className="mb-9">
            <p
              className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "#10B981" }}
            >
              {isAr ? "فضاء آمن" : "Espace sécurisé"}
            </p>
            <h1
              className="mb-2 text-[28px] font-bold leading-[1.15]"
              style={{ color: "#0D1117", letterSpacing: "-0.5px" }}
            >
              {isAr ? "أهلاً،\nمرحباً بك." : "Bonjour,\nbienvenue."}
            </h1>
            <p className="text-[14px] leading-relaxed" style={{ color: "#8B96A8" }}>
              {isAr
                ? "سجّل الدخول للوصول إلى لوحة التحكم"
                : "Connectez-vous pour accéder à votre tableau de bord."}
            </p>
          </div>

          {/* Role pills 2×2 */}
          <div className="mb-8">
            <p
              className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "#C4CBD6" }}
            >
              {isAr ? "دخول سريع — تجريبي" : "Accès rapide démo"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((user) => {
                const active = selected === user.role;
                return (
                  <button
                    key={user.role}
                    type="button"
                    onClick={() => handleDemoSelect(user)}
                    className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-left transition-all duration-[180ms] ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    style={{
                      border: `1.5px solid ${active ? "#10B981" : "#EEF1F5"}`,
                      background: active ? "#F0FDF4" : "#FAFBFC",
                      boxShadow: active ? "inset 0 0 0 1px rgba(16,185,129,0.25)" : "none",
                    }}
                  >
                    <span
                      className="h-[7px] w-[7px] flex-shrink-0 rounded-full transition-transform duration-200"
                      style={{
                        background: ROLE_DOT[user.color] ?? "#10B981",
                        transform: active ? "scale(1.5)" : "scale(1)",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold" style={{ color: "#1E293B" }}>
                        {isAr ? user.labelAr : user.labelFr}
                      </p>
                      <p className="truncate text-[10.5px]" style={{ color: "#94A3B8" }}>
                        {user.school}
                      </p>
                    </div>
                    {active && (
                      <span
                        key={`chk-${user.role}`}
                        className="login-check-pop flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ background: "#10B981" }}
                      >
                        <Check className="h-[9px] w-[9px] text-white" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="mb-7 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "#F1F4F8" }} />
            <span className="whitespace-nowrap text-[11px] font-medium" style={{ color: "#CBD5E1" }}>
              {isAr ? "أو أدخل بياناتك" : "ou saisissez vos identifiants"}
            </span>
            <div className="h-px flex-1" style={{ background: "#F1F4F8" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                key={errKey}
                className="login-shake flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[12.5px]"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}
              >
                <svg className="h-[14px] w-[14px] flex-shrink-0" viewBox="0 0 24 24" fill="none"
                  stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Email — underline style */}
            <div className="group relative">
              <label
                htmlFor="email"
                className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-200"
                style={{ color: "#94A3B8" }}
              >
                {isAr ? "البريد الإلكتروني" : "Adresse email"}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAr ? "nom@ecole.ma" : "nom@ecole.ma"}
                autoComplete="email"
                required
                className="w-full bg-transparent pb-2.5 pt-1 text-[15px] outline-none transition-colors duration-200 placeholder:text-slate-300"
                style={{
                  color: "#0D1117",
                  borderBottom: "1.5px solid #E8ECF1",
                }}
                onFocus={(e) => {
                  e.target.style.borderBottomColor = "#10B981";
                  const label = e.target.closest(".group")?.querySelector("label") as HTMLElement | null;
                  if (label) label.style.color = "#10B981";
                }}
                onBlur={(e) => {
                  e.target.style.borderBottomColor = "#E8ECF1";
                  const label = e.target.closest(".group")?.querySelector("label") as HTMLElement | null;
                  if (label) label.style.color = "#94A3B8";
                }}
              />
            </div>

            {/* Password — underline style */}
            <div className="group relative">
              <label
                htmlFor="password"
                className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-200"
                style={{ color: "#94A3B8" }}
              >
                {isAr ? "كلمة المرور" : "Mot de passe"}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full bg-transparent pb-2.5 pt-1 text-[15px] outline-none transition-colors duration-200"
                  style={{
                    color: "#0D1117",
                    borderBottom: "1.5px solid #E8ECF1",
                    paddingRight: "32px",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderBottomColor = "#10B981";
                    const label = e.target.closest(".group")?.querySelector("label") as HTMLElement | null;
                    if (label) label.style.color = "#10B981";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderBottomColor = "#E8ECF1";
                    const label = e.target.closest(".group")?.querySelector("label") as HTMLElement | null;
                    if (label) label.style.color = "#94A3B8";
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute bottom-2 right-0 text-slate-300 transition-colors duration-150 hover:text-slate-500"
                >
                  {showPwd
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group relative mt-2 w-full overflow-hidden rounded-xl py-3.5 text-[14px] font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#059669" }}
              onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.background = "#047857"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(5,150,105,0.30)"; } }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#059669"; (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              {/* Shimmer overlay */}
              <span
                className="pointer-events-none absolute inset-0 translate-x-[-100%] transition-transform duration-500 group-hover:translate-x-[100%]"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.14) 50%, transparent 60%)",
                }}
              />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isAr ? "جاري الدخول..." : "Connexion en cours..."}
                  </>
                ) : (
                  <>
                    {isAr ? "تسجيل الدخول" : "Se connecter"}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Hint */}
          <p className="mt-6 text-center text-[11.5px]" style={{ color: "#C4CBD6" }}>
            {isAr ? "كلمة مرور الحسابات التجريبية : " : "Mot de passe des comptes démo : "}
            <code
              className="rounded-[5px] px-1.5 py-0.5 font-mono text-[11.5px]"
              style={{ background: "#F4F6F9", color: "#64748B" }}
            >
              demo123
            </code>
          </p>

        </div>
      </div>
    </div>
  );
}
