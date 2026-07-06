"use client";
import { useState, useTransition } from "react";
import { Search, CheckCircle2, AlertCircle, Clock, MoreHorizontal, Banknote } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/shared/StatsCard";
import { FeeBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { markFeePaid } from "@/lib/actions";

interface Props { fees: any[]; locale: string; }

export function FeesClient({ fees: initialFees, locale }: Props) {
  const isAr = locale === "ar";
  const [fees, setFees] = useState(initialFees);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered = fees.filter(f => {
    const s = f.student as any;
    const match = `${s?.first_name} ${s?.last_name}`.toLowerCase().includes(search.toLowerCase());
    return match && (filterStatus === "all" || f.status === filterStatus);
  });

  const totalPaid    = fees.filter(f => f.status === "paid").reduce((a, f) => a + Number(f.amount), 0);
  const totalOverdue = fees.filter(f => f.status === "overdue").reduce((a, f) => a + Number(f.amount), 0);
  const totalPending = fees.filter(f => f.status === "pending").reduce((a, f) => a + Number(f.amount), 0);

  function handleMarkPaid(id: string) {
    startTransition(async () => {
      const res = await markFeePaid(id);
      if (!res.error) {
        setFees(prev => prev.map(f => f.id === id ? { ...f, status: "paid", paid_at: new Date().toISOString() } : f));
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title={isAr ? "الرسوم الدراسية" : "Frais scolaires"} description="2025-2026" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title={isAr ? "مدفوعة" : "Payés"} value={formatCurrency(totalPaid)} icon={CheckCircle2} color="emerald" />
        <StatsCard title={isAr ? "متأخرة" : "En souffrance"} value={formatCurrency(totalOverdue)} icon={AlertCircle} color="red" />
        <StatsCard title={isAr ? "في الانتظار" : "En attente"} value={formatCurrency(totalPending)} icon={Clock} color="amber" />
      </div>

      <Card>
        <CardContent className="p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder={isAr ? "بحث..." : "Rechercher..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "كل الحالات" : "Tous les statuts"}</SelectItem>
              <SelectItem value="paid">{isAr ? "مدفوع" : "Payé"}</SelectItem>
              <SelectItem value="pending">{isAr ? "في الانتظار" : "En attente"}</SelectItem>
              <SelectItem value="overdue">{isAr ? "متأخر" : "En retard"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "التلميذ" : "Élève"}</TableHead>
              <TableHead>{isAr ? "البيان" : "Description"}</TableHead>
              <TableHead>{isAr ? "المبلغ" : "Montant"}</TableHead>
              <TableHead>{isAr ? "الاستحقاق" : "Échéance"}</TableHead>
              <TableHead>{isAr ? "الحالة" : "Statut"}</TableHead>
              <TableHead className="text-right">{isAr ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">{isAr ? "لا توجد نتائج" : "Aucun résultat"}</TableCell></TableRow>
            ) : filtered.map((fee) => {
              const s = fee.student as any;
              const ft = fee.fee_type as any;
              return (
                <TableRow key={fee.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {(s?.first_name ?? "?").charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{s?.first_name} {s?.last_name}</p>
                        <code className="text-[10px] text-slate-400">{s?.matricule}</code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{isAr ? ft?.name_ar : ft?.name ?? "—"}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(Number(fee.amount))}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{fee.due_date ? formatDate(fee.due_date, locale) : "—"}</TableCell>
                  <TableCell><FeeBadge status={fee.status} /></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {fee.status !== "paid" && (
                          <DropdownMenuItem onClick={() => handleMarkPaid(fee.id)} className="text-emerald-600" disabled={isPending}>
                            <Banknote className="h-4 w-4" />{isAr ? "تحديد كمدفوع" : "Marquer payé"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>{isAr ? "تعديل" : "Modifier"}</DropdownMenuItem>
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
