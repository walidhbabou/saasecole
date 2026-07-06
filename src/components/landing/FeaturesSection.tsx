import { useLocale } from "next-intl";
import { Users, CalendarCheck, CreditCard, Globe, Shield, BarChart3 } from "lucide-react";
import { LANDING_FEATURES } from "@/lib/constants";

const ICONS = { Users, CalendarCheck, CreditCard, Globe, Shield, BarChart3 };

export function FeaturesSection() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section id="features" className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-4">
            {isAr ? "المميزات" : "Fonctionnalités"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            {isAr ? "كل ما تحتاجه في مكان واحد" : "Tout ce qu'il vous faut"}
          </h2>
          <p className="mx-auto max-w-xl text-slate-500">
            {isAr
              ? "منصة شاملة مصممة خصيصاً للمدارس المغربية، مع دعم كامل للعربية والفرنسية."
              : "Une plateforme complète pensée pour les établissements scolaires marocains, avec support natif FR/AR."
            }
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {LANDING_FEATURES.map((f, i) => {
            const Icon = ICONS[f.icon as keyof typeof ICONS];
            return (
              <div
                key={i}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-200"
              >
                {/* Icon */}
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  {isAr ? f.titleAr : f.titleFr}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {isAr ? f.descAr : f.descFr}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
