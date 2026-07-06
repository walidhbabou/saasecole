import { getLocale } from "next-intl/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/shared/StatsCard";
import { FeeBadge } from "@/components/shared/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, CreditCard } from "lucide-react";
import { getProfile, getChildFees } from "@/lib/dal";

export default async function ParentFeesPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const profile = await getProfile();
  const fees = await getChildFees(profile?.id ?? "");

  const paid = fees.filter(f => f.status === "paid").reduce((a, f) => a + Number(f.amount), 0);
  const due  = fees.filter(f => f.status !== "paid").reduce((a, f) => a + Number(f.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title={isAr ? "الرسوم الدراسية" : "Frais scolaires"} description="2025-2026" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title={isAr ? "مدفوعة" : "Payés"} value={formatCurrency(paid)} icon={CheckCircle2} color="emerald" />
        <StatsCard title={isAr ? "متبقية" : "Restants"} value={formatCurrency(due)} icon={Clock} color="amber" />
        <StatsCard title={isAr ? "المجموع" : "Total annuel"} value={formatCurrency(paid + due)} icon={CreditCard} color="blue" />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">{isAr ? "تفاصيل المدفوعات" : "Détail des paiements"}</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "البيان" : "Description"}</TableHead>
              <TableHead>{isAr ? "المبلغ" : "Montant"}</TableHead>
              <TableHead>{isAr ? "الاستحقاق" : "Échéance"}</TableHead>
              <TableHead>{isAr ? "الدفع" : "Payé le"}</TableHead>
              <TableHead>{isAr ? "الحالة" : "Statut"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">{isAr ? "لا توجد رسوم" : "Aucun frais"}</TableCell></TableRow>
            ) : fees.map((f: any) => {
              const ft = f.fee_type as any;
              return (
                <TableRow key={f.id}>
                  <TableCell className="font-medium text-slate-900">{isAr ? ft?.name_ar : ft?.name ?? "—"}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(Number(f.amount))}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{f.due_date ? formatDate(f.due_date, locale) : "—"}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{f.paid_at ? formatDate(f.paid_at, locale) : "—"}</TableCell>
                  <TableCell><FeeBadge status={f.status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
