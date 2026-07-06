import { getLocale } from "next-intl/server";
import { Search, ArrowRightLeft, MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProfile, getEnrollments } from "@/lib/dal";

const STATUS_BADGES = {
  active:      { labelFr: "Actif",     labelAr: "نشط",    variant: "default"     as const },
  transferred: { labelFr: "Transféré", labelAr: "محول",   variant: "secondary"   as const },
  withdrawn:   { labelFr: "Retiré",    labelAr: "منسحب",  variant: "destructive" as const },
};

export default async function AdminEnrollmentsPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const profile = await getProfile();
  const enrollments = await getEnrollments(profile?.school_id ?? "");

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "التسجيلات" : "Inscriptions"}
        description={`${enrollments.length} ${isAr ? "تسجيل نشط" : "inscriptions"} · 2025-2026`}
      >
        <Button size="sm"><Plus className="h-4 w-4" />{isAr ? "تسجيل جديد" : "Nouvelle inscription"}</Button>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "التلميذ" : "Élève"}</TableHead>
              <TableHead>{isAr ? "رقم التسجيل" : "Matricule"}</TableHead>
              <TableHead>{isAr ? "القسم" : "Classe"}</TableHead>
              <TableHead>{isAr ? "تاريخ التسجيل" : "Date"}</TableHead>
              <TableHead>{isAr ? "الحالة" : "Statut"}</TableHead>
              <TableHead className="text-right">{isAr ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">{isAr ? "لا توجد تسجيلات" : "Aucune inscription"}</TableCell></TableRow>
            ) : enrollments.map((e: any) => {
              const s = e.student as any;
              const c = e.class as any;
              const statusCfg = STATUS_BADGES[e.status as keyof typeof STATUS_BADGES] ?? STATUS_BADGES.active;
              return (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                        {(s?.first_name ?? "?").charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{s?.first_name} {s?.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{s?.matricule}</code></TableCell>
                  <TableCell><Badge variant="secondary">{c?.name ?? "—"}</Badge></TableCell>
                  <TableCell className="text-slate-500 text-sm">{formatDate(e.enrolled_at, locale)}</TableCell>
                  <TableCell><Badge variant={statusCfg.variant}>{isAr ? statusCfg.labelAr : statusCfg.labelFr}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><ArrowRightLeft className="h-4 w-4" />{isAr ? "نقل" : "Transférer"}</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">{isAr ? "سحب" : "Retirer"}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
