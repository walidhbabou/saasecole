import { getLocale } from "next-intl/server";
import { CalendarCheck, CreditCard, BookOpen, Bell } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getProfile, getParentDashboard } from "@/lib/dal";

const STATUS_LABELS: Record<string, { fr: string; ar: string; v: "default" | "destructive" | "warning" }> = {
  present: { fr: "Présent",   ar: "حاضر",  v: "default" },
  absent:  { fr: "Absent",    ar: "غائب",  v: "destructive" },
  late:    { fr: "En retard", ar: "متأخر", v: "warning" },
  excused: { fr: "Excusé",    ar: "بعذر",  v: "default" },
};

export default async function ParentDashboardPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const profile = await getProfile();
  const data = await getParentDashboard(profile?.id ?? "");

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title={isAr ? "لوحة تحكم ولي الأمر" : "Mon espace parent"} description="" />
        <div className="rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <p>{isAr ? "لا يوجد أطفال مرتبطون بحسابك" : "Aucun enfant lié à votre compte"}</p>
        </div>
      </div>
    );
  }

  const { child, attendanceRate, absenceCount, nextFee, recentAttendance } = data;

  return (
    <div className="space-y-6">
      <PageHeader title={isAr ? "لوحة تحكم ولي الأمر" : "Mon espace parent"} description="" />

      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-white overflow-hidden">
        <CardContent className="p-6 flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {child.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{isAr ? child.nameAr : child.name}</h2>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{child.class}</span>
              {child.teacher && <><span>·</span><span>{child.teacher}</span></>}
              <span>·</span><code className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded">{child.matricule}</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title={isAr ? "نسبة الحضور" : "Taux de présence"} value={`${attendanceRate}%`} icon={CalendarCheck} color="emerald" trendLabel={isAr ? "هذا الشهر" : "Ce mois"} />
        <StatsCard title={isAr ? "الغيابات" : "Absences"} value={absenceCount} icon={Bell} color="amber" />
        <StatsCard title={isAr ? "الدفعة القادمة" : "Prochain paiement"} value={nextFee ? formatCurrency(Number(nextFee.amount)) : "—"} icon={CreditCard} trendLabel={nextFee?.due_date ? formatDate(nextFee.due_date, locale) : ""} color="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{isAr ? "آخر الحضور" : "Présences récentes"}</CardTitle></CardHeader>
          <CardContent className="p-0">
            {recentAttendance.length === 0 ? (
              <p className="px-6 py-4 text-sm text-slate-400">{isAr ? "لا توجد بيانات" : "Aucune donnée"}</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAttendance.map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3">
                    <p className="text-sm font-medium text-slate-700">{formatDate(a.date, locale)}</p>
                    <Badge variant={STATUS_LABELS[a.status]?.v ?? "secondary"}>
                      {isAr ? STATUS_LABELS[a.status]?.ar : STATUS_LABELS[a.status]?.fr}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{isAr ? "المدفوعات القادمة" : "Prochain paiement"}</CardTitle></CardHeader>
          <CardContent>
            {nextFee ? (
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-slate-900">{isAr ? "الرسوم الدراسية" : "Frais scolaires"}</p>
                <p className="text-xs text-slate-500 mt-0.5">{isAr ? "الاستحقاق:" : "Échéance :"} {formatDate(nextFee.due_date, locale)}</p>
                <p className="text-2xl font-bold text-amber-700 mt-2">{formatCurrency(Number(nextFee.amount))}</p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-700">{isAr ? "لا توجد مدفوعات قادمة" : "Aucun paiement en attente"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
