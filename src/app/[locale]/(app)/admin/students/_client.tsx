"use client";
import { useState, useTransition } from "react";
import { Plus, Search, Download, MoreHorizontal, Pencil, Trash2, Eye, Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { getInitials } from "@/lib/utils";
import { addStudent, deleteStudent, updateStudent } from "@/lib/actions";

interface Props {
  enrollments: any[];
  classes: any[];
  locale: string;
}

const emptyForm = { first_name: "", last_name: "", matricule: "", gender: "M", birth_date: "", class_id: "" };

export function StudentsClient({ enrollments, classes, locale }: Props) {
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");
  const [feedbackKind, setFeedbackKind] = useState<"success" | "error" | "">("");

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  // Edit state
  const [editEnrollment, setEditEnrollment] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", matricule: "", gender: "M", birth_date: "" });
  const [editError, setEditError] = useState("");

  const filtered = enrollments.filter((e) => {
    const s = e.student;
    const q = search.toLowerCase();
    const match = `${s.first_name} ${s.last_name} ${s.matricule}`.toLowerCase().includes(q);
    const classMatch = filterClass === "all" || (e.class as any)?.name === filterClass;
    return match && classMatch;
  });

  const classNames = [...new Set(enrollments.map(e => (e.class as any)?.name).filter(Boolean))];

  function handleAdd() {
    if (!form.first_name || !form.last_name || !form.matricule || !form.class_id) {
      setError(isAr ? "يرجى ملء جميع الحقول" : "Veuillez remplir tous les champs");
      return;
    }
    setError("");
    setFeedback("");
    setFeedbackKind("");
    startTransition(async () => {
      const res = await addStudent(form);
      if (res.error) { setError(res.error); setFeedback(res.error); setFeedbackKind("error"); return; }
      setShowModal(false);
      setForm(emptyForm);
      setFeedback(isAr ? "تم إنشاء التلميذ" : "Élève créé");
      setFeedbackKind("success");
    });
  }

  function openEdit(e: any) {
    setEditEnrollment(e);
    setEditForm({
      first_name: e.student.first_name,
      last_name: e.student.last_name,
      matricule: e.student.matricule,
      gender: e.student.gender ?? "M",
      birth_date: e.student.birth_date ?? "",
    });
    setEditError("");
  }

  function handleEdit() {
    if (!editEnrollment || !editForm.first_name || !editForm.last_name || !editForm.matricule) {
      setEditError(isAr ? "الاسم ورقم التسجيل مطلوبان" : "Prénom, nom et matricule requis");
      return;
    }
    setEditError("");
    startTransition(async () => {
      const res = await updateStudent(editEnrollment.student.id, editForm);
      if (res.error) { setEditError(res.error); setFeedback(res.error); setFeedbackKind("error"); return; }
      setEditEnrollment(null);
      setFeedback(isAr ? "تم تحديث التلميذ" : "Élève modifié");
      setFeedbackKind("success");
    });
  }

  function handleDelete(studentId: string) {
    if (!confirm(isAr ? "هل تريد حذف هذا التلميذ؟" : "Supprimer cet élève ?")) return;
    setFeedback("");
    setFeedbackKind("");
    startTransition(async () => {
      const res = await deleteStudent(studentId);
      if (res.error) { setFeedback(res.error); setFeedbackKind("error"); return; }
      setFeedback(isAr ? "تم حذف التلميذ" : "Élève supprimé");
      setFeedbackKind("success");
    });
  }

  function handleExport() {
    const headers = isAr
      ? ["الاسم الأول", "اسم العائلة", "رقم التسجيل", "الجنس", "تاريخ الميلاد", "القسم"]
      : ["Prénom", "Nom", "Matricule", "Genre", "Date naissance", "Classe"];
    const rows = filtered.map(e => [
      e.student.first_name,
      e.student.last_name,
      e.student.matricule,
      e.student.gender ?? "",
      e.student.birth_date ?? "",
      (e.class as any)?.name ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eleves-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "إدارة التلاميذ" : "Gestion des élèves"}
        description={`${enrollments.length} ${isAr ? "تلميذ مسجل" : "élèves inscrits"}`}
      >
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" />{isAr ? "تصدير CSV" : "Exporter CSV"}
        </Button>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />{isAr ? "إضافة تلميذ" : "Ajouter un élève"}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder={isAr ? "البحث عن تلميذ..." : "Rechercher un élève..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={isAr ? "جميع الأقسام" : "Toutes les classes"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع الأقسام" : "Toutes les classes"}</SelectItem>
              {classNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        {feedback && (
          <div className={`mx-4 mt-4 rounded-lg border px-4 py-3 text-sm ${feedbackKind === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {feedback}
          </div>
        )}
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title={isAr ? "لا يوجد تلاميذ" : "Aucun élève trouvé"} actionLabel={isAr ? "إضافة تلميذ" : "Ajouter"} onAction={() => setShowModal(true)} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "التلميذ" : "Élève"}</TableHead>
                <TableHead>{isAr ? "رقم التسجيل" : "Matricule"}</TableHead>
                <TableHead>{isAr ? "القسم" : "Classe"}</TableHead>
                <TableHead>{isAr ? "الجنس" : "Genre"}</TableHead>
                <TableHead>{isAr ? "تاريخ الميلاد" : "Naissance"}</TableHead>
                <TableHead className="text-right">{isAr ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const s = e.student;
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                          {getInitials(s.first_name, s.last_name)}
                        </div>
                        <span className="font-medium text-slate-900">{s.first_name} {s.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell><code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{s.matricule}</code></TableCell>
                    <TableCell><Badge variant="secondary">{(e.class as any)?.name ?? "—"}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={s.gender === "M" ? "info" : "default"}>
                        {s.gender === "M" ? (isAr ? "ذكر" : "Masculin") : (isAr ? "أنثى" : "Féminin")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{s.birth_date ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(e)}>
                            <Eye className="h-4 w-4" />{isAr ? "التفاصيل / تعديل" : "Détails / Modifier"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash2 className="h-4 w-4" />{isAr ? "حذف" : "Supprimer"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ── Add modal ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة تلميذ" : "Ajouter un élève"}</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2"><Label>{isAr ? "الاسم الأول" : "Prénom"}</Label><Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{isAr ? "اسم العائلة" : "Nom"}</Label><Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{isAr ? "رقم التسجيل" : "Matricule"}</Label><Input placeholder="2025-XXX" value={form.matricule} onChange={e => setForm(f => ({ ...f, matricule: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>{isAr ? "الجنس" : "Genre"}</Label>
              <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">{isAr ? "ذكر" : "Masculin"}</SelectItem>
                  <SelectItem value="F">{isAr ? "أنثى" : "Féminin"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{isAr ? "تاريخ الميلاد" : "Date de naissance"}</Label><Input type="date" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>{isAr ? "القسم" : "Classe"}</Label>
              <Select value={form.class_id} onValueChange={v => setForm(f => ({ ...f, class_id: v }))}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر القسم" : "Choisir"} /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>{isAr ? "إلغاء" : "Annuler"}</Button>
            <Button onClick={handleAdd} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isAr ? "حفظ" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit modal ── */}
      <Dialog open={!!editEnrollment} onOpenChange={v => { if (!v) setEditEnrollment(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "تعديل معلومات التلميذ" : "Modifier l'élève"}</DialogTitle>
          </DialogHeader>
          {editError && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{editError}</p>}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2"><Label>{isAr ? "الاسم الأول" : "Prénom"}</Label><Input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{isAr ? "اسم العائلة" : "Nom"}</Label><Input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{isAr ? "رقم التسجيل" : "Matricule"}</Label><Input value={editForm.matricule} onChange={e => setEditForm(f => ({ ...f, matricule: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>{isAr ? "الجنس" : "Genre"}</Label>
              <Select value={editForm.gender} onValueChange={v => setEditForm(f => ({ ...f, gender: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">{isAr ? "ذكر" : "Masculin"}</SelectItem>
                  <SelectItem value="F">{isAr ? "أنثى" : "Féminin"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2"><Label>{isAr ? "تاريخ الميلاد" : "Date de naissance"}</Label><Input type="date" value={editForm.birth_date} onChange={e => setEditForm(f => ({ ...f, birth_date: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEnrollment(null)}>{isAr ? "إلغاء" : "Annuler"}</Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              {isAr ? "حفظ التعديلات" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
