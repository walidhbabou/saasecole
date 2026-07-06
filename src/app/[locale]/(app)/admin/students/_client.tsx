"use client";
import { useState, useTransition } from "react";
import { Plus, Search, Download, MoreHorizontal, Pencil, Trash2, Eye, Users } from "lucide-react";
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
import { addStudent, deleteStudent } from "@/lib/actions";

interface Props {
  enrollments: any[];
  classes: any[];
  locale: string;
}

export function StudentsClient({ enrollments, classes, locale }: Props) {
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({ first_name: "", last_name: "", matricule: "", gender: "M", birth_date: "", class_id: "" });
  const [error, setError] = useState("");

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
    startTransition(async () => {
      const res = await addStudent(form);
      if (res.error) { setError(res.error); return; }
      setShowModal(false);
      setForm({ first_name: "", last_name: "", matricule: "", gender: "M", birth_date: "", class_id: "" });
    });
  }

  function handleDelete(studentId: string) {
    if (!confirm(isAr ? "هل تريد حذف هذا التلميذ؟" : "Supprimer cet élève ?")) return;
    startTransition(async () => { await deleteStudent(studentId); });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "إدارة التلاميذ" : "Gestion des élèves"}
        description={`${enrollments.length} ${isAr ? "تلميذ مسجل" : "élèves inscrits"}`}
      >
        <Button variant="outline" size="sm"><Download className="h-4 w-4" />{isAr ? "تصدير" : "Exporter"}</Button>
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
                          <DropdownMenuItem><Eye className="h-4 w-4" />{isAr ? "التفاصيل" : "Voir détails"}</DropdownMenuItem>
                          <DropdownMenuItem><Pencil className="h-4 w-4" />{isAr ? "تعديل" : "Modifier"}</DropdownMenuItem>
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
            <Button onClick={handleAdd} disabled={isPending}>{isPending ? "..." : (isAr ? "حفظ" : "Enregistrer")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
