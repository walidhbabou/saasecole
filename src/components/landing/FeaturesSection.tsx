"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ArrowUpRight, BarChart3, CalendarCheck, Check, CreditCard, Globe, Shield, Sparkles, Users } from "lucide-react";
import { LANDING_FEATURES } from "@/lib/constants";

const ICONS = { Users, CalendarCheck, CreditCard, Globe, Shield, BarChart3 };

export function FeaturesSection() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const isEn = locale === "en";
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFeature = LANDING_FEATURES[activeIndex];
  const ActiveIcon = ICONS[activeFeature.icon as keyof typeof ICONS];

  return (
    <section id="features" className="relative overflow-hidden bg-[#eef3ee] py-24 sm:py-32">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(#cbd8ce_1px,transparent_1px),linear-gradient(90deg,#cbd8ce_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_78%,transparent)]" />
      <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-14 flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 border-l-2 border-emerald-500 pl-3 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              {isAr ? "المميزات" : isEn ? "Features" : "Fonctionnalités"}
            </span>
            <h2 className="max-w-xl text-3xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
              {isAr ? "كل ما تحتاجه في مكان واحد" : isEn ? "Everything you need in one place" : "Tout ce qu'il vous faut"}
            </h2>
          </div>
          <p className="max-w-sm border-l border-slate-300 pl-5 text-sm leading-6 text-slate-600 sm:text-right">
            {isAr
              ? "منصة شاملة مصممة خصيصاً للمدارس المغربية، مع دعم كامل للعربية والفرنسية."
              : isEn ? "A complete platform built for schools, with native English, French, and Arabic support."
              : "Une plateforme complète pensée pour les établissements scolaires marocains, avec support natif FR/AR."
            }
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="grid content-start gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {LANDING_FEATURES.map((feature, index) => {
              const Icon = ICONS[feature.icon as keyof typeof ICONS];
              const isActive = index === activeIndex;
              return (
                <button key={feature.icon} type="button" onClick={() => setActiveIndex(index)} className={`group relative flex items-center gap-4 border p-4 text-left transition-all duration-300 ${isActive ? "border-slate-950 bg-slate-950 text-white shadow-xl shadow-slate-900/10" : "border-slate-200/80 bg-white/75 text-slate-900 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white"}`}>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-emerald-400 text-slate-950" : "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200"}`}><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className={`mb-1 block text-[10px] font-bold uppercase tracking-[0.18em] ${isActive ? "text-emerald-400" : "text-slate-400"}`}>0{index + 1}</span><span className="block text-sm font-bold">{isAr ? feature.titleAr : isEn ? feature.titleEn : feature.titleFr}</span></span>
                  <ArrowUpRight className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "text-emerald-400" : "text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"}`} />
                </button>
              );
            })}
          </div>
          <div className="relative min-h-[470px] overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 bg-blue-500/10 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="mb-12 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />{isAr ? "منصة مدرستي" : "Plateforme Madrasati"}</span><span className="font-mono text-[11px] text-slate-500">0{activeIndex + 1} <span className="text-slate-700">/</span> 06</span></div>
                <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/20"><ActiveIcon className="h-8 w-8" /></div>
                <h3 className="max-w-md text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl">{isAr ? activeFeature.titleAr : isEn ? activeFeature.titleEn : activeFeature.titleFr}</h3>
                <p className="mt-4 max-w-lg text-base leading-7 text-slate-400">{isAr ? activeFeature.descAr : isEn ? activeFeature.descEn : activeFeature.descFr}</p>
              </div>
              <div className="mt-10 border-t border-white/10 pt-6"><div className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-slate-500"><span>{isAr ? "جاهز للاستخدام" : "Prêt à l'emploi"}</span><span className="text-emerald-400">{isAr ? "100%" : "100% opérationnel"}</span></div><div className="mb-6 h-1 overflow-hidden bg-white/10"><div className="h-full w-full bg-emerald-400" /></div><div className="grid gap-3 sm:grid-cols-2">{["Simple à prendre en main", "Pensé pour votre école"].map((item) => <div key={item} className="flex items-center gap-2 text-sm text-slate-300"><Check className="h-4 w-4 text-emerald-400" />{item}</div>)}</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
