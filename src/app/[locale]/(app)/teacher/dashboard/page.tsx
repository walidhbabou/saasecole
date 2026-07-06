import { getLocale } from "next-intl/server";
import { Users, CalendarCheck, BookOpen } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getProfile, getTeacherDashboard } from "@/lib/dal";
import { formatDate } from "@/lib/utils";

export default async function TeacherDashboardPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const profile = await getProfile();
  const { classes, absences } = await getTeacherDashboard(profile?.id ?? "");

  const totalStudents = classes.reduce((a, c) => a + c.students, 0);
  const avgRate = classes.length
    ? Math.round(classes.reduce((a, c) => a + c.rate, 0) / classes.length)
    : 0;

  const today = new Date().toLocaleDateString(isAr ? "ar-MA" : "fr-MA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "لوحة تحكم الأستاذ" : "Mon tableau de bord"}
        description={`${isAr ? "مرحباً،" : "Bonjour,"} ${profile?.first_name ?? ""} · ${today}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title={isAr ? "أقسامي" : "Mes classes"} value={classes.length} icon={BookOpen} color="blue" />
        <StatsCard title={isAr ? "مجموع التلاميذ" : "Total élèves"} value={totalStudents} icon={Users} color="emerald" />
        <StatsCard title={isAr ? "نسبة الحضور" : "Taux de présence"} value={`${avgRate}%`} icon={CalendarCheck} color="purple" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "حضور اليوم" : "Présences aujourd'hui"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.length === 0 ? (
              <p className="text-sm text-slate-400">{isAr ? "لا توجد أقسام" : "Aucune classe assignée"}</p>
            ) : classes.map(c => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-900">{c.name}</span>
                  <span className={c.rate >= 90 ? "text-emerald-600" : "text-amber-500"}>{c.present}/{c.students} · {c.rate}%</span>
                </div>
                <Progress value={c.rate} className={`h-2 ${c.rate < 90 ? "[&>div]:bg-amber-500" : ""}`} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "الغيابات الأخيرة" : "Absences récentes"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {absences.length === 0 ? (
              <p className="px-6 py-4 text-sm text-slate-400">{isAr ? "لا توجد غيابات" : "Aucune absence récente"}</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {absences.map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.name}</p>
                      <p className="text-xs text-slate-400">{a.class} · {a.date ? formatDate(a.date, locale) : ""}</p>
                    </div>
                    <Badge variant="destructive">{isAr ? "غائب" : "Absent"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
