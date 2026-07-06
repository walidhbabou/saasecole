import { useLocale } from "next-intl";
import { GraduationCap } from "lucide-react";

export function LandingFooter() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <footer className="bg-slate-900 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold">{isAr ? "مدرستي" : "Madrasati"}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {isAr
                ? "منصة إدارة المدارس الرائدة في المغرب."
                : "La plateforme de gestion scolaire leader au Maroc."
              }
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-white text-sm font-semibold mb-4">{isAr ? "المنتج" : "Produit"}</p>
            <ul className="space-y-2">
              {(isAr
                ? ["المميزات", "الأسعار", "الأمان", "التحديثات"]
                : ["Fonctionnalités", "Tarifs", "Sécurité", "Mises à jour"]
              ).map((item) => (
                <li key={item}><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-white text-sm font-semibold mb-4">{isAr ? "الموارد" : "Ressources"}</p>
            <ul className="space-y-2">
              {(isAr
                ? ["التوثيق", "الدعم", "المدونة", "الحالة"]
                : ["Documentation", "Support", "Blog", "Statut"]
              ).map((item) => (
                <li key={item}><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-white text-sm font-semibold mb-4">{isAr ? "قانوني" : "Légal"}</p>
            <ul className="space-y-2">
              {(isAr
                ? ["شروط الاستخدام", "سياسة الخصوصية", "الكوكيز"]
                : ["CGU", "Politique de confidentialité", "Cookies"]
              ).map((item) => (
                <li key={item}><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © 2026 Madrasati. {isAr ? "جميع الحقوق محفوظة." : "Tous droits réservés."}
          </p>
          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <span>🇲🇦 Made in Morocco</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
