"use client";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-4">
            {isAr ? "الأسعار" : "Tarifs"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            {isAr ? "اختر الخطة المناسبة لك" : "Des tarifs simples et transparents"}
          </h2>
          <p className="mx-auto max-w-md text-slate-500">
            {isAr
              ? "ادفع شهرياً، ألغِ في أي وقت. لا رسوم خفية."
              : "Facturation mensuelle, résiliation à tout moment. Sans engagement."
            }
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border bg-white p-8 transition-all",
                plan.popular
                  ? "border-emerald-500 shadow-2xl shadow-emerald-500/20 scale-105"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md"
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-emerald-500/30">
                  {isAr ? "الأكثر شعبية" : "Le plus populaire"}
                </div>
              )}

              {/* Plan name */}
              <div className="mb-6">
                <p className={cn(
                  "text-sm font-semibold mb-2",
                  plan.popular ? "text-emerald-600" : "text-slate-500"
                )}>
                  {isAr ? plan.nameAr : plan.nameFr}
                </p>
                <div className="flex items-baseline gap-1">
                  {plan.price ? (
                    <>
                      <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                      <span className="text-slate-400 text-sm">MAD / {isAr ? "شهر" : "mois"}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-extrabold text-slate-900">
                      {isAr ? "تواصل معنا" : "Sur devis"}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {(isAr ? plan.featuresAr : plan.featuresFr).map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check className={cn(
                      "h-4 w-4 mt-0.5 shrink-0",
                      plan.popular ? "text-emerald-500" : "text-slate-400"
                    )} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a href={`/${locale}/login`} className="block">
                <Button
                  className={cn(
                    "w-full",
                    plan.popular
                      ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  )}
                >
                  {plan.price
                    ? (isAr ? "ابدأ الآن" : "Commencer")
                    : (isAr ? "تواصل معنا" : "Nous contacter")}
                </Button>
              </a>
            </div>
          ))}
        </div>

        {/* Trust note */}
        <p className="text-center text-sm text-slate-400 mt-10">
          {isAr
            ? "✓ جربه مجاناً لمدة 14 يوماً — لا يلزم بطاقة ائتمانية"
            : "✓ Essai gratuit 14 jours — Aucune carte bancaire requise"
          }
        </p>
      </div>
    </section>
  );
}
