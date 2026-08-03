"use client";
import { useState, useTransition } from "react";
import { Save, Loader2, User, School, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { updateProfile } from "@/lib/actions";

const ROLE_LABELS: Record<string, { fr: string; ar: string; color: string }> = {
  super:   { fr: "Super Admin",  ar: "مشرف المنصة", color: "bg-purple-100 text-purple-700" },
  admin:   { fr: "Directeur",    ar: "مدير",          color: "bg-blue-100 text-blue-700" },
  teacher: { fr: "Enseignant",   ar: "أستاذ",         color: "bg-emerald-100 text-emerald-700" },
  parent:  { fr: "Parent",       ar: "ولي أمر",       color: "bg-amber-100 text-amber-700" },
};

interface Props {
  locale: string;
  profile: {
    id: string;
    role: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string;
    school: { name: string; name_ar?: string } | null;
  };
}

export function ProfileClient({ locale, profile }: Props) {
  const isAr = locale === "ar";
  const roleInfo = ROLE_LABELS[profile.role] ?? { fr: profile.role, ar: profile.role, color: "bg-slate-100 text-slate-700" };

  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName]   = useState(profile.last_name);
  const [phone, setPhone]         = useState(profile.phone ?? "");
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!firstName || !lastName) {
      setError(isAr ? "الاسم الأول واسم العائلة مطلوبان" : "Prénom et nom requis");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await updateProfile({ first_name: firstName, last_name: lastName, phone });
      if (res.error) { setError(res.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  const initials = getInitials(profile.first_name, profile.last_name);
  const schoolName = isAr
    ? ((profile.school as any)?.name_ar || (profile.school as any)?.name)
    : (profile.school as any)?.name;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={isAr ? "ملفي الشخصي" : "Mon profil"}
        description={isAr ? "معلوماتك الشخصية" : "Vos informations personnelles"}
      />

      {/* Avatar card */}
      <Card>
        <CardContent className="p-6 flex items-center gap-5">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl font-bold bg-emerald-100 text-emerald-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900">{profile.first_name} {profile.last_name}</p>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleInfo.color}`}>
                <Shield className="h-3 w-3" />
                {isAr ? roleInfo.ar : roleInfo.fr}
              </span>
              {schoolName && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <School className="h-3 w-3" />
                  {schoolName}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {isAr ? "تعديل المعلومات" : "Modifier mes informations"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {saved && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              {isAr ? "تم حفظ التعديلات بنجاح" : "Modifications enregistrées avec succès"}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isAr ? "الاسم الأول *" : "Prénom *"}</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "اسم العائلة *" : "Nom *"}</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
            <Input value={profile.email} disabled className="bg-slate-50 text-slate-500 cursor-not-allowed" />
            <p className="text-xs text-slate-400">
              {isAr ? "لا يمكن تعديل البريد الإلكتروني" : "L'email ne peut pas être modifié"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{isAr ? "رقم الهاتف" : "Téléphone"}</Label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={isAr ? "+212 6XX XXX XXX" : "+212 6XX XXX XXX"}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{isAr ? "الدور" : "Rôle"}</Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{isAr ? roleInfo.ar : roleInfo.fr}</Badge>
              <span className="text-xs text-slate-400">
                {isAr ? "لا يمكن تعديل الدور" : "Le rôle ne peut pas être modifié"}
              </span>
            </div>
          </div>

          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isAr ? "حفظ التعديلات" : "Enregistrer les modifications"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
