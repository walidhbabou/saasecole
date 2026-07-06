import { getLocale } from "next-intl/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import { getProfile, getChildAttendanceHistory } from "@/lib/dal";

const STATUS_BADGES: Record<string, { fr: string; ar: string; v: "default" | "destructive" | "warning" }> = {
  present: { fr: "Présent",   ar: "حاضر",  v: "default" },
  absent:  { fr: "Absent",    ar: "غائب",  v: "destructive" },
  late:    { fr: "En retard", ar: "متأخر", v: "warning" },
};

function monthLabel(key: string, isAr: boolean) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString(isAr ? "ar-MA" : "fr-MA", { month: "long", year: "numeric" });
}

export default async function ParentAttendancePage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const profile = await getProfile();
  const { monthly, daily } = await getChildAttendanceHistory(profile?.id ?? "");

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "سجل الحضور" : "Historique des présences"}
        description={isAr ? "متابعة حضور طفلك" : "Suivi des présences de votre enfant"}
      />

      {monthly.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {monthly.map((m: any) => (
            <Card key={m.month}>
              <CardContent className="p-4">
                <div className="flex justify-between mb-3">
                  <p className="font-semibold text-slate-900">{monthLabel(m.month, isAr)}</p>
                  <span className={`text-sm font-bold ${m.rate >= 95 ? "text-emerald-600" : m.rate >= 85 ? "text-amber-600" : "text-red-500"}`}>{m.rate}%</span>
                </div>
                <Progress value={m.rate} className={`h-2 mb-3 ${m.rate < 90 ? "[&>div]:bg-amber-500" : ""}`} />
                <div className="flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />{m.present} {isAr ? "حاضر" : "présents"}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" />{m.absent} {isAr ? "غياب" : "absents"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">{isAr ? "التفاصيل اليومية" : "Détail journalier"}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {daily.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-400">{isAr ? "لا توجد بيانات" : "Aucune donnée de présence"}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {daily.map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <p className="text-sm font-medium text-slate-700">{formatDate(d.date, locale)}</p>
                  <Badge variant={STATUS_BADGES[d.status]?.v ?? "secondary"}>
                    {isAr ? STATUS_BADGES[d.status]?.ar : STATUS_BADGES[d.status]?.fr}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
