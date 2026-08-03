"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, BookOpen, MoreHorizontal, Pencil, Trash2, UserCheck, Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { addClass, deleteClass, assignTeacherToClass } from "@/lib/actions";

interface Props { classes: any[]; teachers: { id: string; first_name: string; last_name: string }[]; locale: string; }

export function ClassesClient({ classes, teachers, locale }: Props) {
  const isAr = locale === "ar";
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", max_students: 30 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [assignClass, setAssignClass] = useState<any>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("none");

  const filtered = classes.filter(c =>
    `${c.name} ${(c.teacher as any)?.first_name ?? ""} ${(c.teacher as any)?.last_name ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd() {
    if (!form.name) { setError(isAr ? "أدخل اسم القسم" : "Saisissez le nom de la classe"); return; }
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await addClass(form);
      if (res.error) { setError(res.error); return; }
      setShowModal(false);
      setForm({ name: "", max_students: 30 });
      setSuccess(isAr ? "تم إنشاء القسم" : "Classe créée");
    });
  }

  function handleDelete(id: string) {
    if (!confirm(isAr ? "هل تريد حذف هذا القسم؟" : "Supprimer cette classe ?")) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await deleteClass(id);
      if (res.error) { setError(res.error); return; }
      setSuccess(isAr ? "تم حذف القسم" : "Classe supprimée");
      router.refresh();
    });
  }

  function openAssign(cls: any) {
    setAssignClass(cls);
    setSelectedTeacher((cls.teacher as any)?.id ?? "none");
    setError("");
  }

  function handleAssign() {
    if (!assignClass) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const teacherId = selectedTeacher === "none" ? null : selectedTeacher;
      const res = await assignTeacherToClass(assignClass.id, teacherId);
      if (res.error) { setError(res.error); return; }
      setAssignClass(null);
      setSuccess(isAr ? "تم تحديث التعيين" : "Affectation mise à jour");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "إدارة الأقسام" : "Gestion des classes"}
        description={`${classes.length} ${isAr ? "قسم" : "classes"} · 2025-2026`}
      >
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />{isAr ? "إضافة قسم" : "Ajouter une classe"}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder={isAr ? "البحث عن قسم..." : "Rechercher une classe..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "اسم القسم" : "Classe"}</TableHead>
              <TableHead>{isAr ? "الأستاذ المسؤول" : "Enseignant"}</TableHead>
              <TableHead>{isAr ? "التلاميذ" : "Élèves"}</TableHead>
              <TableHead>{isAr ? "الامتلاء" : "Occupation"}</TableHead>
              <TableHead className="text-right">{isAr ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((cls) => {
              const occ = Math.round((cls.students_count / cls.max_students) * 100);
              const isFull = cls.students_count >= cls.max_students;
              const teacher = cls.teacher as any;
              return (
                <TableRow key={cls.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-slate-900">{cls.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 text-sm">
                    {teacher ? `${teacher.first_name} ${teacher.last_name}` : <span className="text-slate-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {cls.students_count}/{cls.max_students}
                    </span>
                  </TableCell>
                  <TableCell className="w-28">
                    <div className="space-y-1">
                      <Progress value={occ} className={`h-1.5 ${isFull ? "[&>div]:bg-red-500" : ""}`} />
                      <p className="text-xs text-slate-400">{occ}%</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAssign(cls)}>
                          <UserCheck className="h-4 w-4" />{isAr ? "تعيين أستاذ" : "Assigner un enseignant"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(cls.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isAr ? "إضافة قسم" : "Ajouter une classe"}</DialogTitle></DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{isAr ? "اسم القسم" : "Nom de la classe"}</Label>
              <Input placeholder="CM2-A" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الطاقة الاستيعابية" : "Capacité"}</Label>
              <Input type="number" value={form.max_students} onChange={e => setForm(f => ({ ...f, max_students: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>{isAr ? "إلغاء" : "Annuler"}</Button>
            <Button onClick={handleAdd} disabled={isPending}>{isPending ? "..." : (isAr ? "حفظ" : "Enregistrer")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignClass} onOpenChange={v => { if (!v) setAssignClass(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{isAr ? "تعيين أستاذ للقسم" : "Assigner un enseignant"}</DialogTitle></DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="py-2 space-y-3">
            <p className="text-sm text-slate-600">
              {isAr ? "القسم : " : "Classe : "}
              <span className="font-semibold">{assignClass?.name}</span>
            </p>
            <div className="space-y-1.5">
              <Label>{isAr ? "الأستاذ" : "Enseignant"}</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر أستاذاً..." : "Choisir un enseignant..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isAr ? "بدون أستاذ" : "Sans enseignant"}</SelectItem>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignClass(null)}>{isAr ? "إلغاء" : "Annuler"}</Button>
            <Button onClick={handleAssign} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              {isAr ? "تأكيد" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
