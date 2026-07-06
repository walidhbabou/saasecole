"use client";
import { useState, useTransition } from "react";
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2,
  GraduationCap, Phone, BookOpen, UserCheck, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTeacher, updateTeacher, deleteTeacher, assignTeacherToClass } from "@/lib/actions";
import { getInitials } from "@/lib/utils";

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  created_at: string;
  assigned_class: { id: string; name: string } | null;
}
interface ClassItem { id: string; name: string; }
interface Props { teachers: Teacher[]; classes: ClassItem[]; locale: string; }

const emptyForm = { first_name: "", last_name: "", email: "", password: "", phone: "" };

export function TeachersClient({ teachers: initial, classes, locale }: Props) {
  const isAr = locale === "ar";
  const [teachers, setTeachers] = useState(initial);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Edit modal
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", phone: "" });

  // Assign modal
  const [assignTeacher, setAssignTeacher] = useState<Teacher | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");

  const filtered = teachers.filter(t =>
    `${t.first_name} ${t.last_name} ${t.phone ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(t: Teacher) {
    setEditTeacher(t);
    setEditForm({ first_name: t.first_name, last_name: t.last_name, phone: t.phone ?? "" });
    setError("");
  }

  function openAssign(t: Teacher) {
    setAssignTeacher(t);
    setSelectedClass(t.assigned_class?.id ?? "none");
    setError("");
  }

  function handleAdd() {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError(isAr ? "الحقول المطلوبة: الاسم، البريد، كلمة المرور" : "Prénom, nom, email et mot de passe requis");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await createTeacher(form);
      if (res.error) { setError(res.error); return; }
      setShowAdd(false);
      setForm(emptyForm);
      // Optimistic update — reload via revalidation
      window.location.reload();
    });
  }

  function handleEdit() {
    if (!editTeacher || !editForm.first_name || !editForm.last_name) {
      setError(isAr ? "الاسم مطلوب" : "Prénom et nom requis");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await updateTeacher(editTeacher.id, editForm);
      if (res.error) { setError(res.error); return; }
      setTeachers(prev => prev.map(t => t.id === editTeacher.id ? { ...t, ...editForm } : t));
      setEditTeacher(null);
    });
  }

  function handleDelete(t: Teacher) {
    const name = `${t.first_name} ${t.last_name}`;
    if (!confirm(isAr ? `حذف ${name}؟` : `Supprimer ${name} ?`)) return;
    startTransition(async () => {
      const res = await deleteTeacher(t.id);
      if (res.error) { alert(res.error); return; }
      setTeachers(prev => prev.filter(x => x.id !== t.id));
    });
  }

  function handleAssign() {
    if (!assignTeacher) return;
    setError("");
    startTransition(async () => {
      const classId = selectedClass === "none" ? null : selectedClass;
      const res = await assignTeacherToClass(
        classId ?? assignTeacher.assigned_class?.id ?? "",
        classId ? assignTeacher.id : null
      );
      if (res.error) { setError(res.error); return; }
      const cls = classes.find(c => c.id === classId) ?? null;
      setTeachers(prev => prev.map(t =>
        t.id === assignTeacher.id ? { ...t, assigned_class: cls } : t
      ));
      setAssignTeacher(null);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "إدارة الأساتذة" : "Gestion des enseignants"}
        description={`${teachers.length} ${isAr ? "أستاذ" : "enseignant(s)"} · 2025-2026`}
      >
        <Button size="sm" onClick={() => { setShowAdd(true); setError(""); setForm(emptyForm); }}>
          <Plus className="h-4 w-4" />{isAr ? "إضافة أستاذ" : "Ajouter un enseignant"}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={isAr ? "بحث عن أستاذ..." : "Rechercher un enseignant..."}
              value={search} onChange={e => setSearch(e.target.value)} className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "الأستاذ" : "Enseignant"}</TableHead>
              <TableHead>{isAr ? "الهاتف" : "Téléphone"}</TableHead>
              <TableHead>{isAr ? "القسم المُعيَّن" : "Classe assignée"}</TableHead>
              <TableHead>{isAr ? "تاريخ الإضافة" : "Ajouté le"}</TableHead>
              <TableHead className="text-right">{isAr ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-10">
                  {isAr ? "لا يوجد أساتذة" : "Aucun enseignant"}
                </TableCell>
              </TableRow>
            )}
            {filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                        {getInitials(t.first_name, t.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{t.first_name} {t.last_name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {t.phone ? (
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" />{t.phone}</span>
                  ) : <span className="text-slate-400">—</span>}
                </TableCell>
                <TableCell>
                  {t.assigned_class ? (
                    <Badge variant="secondary" className="gap-1">
                      <BookOpen className="h-3 w-3" />{t.assigned_class.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-400">{isAr ? "غير معيَّن" : "Non assigné"}</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-slate-400">
                  {new Date(t.created_at).toLocaleDateString(isAr ? "ar-MA" : "fr-FR")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openAssign(t)}>
                        <UserCheck className="h-4 w-4" />{isAr ? "تعيين قسم" : "Assigner une classe"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />{isAr ? "تعديل" : "Modifier"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(t)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />{isAr ? "حذف" : "Supprimer"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* ── Add modal ── */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              {isAr ? "إضافة أستاذ جديد" : "Ajouter un enseignant"}
            </DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{isAr ? "الاسم الأول *" : "Prénom *"}</Label>
                <Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "النسب *" : "Nom *"}</Label>
                <Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "كلمة المرور *" : "Mot de passe *"}</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "الهاتف" : "Téléphone"}</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>{isAr ? "إلغاء" : "Annuler"}</Button>
            <Button onClick={handleAdd} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isAr ? "إنشاء الحساب" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit modal ── */}
      <Dialog open={!!editTeacher} onOpenChange={v => { if (!v) setEditTeacher(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{isAr ? "تعديل معلومات الأستاذ" : "Modifier l'enseignant"}</DialogTitle></DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{isAr ? "الاسم الأول *" : "Prénom *"}</Label>
                <Input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "النسب *" : "Nom *"}</Label>
                <Input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "الهاتف" : "Téléphone"}</Label>
              <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTeacher(null)}>{isAr ? "إلغاء" : "Annuler"}</Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              {isAr ? "حفظ" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign class modal ── */}
      <Dialog open={!!assignTeacher} onOpenChange={v => { if (!v) setAssignTeacher(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "تعيين قسم للأستاذ" : "Assigner une classe"}</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="py-2 space-y-3">
            <p className="text-sm text-slate-600">
              {isAr ? "الأستاذ : " : "Enseignant : "}
              <span className="font-semibold">{assignTeacher?.first_name} {assignTeacher?.last_name}</span>
            </p>
            <div className="space-y-1.5">
              <Label>{isAr ? "القسم" : "Classe"}</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر قسماً..." : "Choisir une classe..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isAr ? "بدون تعيين" : "Sans classe"}</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTeacher(null)}>{isAr ? "إلغاء" : "Annuler"}</Button>
            <Button onClick={handleAssign} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              {isAr ? "تأكيد التعيين" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
