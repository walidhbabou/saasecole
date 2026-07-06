"use client";
import { useState, useTransition } from "react";
import { Search, PlusCircle, MoreHorizontal, CheckCircle, XCircle, Loader2, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { toggleSchoolStatus, createSchoolWithAdmin } from "@/lib/actions";
import { PLAN_MRR } from "@/lib/constants";

interface Props { schools: any[]; locale: string; }

const emptyForm = {
  name: "", name_ar: "", city: "", plan: "pro",
  adminEmail: "", adminPassword: "", adminFirstName: "", adminLastName: "",
};

export function SuperSchoolsClient({ schools: initialSchools, locale }: Props) {
  const isAr = locale === "ar";
  const [schools, setSchools] = useState(initialSchools);
  const [q, setQ] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const filtered = schools.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) || (s.city ?? "").toLowerCase().includes(q.toLowerCase())
  );

  function handleToggle(id: string, currentStatus: string) {
    startTransition(async () => {
      const res = await toggleSchoolStatus(id, currentStatus);
      if (!res.error) {
        setSchools(prev => prev.map(s => s.id === id ? { ...s, subscription_status: res.newStatus } : s));
      }
    });
  }

  function handleFormChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleCreate() {
    if (!form.name || !form.adminEmail || !form.adminPassword || !form.adminFirstName || !form.adminLastName) {
      setFormError(isAr ? "يرجى ملء جميع الحقول الإلزامية" : "Veuillez remplir tous les champs obligatoires");
      return;
    }
    startTransition(async () => {
      setFormError("");
      const res = await createSchoolWithAdmin(form);
      if (res.error) { setFormError(res.error); return; }
      setFormSuccess(isAr ? "تم إنشاء المدرسة والحساب بنجاح" : "École et compte créés avec succès");
      // Append new school to list
      setSchools(prev => [...prev, {
        id: res.schoolId,
        name: form.name,
        name_ar: form.name_ar,
        city: form.city,
        plan: form.plan,
        subscription_status: "active",
        created_at: new Date().toISOString(),
      }]);
      setTimeout(() => {
        setShowModal(false);
        setForm(emptyForm);
        setFormSuccess("");
      }, 1500);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "المدارس" : "Gestion des écoles"}
        description={`${schools.length} ${isAr ? "مدارس مسجلة" : "écoles enregistrées"}`}
      >
        <Button onClick={() => { setShowModal(true); setFormError(""); setFormSuccess(""); }}>
          <PlusCircle className="h-4 w-4" />
          {isAr ? "إضافة مدرسة" : "Ajouter une école"}
        </Button>
      </PageHeader>

      <Card>
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder={isAr ? "بحث..." : "Rechercher..."} value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "المدرسة" : "École"}</TableHead>
              <TableHead>{isAr ? "المدينة" : "Ville"}</TableHead>
              <TableHead>{isAr ? "الخطة" : "Plan"}</TableHead>
              <TableHead>MRR</TableHead>
              <TableHead>{isAr ? "الحالة" : "Statut"}</TableHead>
              <TableHead className="text-right">{isAr ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  {isAr ? "لا توجد مدارس" : "Aucune école"}
                </TableCell>
              </TableRow>
            ) : filtered.map(s => {
              const isActive = s.subscription_status === "active";
              return (
                <TableRow key={s.id} className={!isActive ? "opacity-50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">{s.city ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={s.plan === "pro" || s.plan === "professional" ? "default" : s.plan === "enterprise" ? "secondary" : "outline"} className="capitalize">
                      {s.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-emerald-600">{formatCurrency(PLAN_MRR[s.plan as string] ?? 0)}</TableCell>
                  <TableCell>
                    {isActive
                      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />{isAr ? "نشط" : "Actif"}</span>
                      : <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-slate-300 inline-block" />{isAr ? "معطل" : "Suspendu"}</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isPending}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggle(s.id, s.subscription_status)}
                          className={isActive ? "text-amber-600" : "text-emerald-600"}
                        >
                          {isActive
                            ? <><XCircle className="h-4 w-4" />{isAr ? "تعليق" : "Suspendre"}</>
                            : <><CheckCircle className="h-4 w-4" />{isAr ? "تفعيل" : "Activer"}</>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* ── Modal: Ajouter une école ─────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                {isAr ? "إضافة مدرسة جديدة" : "Ajouter une nouvelle école"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{formError}</div>
              )}
              {formSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{formSuccess}</div>
              )}

              {/* School info */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  {isAr ? "معلومات المدرسة" : "Informations de l'école"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>{isAr ? "اسم المدرسة (FR) *" : "Nom de l'école (FR) *"}</Label>
                    <Input value={form.name} onChange={e => handleFormChange("name", e.target.value)} placeholder="École Al Amal" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>{isAr ? "اسم المدرسة (AR)" : "Nom de l'école (AR)"}</Label>
                    <Input value={form.name_ar} onChange={e => handleFormChange("name_ar", e.target.value)} dir="rtl" placeholder="مدرسة الأمل" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{isAr ? "المدينة" : "Ville"}</Label>
                    <Input value={form.city} onChange={e => handleFormChange("city", e.target.value)} placeholder="Casablanca" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{isAr ? "الخطة" : "Plan"}</Label>
                    <Select value={form.plan} onValueChange={v => handleFormChange("plan", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic — 29 MAD/mois</SelectItem>
                        <SelectItem value="pro">Pro — 79 MAD/mois</SelectItem>
                        <SelectItem value="enterprise">Enterprise — 299 MAD/mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Admin account */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  {isAr ? "حساب المدير" : "Compte directeur"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{isAr ? "الاسم *" : "Prénom *"}</Label>
                    <Input value={form.adminFirstName} onChange={e => handleFormChange("adminFirstName", e.target.value)} placeholder={isAr ? "رشيد" : "Rachid"} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{isAr ? "اللقب *" : "Nom *"}</Label>
                    <Input value={form.adminLastName} onChange={e => handleFormChange("adminLastName", e.target.value)} placeholder="Benali" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                    <Input value={form.adminEmail} onChange={e => handleFormChange("adminEmail", e.target.value)} type="email" placeholder="admin@ecole.ma" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>{isAr ? "كلمة المرور *" : "Mot de passe *"}</Label>
                    <Input value={form.adminPassword} onChange={e => handleFormChange("adminPassword", e.target.value)} type="password" placeholder="••••••••" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={isPending}>
                {isAr ? "إلغاء" : "Annuler"}
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" />{isAr ? "جاري الإنشاء..." : "Création..."}</>
                  : <><PlusCircle className="h-4 w-4" />{isAr ? "إنشاء" : "Créer"}</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
