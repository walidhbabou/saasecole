import { getLocale } from "next-intl/server";
import { Users, BookOpen, GraduationCap, CreditCard, CalendarCheck, AlertCircle, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getProfile, getAdminStats, getRecentEnrollments, getClassAttendanceRates } from "@/lib/dal";

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const profile = await getProfile();
  const schoolId = profile?.school_id ?? "";

  const [stats, enrollments, classRates] = await Promise.all([
    getAdminStats(schoolId),
    getRecentEnrollments(schoolId),
    getClassAttendanceRates(schoolId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "لوحة التحكم" : "Tableau de bord"}
        description={isAr ? "السنة الدراسية 2025-2026" : "Année scolaire 2025-2026"}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard title={isAr ? "إجمالي التلاميذ" : "Total élèves"} value={stats.totalStudents} icon={Users} trend={stats.newStudentsThisMonth} trendLabel={`+${stats.newStudentsThisMonth} ce mois`} color="emerald" />
        <StatsCard title={isAr ? "الأساتذة" : "Enseignants"} value={stats.totalTeachers} icon={GraduationCap} color="blue" />
        <StatsCard title={isAr ? "الأقسام" : "Classes"} value={stats.totalClasses} icon={BookOpen} color="purple" />
        <StatsCard title={isAr ? "إيرادات الشهر" : "Revenus du mois"} value={formatCurrency(stats.monthlyRevenue)} icon={CreditCard} color="amber" />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatsCard title={isAr ? "رسوم غير مدفوعة" : "Frais impayés"} value={stats.pendingFees} icon={AlertCircle} color="red" />
        <StatsCard title={isAr ? "جدد هذا الشهر" : "Nouveaux ce mois"} value={stats.newStudentsThisMonth} icon={TrendingUp} color="blue" />
        <StatsCard title={isAr ? "الأقسام النشطة" : "Classes actives"} value={stats.totalClasses} icon={CalendarCheck} color="emerald" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{isAr ? "التسجيلات الأخيرة" : "Inscriptions récentes"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {enrollments.length === 0 ? (
              <p className="px-6 py-4 text-sm text-slate-400">{isAr ? "لا توجد تسجيلات" : "Aucune inscription"}</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {enrollments.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                        {(e.student?.first_name ?? "?").charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{e.student?.first_name} {e.student?.last_name}</p>
                        <p className="text-xs text-slate-400">{(e.class as any)?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="text-xs">{isAr ? "نشط" : "Actif"}</Badge>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(e.enrolled_at, locale)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "الحضور بالقسم" : "Présences par classe"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classRates.length === 0 ? (
              <p className="text-sm text-slate-400">{isAr ? "لا توجد بيانات" : "Aucune donnée"}</p>
            ) : (
              classRates.map((cls) => (
                <div key={cls.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{cls.name}</span>
                    <span className="text-slate-500">{cls.rate}% · {cls.students} {isAr ? "تلميذ" : "élèves"}</span>
                  </div>
                  <Progress value={cls.rate} className={`h-2 ${cls.rate < 90 ? "[&>div]:bg-amber-500" : ""}`} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
