"use client";
import { useState, useTransition, useCallback } from "react";
import { CalendarCheck, CheckCircle2, XCircle, Clock, FileCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { saveAttendance } from "@/lib/actions";
import type { AttendanceStatus } from "@/types";

const STATUS_CFG = {
  present: { labelFr: "Présent",   labelAr: "حاضر",  icon: CheckCircle2, badge: "default"     as const, bg: "bg-emerald-50 border-emerald-200" },
  absent:  { labelFr: "Absent",    labelAr: "غائب",  icon: XCircle,      badge: "destructive" as const, bg: "bg-red-50 border-red-200" },
  late:    { labelFr: "En retard", labelAr: "متأخر", icon: Clock,        badge: "warning"     as const, bg: "bg-amber-50 border-amber-200" },
  excused: { labelFr: "Excusé",    labelAr: "بعذر",  icon: FileCheck,    badge: "secondary"   as const, bg: "bg-blue-50 border-blue-200" },
};

interface Props {
  classes: { id: string; name: string }[];
  initialClassId: string;
  initialStudents: any[];
  initialRecords: Record<string, string>;
  today: string;
  locale: string;
}

export function AttendanceClient({ classes, initialClassId, initialStudents, initialRecords, today, locale }: Props) {
  const isAr = locale === "ar";
  const sb = createClient();

  const [classId, setClassId] = useState(initialClassId);
  const [period, setPeriod] = useState<"morning" | "afternoon">("morning");
  const [date, setDate] = useState(today);
  const [students, setStudents] = useState(initialStudents);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(
    Object.fromEntries(
      initialStudents.map(s => [s.id, (initialRecords[s.id] as AttendanceStatus) ?? "present"])
    )
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadClass = useCallback(async (cId: string, d: string, p: string) => {
    const [enrRes, sessRes] = await Promise.all([
      sb.from("enrollments").select("student:students!inner(id, first_name, last_name, matricule)").eq("class_id", cId).eq("status", "active"),
      sb.from("attendance_sessions").select("id").eq("class_id", cId).eq("date", d).eq("period", p).maybeSingle(),
    ]);
    const studs = (enrRes.data ?? []).map((e: any) => e.student);
    setStudents(studs);

    const newRecords: Record<string, AttendanceStatus> = {};
    if (sessRes.data) {
      const { data: recs } = await sb.from("attendance_records").select("student_id, status").eq("session_id", sessRes.data.id);
      (recs ?? []).forEach((r: any) => { newRecords[r.student_id] = r.status; });
    }
    setRecords(Object.fromEntries(studs.map((s: any) => [s.id, newRecords[s.id] ?? "present"])));
  }, [sb]);

  function changeClass(cId: string) { setClassId(cId); loadClass(cId, date, period); }
  function changePeriod(p: "morning" | "afternoon") { setPeriod(p); loadClass(classId, date, p); }
  function changeDate(d: string) { setDate(d); loadClass(classId, d, period); }
  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const nd = d.toISOString().split("T")[0];
    setDate(nd);
    loadClass(classId, nd, period);
  }

  const toggle = (id: string, s: AttendanceStatus) => setRecords(p => ({ ...p, [id]: s }));
  const counts = Object.values(records).reduce((a, s) => ({ ...a, [s]: (a[s as AttendanceStatus] ?? 0) + 1 }), {} as Record<AttendanceStatus, number>);

  function handleSave() {
    startTransition(async () => {
      const res = await saveAttendance(classId, date, period, records);
      if (!res.error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title={isAr ? "تسجيل الحضور" : "Suivi des présences"} description={date}>
        <Button variant="outline" size="sm" onClick={() => shiftDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-sm font-medium text-slate-700">{date}</span>
        <Button variant="outline" size="sm" onClick={() => shiftDate(1)}><ChevronRight className="h-4 w-4" /></Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select value={classId} onValueChange={changeClass}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={period} onValueChange={v => changePeriod(v as "morning" | "afternoon")}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">{isAr ? "صباح" : "Matin"}</SelectItem>
              <SelectItem value="afternoon">{isAr ? "مساء" : "Après-midi"}</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setRecords(Object.fromEntries(students.map(s => [s.id, "present"])))}>
              {isAr ? "الكل حاضر" : "Tous présents"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending} className={saved ? "bg-emerald-700" : ""}>
              <CalendarCheck className="h-4 w-4" />
              {saved ? (isAr ? "تم الحفظ!" : "Enregistré!") : (isAr ? "حفظ" : "Enregistrer")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(STATUS_CFG) as [AttendanceStatus, typeof STATUS_CFG.present][]).map(([key, cfg]) => (
          <Card key={key} className={`border-2 ${cfg.bg}`}>
            <CardContent className="p-4 flex items-center gap-2">
              <cfg.icon className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-xs text-slate-500">{isAr ? cfg.labelAr : cfg.labelFr}</p>
                <p className="text-xl font-bold text-slate-900">{counts[key] ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{classes.find(c => c.id === classId)?.name} — {students.length} {isAr ? "تلاميذ" : "élèves"}</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{isAr ? "التلميذ" : "Élève"}</TableHead>
              <TableHead>{isAr ? "الحالة" : "Statut"}</TableHead>
              <TableHead className="text-right">{isAr ? "تغيير" : "Changer"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">{isAr ? "لا يوجد تلاميذ" : "Aucun élève dans ce classe"}</TableCell></TableRow>
            ) : students.map((s, i) => {
              const status = records[s.id] ?? "present";
              const cfg = STATUS_CFG[status as AttendanceStatus];
              return (
                <TableRow key={s.id}>
                  <TableCell className="text-slate-400 text-xs w-8">{i + 1}</TableCell>
                  <TableCell className="font-medium text-slate-900">{s.first_name} {s.last_name}</TableCell>
                  <TableCell><Badge variant={cfg.badge}>{isAr ? cfg.labelAr : cfg.labelFr}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {(Object.entries(STATUS_CFG) as [AttendanceStatus, typeof STATUS_CFG.present][]).map(([key, c]) => (
                        <button key={key} onClick={() => toggle(s.id, key)}
                          className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${status === key ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-400 hover:border-slate-300"}`}
                          title={isAr ? c.labelAr : c.labelFr}>
                          <c.icon className="h-3.5 w-3.5" />
                        </button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
