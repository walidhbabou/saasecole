"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2,
  Phone, Users, UserCheck, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createParent, updateParent, deleteParent, linkParentToStudent } from "@/lib/actions";
import { getInitials } from "@/lib/utils";

interface Student { id: string; first_name: string; last_name: string; matricule: string; }
interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  created_at: string;
  student: Student | null;
}
interface Props { parents: Parent[]; students: Student[]; locale: string; }

const emptyForm = { first_name: "", last_name: "", email: "", password: "", phone: "", student_id: "" };

export function ParentsClient({ parents: initial, students, locale }: Props) {
  const isAr = locale === "ar";
  const router = useRouter();
  const [parents, setParents] = useState(initial);
  useEffect(() => { setParents(initial); }, [initial]);

  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Edit modal
  const [editParent, setEditParent] = useState<Parent | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", phone: "" });

  // Link modal
  const [linkParent, setLinkParent] = useState<Parent | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("none");

  const filtered = parents.filter(p =>
    `${p.first_name} ${p.last_name} ${p.phone ?? ""} ${p.student?.first_name ?? ""} ${p.student?.last_name ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(p: Parent) {
    setEditParent(p);
    setEditForm({ first_name: p.first_name, last_name: p.last_name, phone: p.phone ?? "" });
    setError("");
  }

  function openLink(p: Parent) {
    setLinkParent(p);
    setSelectedStudent(p.student?.id ?? "none");
    setError("");
  }

  function handleAdd() {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError(isAr ? "الاسم والبريد وكلمة المرور مطلوبة" : "Prénom, nom, email et mot de passe requis");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await createParent(form);
      if (res.error) { setError(res.error); return; }
      setShowAdd(false);
      setForm(emptyForm);
      if (res.parent) {
        setParents(prev => [...prev, res.parent!]);
      }
      router.refresh();
    });
  }

  function handleEdit() {
    if (!editParent || !editForm.first_name || !editForm.last_name) {
      setError(isAr ? "الاسم مطلوب" : "Prénom et nom requis");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await updateParent(editParent.id, editForm);
      if (res.error) { setError(res.error); return; }
      setParents(prev => prev.map(p => p.id === editParent.id ? { ...p, ...editForm } : p));
      setEditParent(null);
    });
  }

  function handleDelete(p: Parent) {
    const name = `${p.first_name} ${p.last_name}`;
    if (!confirm(isAr ? `حذف ${name}؟` : `Supprimer ${name} ?`)) return;
    startTransition(async () => {
      const res = await deleteParent(p.id);
      if (res.error) { alert(res.error); return; }
      setParents(prev => prev.filter(x => x.id !== p.id));
    });
  }

  function handleLink() {
    if (!linkParent) return;
    setError("");
    startTransition(async () => {
      const studentId = selectedStudent === "none" ? null : selectedStudent;
      const res = await linkParentToStudent(linkParent.id, studentId);
      if (res.error) { setError(res.error); return; }
      const stu = students.find(s => s.id === studentId) ?? null;
      setParents(prev => prev.map(p => p.id === linkParent.id ? { ...p, student: stu } : p));
      setLinkParent(null);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "إدارة أولياء الأمور" : "Gestion des parents"}
        description={`${parents.length} ${isAr ? "ولي أمر" : "parent(s)"} · 2025-2026`}
      >
        <Button size="sm" onClick={() => { setShowAdd(true); setError(""); setForm(emptyForm); }}>
          <Plus className="h-4 w-4" />{isAr ? "إضافة ولي أمر" : "Ajouter un parent"}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={isAr ? "بحث عن ولي أمر..." : "Rechercher un parent..."}
              value={search} onChange={e => setSearch(e.target.value)} className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "الاسم" : "Parent"}</TableHead>
              <TableHead>{isAr ? "الهاتف" : "Téléphone"}</TableHead>
              <TableHead>{isAr ? "التلميذ المرتبط" : "Élève lié"}</TableHead>
              <TableHead>{isAr ? "تاريخ الإضافة" : "Ajouté le"}</TableHead>
              <TableHead className="text-right">{isAr ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-10">
                  {isAr ? "لا يوجد أولياء أمور" : "Aucun parent"}
                </TableCell>
              </TableRow>
            )}
            {filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                        {getInitials(p.first_name, p.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-slate-900 text-sm">{p.first_name} {p.last_name}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {p.phone ? (
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" />{p.phone}</span>
                  ) : <span className="text-slate-400">—</span>}
                </TableCell>
                <TableCell>
                  {p.student ? (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {p.student.first_name} {p.student.last_name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-400">{isAr ? "غير مرتبط" : "Non lié"}</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-slate-400">
                  {new Date(p.created_at).toLocaleDateString(isAr ? "ar-MA" : "fr-FR")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openLink(p)}>
                        <UserCheck className="h-4 w-4" />{isAr ? "ربط بتلميذ" : "Lier à un élève"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />{isAr ? "تعديل" : "Modifier"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(p)}
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
              <Users className="h-5 w-5 text-purple-600" />
              {isAr ? "إضافة ولي أمر جديد" : "Ajouter un parent"}
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
            <div className="space-y-1.5">
              <Label>{isAr ? "التلميذ المرتبط" : "Élève lié"}</Label>
              <Select value={form.student_id || "none"} onValueChange={v => setForm(f => ({ ...f, student_id: v === "none" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر تلميذاً..." : "Choisir un élève..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isAr ? "بدون ربط" : "Sans élève"}</SelectItem>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} — {s.matricule}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
      <Dialog open={!!editParent} onOpenChange={v => { if (!v) setEditParent(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "تعديل ولي الأمر" : "Modifier le parent"}</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{isAr ? "الاسم الأول" : "Prénom"}</Label>
                <Input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "النسب" : "Nom"}</Label>
                <Input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "الهاتف" : "Téléphone"}</Label>
              <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditParent(null)}>{isAr ? "إلغاء" : "Annuler"}</Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              {isAr ? "حفظ" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Link modal ── */}
      <Dialog open={!!linkParent} onOpenChange={v => { if (!v) setLinkParent(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "ربط ولي الأمر بتلميذ" : "Lier à un élève"}</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="py-2 space-y-3">
            <p className="text-sm text-slate-600">
              {isAr ? "ولي الأمر : " : "Parent : "}
              <span className="font-semibold">{linkParent?.first_name} {linkParent?.last_name}</span>
            </p>
            <div className="space-y-1.5">
              <Label>{isAr ? "التلميذ" : "Élève"}</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر تلميذاً..." : "Choisir un élève..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isAr ? "بدون ربط" : "Aucun élève"}</SelectItem>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} — {s.matricule}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkParent(null)}>{isAr ? "إلغاء" : "Annuler"}</Button>
            <Button onClick={handleLink} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              {isAr ? "تأكيد" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
