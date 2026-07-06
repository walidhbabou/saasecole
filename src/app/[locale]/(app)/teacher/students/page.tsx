import { getLocale } from "next-intl/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProfile, getTeacherStudents } from "@/lib/dal";

export default async function TeacherStudentsPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const profile = await getProfile();
  const students = await getTeacherStudents(profile?.id ?? "");

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "تلاميذي" : "Mes élèves"}
        description={`${students.length} ${isAr ? "تلميذ في أقسامي" : "élèves dans mes classes"}`}
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "التلميذ" : "Élève"}</TableHead>
              <TableHead>{isAr ? "القسم" : "Classe"}</TableHead>
              <TableHead>{isAr ? "الغيابات" : "Absences"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-slate-400 py-8">{isAr ? "لا يوجد تلاميذ" : "Aucun élève"}</TableCell></TableRow>
            ) : students.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                      {s.firstName.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-900">{s.firstName} {s.lastName}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary">{s.class}</Badge></TableCell>
                <TableCell>
                  <span className={`font-medium ${s.absences >= 4 ? "text-red-600" : s.absences >= 2 ? "text-amber-600" : "text-slate-600"}`}>
                    {s.absences} {isAr ? "غياب" : "abs."}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
