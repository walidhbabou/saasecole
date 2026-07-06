"use client";
import { useLocale } from "next-intl";
import { ArrowRight, Play, Users, School, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const stats = [
    { icon: School, value: "48+", labelFr: "écoles actives", labelAr: "مدرسة نشطة" },
    { icon: Users, value: "12K+", labelFr: "élèves gérés", labelAr: "تلميذ مسجل" },
    { icon: TrendingUp, value: "99.9%", labelFr: "uptime garanti", labelAr: "وقت تشغيل" },
  ];

  return (
    <section className="relative min-h-screen bg-slate-900 flex items-center overflow-hidden pt-16">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">
            {isAr ? "الجيل الجديد من إدارة المدارس" : "Nouvelle génération de gestion scolaire"}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
          {isAr ? (
            <>
              أدِر مدرستك{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                بذكاء
              </span>
            </>
          ) : (
            <>
              Gérez votre école{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                intelligemment
              </span>
            </>
          )}
        </h1>

        {/* Subline */}
        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed">
          {isAr
            ? "منصة SaaS متعددة المستأجرين للمدارس — إدارة التلاميذ، الحضور، الرسوم، والتواصل مع الآباء. بالعربية والفرنسية."
            : "Plateforme SaaS multi-tenant pour établissements scolaires — gestion des élèves, présences, frais et communication parents. En FR & AR."
          }
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a href={`/${locale}/login`}>
            <Button
              size="lg"
              className="h-12 px-8 bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl shadow-emerald-500/30 text-base font-semibold gap-2"
            >
              {isAr ? "ابدأ مجاناً" : "Démarrer gratuitement"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <a href="#features">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 border-slate-700 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white text-base gap-2"
            >
              <Play className="h-4 w-4 text-emerald-400" />
              {isAr ? "شاهد العرض" : "Voir la démo"}
            </Button>
          </a>
        </div>

        {/* Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
          {stats.map(({ icon: Icon, value, labelFr, labelAr }) => (
            <div key={value} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                <Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-slate-400">{isAr ? labelAr : labelFr}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard preview */}
        <div className="mt-16 relative mx-auto max-w-4xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl shadow-black/50">
            <div className="rounded-xl bg-slate-800 overflow-hidden">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-900/50 border-b border-white/5">
                <span className="h-3 w-3 rounded-full bg-red-500/60" />
                <span className="h-3 w-3 rounded-full bg-amber-500/60" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
                <div className="flex-1 mx-4 h-5 rounded-md bg-white/5 text-[10px] text-slate-500 flex items-center px-2">
                  madrasati.ma/fr/admin/dashboard
                </div>
              </div>
              {/* Fake dashboard content */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  {["347 Élèves", "24 Enseignants", "12 Classes", "94% Présence"].map((item, i) => (
                    <div key={i} className="rounded-lg bg-slate-700/50 p-3">
                      <div className="h-1.5 w-12 rounded bg-emerald-500/40 mb-2" />
                      <p className="text-xs text-white font-medium">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 rounded-lg bg-slate-700/50 p-3 h-20">
                    <div className="h-1.5 w-16 rounded bg-slate-600 mb-2" />
                    <div className="flex items-end gap-1 h-10">
                      {[60, 75, 55, 80, 90, 70, 85, 95].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-emerald-500/40" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-700/50 p-3 h-20 space-y-1.5">
                    {["Yassine A.", "Fatima Z.", "Omar K."].map((n) => (
                      <div key={n} className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-emerald-500/40" />
                        <div className="h-1.5 flex-1 rounded bg-slate-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under preview */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-12 w-3/4 bg-emerald-500/20 blur-2xl" />
        </div>
      </div>
    </section>
  );
}
