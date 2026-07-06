import { getLocale } from "next-intl/server";
import { School, Users, DollarSign, Activity } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getAllSchools, getSuperStats } from "@/lib/dal";
import { PLAN_MRR } from "@/lib/constants";

export default async function SuperDashboardPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const [stats, schools] = await Promise.all([getSuperStats(), getAllSchools()]);

  const totalMRR = schools.reduce((a, s) => a + (PLAN_MRR[s.plan as string] ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "لوحة تحكم المنصة" : "Console Super Admin"}
        description={isAr ? "نظرة عامة على منصة مدرستي" : "Vue d'ensemble de la plateforme Madrasati"}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={isAr ? "المدارس" : "Écoles actives"} value={stats.activeSchools} icon={School} color="blue" />
        <StatsCard title={isAr ? "إجمالي التلاميذ" : "Total élèves"} value={stats.totalStudents} icon={Users} color="emerald" />
        <StatsCard title="MRR" value={formatCurrency(totalMRR)} icon={DollarSign} color="purple" />
        <StatsCard title={isAr ? "إجمالي المدارس" : "Total écoles"} value={stats.totalSchools} icon={Activity} color="emerald" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">{isAr ? "التوزيع بالخطة" : "Répartition par plan"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { plans: ["pro", "professional"], labelFr: "Professional", labelAr: "المهني",  color: "bg-emerald-500" },
              { plans: ["basic", "starter"],    labelFr: "Starter",      labelAr: "المبدئي", color: "bg-slate-400" },
              { plans: ["enterprise"],          labelFr: "Entreprise",   labelAr: "المؤسسي", color: "bg-purple-500" },
            ].map(p => {
              const count = schools.filter(s => p.plans.includes(s.plan as string)).length;
              return (
                <div key={p.plans[0]}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="font-medium text-slate-700">{isAr ? p.labelAr : p.labelFr}</span>
                    <span className="text-slate-500">{count} {isAr ? "مدارس" : "écoles"}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.color}`} style={{ width: stats.totalSchools ? `${(count / stats.totalSchools) * 100}%` : "0%" }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
              <span className="text-slate-500">{isAr ? "MRR الإجمالي" : "MRR total"}</span>
              <span className="font-bold text-emerald-600">{formatCurrency(totalMRR)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3"><CardTitle className="text-base">{isAr ? "المدارس" : "Écoles"}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {schools.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">{s.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.city}</p>
                  </div>
                  <Badge variant={s.plan === "pro" ? "default" : s.plan === "enterprise" ? "secondary" : "outline"} className="capitalize">{s.plan}</Badge>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">{formatCurrency(PLAN_MRR[s.plan as string] ?? 0)}</p>
                    <p className="text-xs text-slate-400">/mois</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
