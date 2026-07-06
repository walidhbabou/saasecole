"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, School, Globe, Bell, CreditCard, Loader2 } from "lucide-react";
import { updateSchool, updateNotificationPrefs } from "@/lib/actions";
import { PLANS, PLAN_MRR } from "@/lib/constants";

interface NotifPrefs { absences: boolean; fees: boolean; enrollments: boolean; }

interface Props { locale: string; school: any; }

export function AdminSettingsClient({ locale, school }: Props) {
  const isAr = locale === "ar";
  const router = useRouter();

  // School info state
  const [name, setName]       = useState(school?.name ?? "");
  const [nameAr, setNameAr]   = useState(school?.name_ar ?? "");
  const [phone, setPhone]     = useState(school?.phone ?? "");
  const [email, setEmail]     = useState(school?.email ?? "");
  const [address, setAddress] = useState(school?.address ?? "");
  const [city, setCity]       = useState(school?.city ?? "");
  const [schoolSaved, setSchoolSaved] = useState(false);
  const [schoolError, setSchoolError] = useState("");
  const [isSchoolPending, startSchoolTransition] = useTransition();

  // Notification prefs state
  const defaultPrefs: NotifPrefs = school?.notification_prefs ?? { absences: true, fees: true, enrollments: false };
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [notifSaved, setNotifSaved] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [isNotifPending, startNotifTransition] = useTransition();

  const plan = school?.plan ?? "basic";
  const planPrice = PLAN_MRR[plan] ?? 0;
  const planData = PLANS.find(p => p.id === plan || (plan === "pro" && p.id === "professional"));

  function handleSaveSchool() {
    startSchoolTransition(async () => {
      setSchoolSaved(false);
      setSchoolError("");
      const res = await updateSchool({ name, name_ar: nameAr, phone, email, address, city });
      if (res.error) { setSchoolError(res.error); return; }
      setSchoolSaved(true);
      setTimeout(() => setSchoolSaved(false), 3000);
    });
  }

  function handleSaveNotifs() {
    startNotifTransition(async () => {
      setNotifSaved(false);
      setNotifError("");
      const res = await updateNotificationPrefs(prefs);
      if (res.error) { setNotifError(res.error); return; }
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    });
  }

  function switchLocale(code: string) {
    const segments = window.location.pathname.split("/");
    segments[1] = code;
    router.push(segments.join("/"));
  }

  const NOTIF_ITEMS: { key: keyof NotifPrefs; labelFr: string; labelAr: string; descFr: string; descAr: string }[] = [
    { key: "absences",    labelFr: "Absences élèves",       labelAr: "غياب التلاميذ",      descFr: "Notifier le parent dès qu'un élève est absent",   descAr: "إشعار ولي الأمر فور غياب التلميذ" },
    { key: "fees",        labelFr: "Frais impayés",          labelAr: "الرسوم المتأخرة",    descFr: "Rappel automatique avant l'échéance",             descAr: "تذكير تلقائي قبل تاريخ الاستحقاق" },
    { key: "enrollments", labelFr: "Nouvelles inscriptions", labelAr: "التسجيلات الجديدة", descFr: "Confirmation par email",                          descAr: "تأكيد بالبريد الإلكتروني" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "الإعدادات" : "Paramètres"}
        description={isAr ? "إعدادات المؤسسة" : "Configuration de votre établissement"}
      />

      <Tabs defaultValue="school">
        <TabsList>
          <TabsTrigger value="school"><School className="h-4 w-4 mr-1" />{isAr ? "المعلومات" : "École"}</TabsTrigger>
          <TabsTrigger value="lang"><Globe className="h-4 w-4 mr-1" />{isAr ? "اللغة" : "Langue"}</TabsTrigger>
          <TabsTrigger value="notif"><Bell className="h-4 w-4 mr-1" />{isAr ? "الإشعارات" : "Notifications"}</TabsTrigger>
          <TabsTrigger value="sub"><CreditCard className="h-4 w-4 mr-1" />{isAr ? "الاشتراك" : "Abonnement"}</TabsTrigger>
        </TabsList>

        {/* ── School info ── */}
        <TabsContent value="school">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "معلومات المدرسة" : "Informations de l'école"}</CardTitle>
              <CardDescription>{isAr ? "تظهر على الوثائق الرسمية" : "Affichées sur les documents officiels"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {schoolError && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{schoolError}</div>}
              {schoolSaved && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{isAr ? "تم الحفظ بنجاح" : "Modifications enregistrées"}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isAr ? "اسم المدرسة (FR)" : "Nom de l'école (FR)"}</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "اسم المدرسة (AR)" : "Nom de l'école (AR)"}</Label>
                  <Input value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الهاتف" : "Téléphone"}</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "المدينة" : "Ville"}</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "العنوان" : "Adresse"}</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>
              <Separator />
              <Button onClick={handleSaveSchool} disabled={isSchoolPending}>
                {isSchoolPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isAr ? "حفظ التعديلات" : "Enregistrer les modifications"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Language ── */}
        <TabsContent value="lang">
          <Card>
            <CardHeader><CardTitle>{isAr ? "اللغة والمنطقة" : "Langue & Région"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { code: "fr", label: "Français", flag: "🇫🇷", desc: isAr ? "واجهة فرنسية" : "Interface en français (LTR)" },
                  { code: "ar", label: "العربية",   flag: "🇲🇦", desc: isAr ? "واجهة عربية RTL" : "Interface arabe (RTL)" },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => switchLocale(lang.code)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${lang.code === locale ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <p className="font-medium text-slate-900">{lang.label}</p>
                      <p className="text-xs text-slate-500">{lang.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notif">
          <Card>
            <CardHeader><CardTitle>{isAr ? "الإشعارات" : "Notifications"}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {notifError && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{notifError}</div>}
              {notifSaved && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{isAr ? "تم الحفظ" : "Préférences enregistrées"}</div>}
              {NOTIF_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{isAr ? item.labelAr : item.labelFr}</p>
                    <p className="text-xs text-slate-500">{isAr ? item.descAr : item.descFr}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key] }))}
                    className={`h-5 w-9 rounded-full relative transition-colors ${prefs[item.key] ? "bg-emerald-500" : "bg-slate-200"}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${prefs[item.key] ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
              <div className="pt-3">
                <Button onClick={handleSaveNotifs} disabled={isNotifPending} size="sm">
                  {isNotifPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isAr ? "حفظ الإشعارات" : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Subscription ── */}
        <TabsContent value="sub">
          <Card>
            <CardHeader><CardTitle>{isAr ? "الاشتراك" : "Abonnement"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900 text-xl">
                        {planData ? (isAr ? planData.nameAr : planData.nameFr) : plan}
                      </p>
                      <Badge>{isAr ? "نشط" : "Actif"}</Badge>
                    </div>
                    {school?.subscription_end_at && (
                      <p className="text-sm text-slate-500">
                        {isAr ? "حتى " : "Jusqu'au "}
                        {new Date(school.subscription_end_at).toLocaleDateString(isAr ? "ar-MA" : "fr-FR")}
                      </p>
                    )}
                    {planData && (
                      <ul className="text-xs text-slate-600 mt-3 space-y-1">
                        {(isAr ? planData.featuresAr : planData.featuresFr).map((f) => (
                          <li key={f}>✓ {f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {planPrice > 0 && (
                    <p className="text-3xl font-bold text-emerald-700">
                      {planPrice}
                      <span className="text-sm font-normal text-slate-500"> MAD/mois</span>
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline">{isAr ? "تغيير الخطة" : "Changer de plan"}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
