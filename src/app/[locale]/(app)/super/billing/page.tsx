import { getLocale } from "next-intl/server";
import { DollarSign, TrendingUp, CreditCard, FileText } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllSchools } from "@/lib/dal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PLAN_MRR } from "@/lib/constants";

export default async function SuperBillingPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const schools = await getAllSchools();

  const totalMRR = schools.reduce((a, s) => a + (PLAN_MRR[s.plan as string] ?? 0), 0);
  const totalARR = totalMRR * 12;
  const overdueSchools = schools.filter(s => s.subscription_status === "past_due");
  const totalOverdue = overdueSchools.reduce((a, s) => a + (PLAN_MRR[s.plan as string] ?? 0), 0);
  const collected = totalMRR - totalOverdue;

  const planStats = [
    { plans: ["pro", "professional"], labelFr: "Professional", labelAr: "المهني",  color: "bg-emerald-500", mrr: 79 },
    { plans: ["basic", "starter"],    labelFr: "Starter",      labelAr: "المبدئي", color: "bg-slate-400",   mrr: 29 },
    { plans: ["enterprise"],          labelFr: "Entreprise",   labelAr: "المؤسسي", color: "bg-purple-500",  mrr: 299 },
  ].map(p => ({
    ...p,
    count: schools.filter(s => p.plans.includes(s.plan as string)).length,
  }));

  // Synthetic invoices: one per active school for current month
  const now = new Date();
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const invoices = schools
    .filter(s => PLAN_MRR[s.plan as string] > 0)
    .slice(0, 10)
    .map((s, i) => ({
      id: `INV-${now.getFullYear()}-${String(i + 1).padStart(3, "0")}`,
      school: s.name,
      plan: s.plan as string,
      amount: PLAN_MRR[s.plan as string] ?? 0,
      date: monthLabel,
      status: s.subscription_status === "past_due" ? "overdue" : "paid",
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "الفوترة والإيرادات" : "Facturation & Revenus"}
        description={isAr ? "إدارة الاشتراكات والمدفوعات" : "Gestion des abonnements et paiements"}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="MRR" value={formatCurrency(totalMRR)} icon={DollarSign} color="emerald" />
        <StatsCard title="ARR" value={formatCurrency(totalARR)} icon={TrendingUp} color="blue" />
        <StatsCard title={isAr ? "مدفوع هذا الشهر" : "Encaissé ce mois"} value={formatCurrency(collected)} icon={CreditCard} color="emerald" />
        <StatsCard title={isAr ? "متأخرة" : "En retard"} value={formatCurrency(totalOverdue)} icon={FileText} color="amber" trendLabel={`${overdueSchools.length} ${isAr ? "فاتورة" : "facture(s)"}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {planStats.map((p) => (
          <Card key={p.plans[0]}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-slate-500">{isAr ? p.labelAr : p.labelFr}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">
                    {formatCurrency(p.mrr * p.count)}
                    <span className="text-sm font-normal text-slate-400">/mois</span>
                  </p>
                </div>
                <div className={`h-9 w-9 rounded-lg ${p.color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{p.count}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                {p.count} {isAr ? "مدارس × " : "écoles × "}{formatCurrency(p.mrr)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isAr ? "آخر الفواتير" : "Dernières factures"}</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "رقم الفاتورة" : "N° Facture"}</TableHead>
              <TableHead>{isAr ? "المدرسة" : "École"}</TableHead>
              <TableHead>{isAr ? "الخطة" : "Plan"}</TableHead>
              <TableHead>{isAr ? "المبلغ" : "Montant"}</TableHead>
              <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
              <TableHead>{isAr ? "الحالة" : "Statut"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-slate-400 py-8">{isAr ? "لا توجد فواتير" : "Aucune facture"}</td></tr>
            ) : invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell><code className="text-xs text-slate-500">{inv.id}</code></TableCell>
                <TableCell className="font-medium text-slate-900">{inv.school}</TableCell>
                <TableCell>
                  <Badge variant={["pro","professional"].includes(inv.plan) ? "default" : inv.plan === "enterprise" ? "secondary" : "outline"} className="capitalize">
                    {inv.plan}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">{formatCurrency(inv.amount)}</TableCell>
                <TableCell className="text-slate-500 text-sm">{formatDate(inv.date, locale)}</TableCell>
                <TableCell>
                  <Badge variant={inv.status === "paid" ? "default" : "destructive"}>
                    {inv.status === "paid" ? (isAr ? "مدفوع" : "Payé") : (isAr ? "متأخر" : "En retard")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
