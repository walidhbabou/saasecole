"use client";
import { useState, useTransition } from "react";
import { Bell, XCircle, CalendarX, Banknote, UserPlus, Info, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchNotifications } from "@/lib/actions";
import type { NotifItem } from "@/lib/dal";

const ICON_MAP = {
  absence: CalendarX,
  fee: Banknote,
  enrollment: UserPlus,
  info: Info,
};

const COLOR_MAP = {
  absence: "text-red-600 bg-red-50",
  fee: "text-amber-600 bg-amber-50",
  enrollment: "text-emerald-600 bg-emerald-50",
  info: "text-blue-600 bg-blue-50",
};

function renderText(item: NotifItem, isAr: boolean): { title: string; sub: string } {
  switch (item.type) {
    case "absence":
      return {
        title: isAr ? `${item.count} غياب مسجل` : `${item.count} absence${item.count > 1 ? "s" : ""} enregistrée${item.count > 1 ? "s" : ""}`,
        sub: item.extra ? (isAr ? `بتاريخ ${item.extra}` : `Le ${item.extra}`) : (isAr ? "اليوم" : "Aujourd'hui"),
      };
    case "fee":
      return {
        title: isAr ? `${item.count} رسوم غير مدفوعة` : `${item.count} frais en souffrance`,
        sub: isAr ? "يتطلب متابعة" : "Nécessite un suivi",
      };
    case "enrollment":
      return {
        title: isAr ? `${item.count} تسجيل جديد` : `${item.count} nouvelle${item.count > 1 ? "s" : ""} inscription${item.count > 1 ? "s" : ""}`,
        sub: isAr ? "هذا الأسبوع" : "Cette semaine",
      };
    case "info":
      return {
        title: isAr ? `${item.count} مدرسة معطلة` : item.count > 0 ? `${item.count} école${item.count > 1 ? "s" : ""} suspendue${item.count > 1 ? "s" : ""}` : (isAr ? "لم يتم تسجيل الحضور اليوم" : "Appel non pris aujourd'hui"),
        sub: isAr ? "تتطلب مراجعة" : "À vérifier",
      };
  }
}

export function NotificationsPanel({ isAr }: { isAr: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && items === null) {
      startTransition(async () => {
        const data = await fetchNotifications();
        setItems(data);
      });
    }
  }

  const hasUnread = items === null || items.length > 0;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 text-slate-500 hover:text-slate-700"
        onClick={handleOpen}
      >
        <Bell className="h-4 w-4" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                {isAr ? "الإشعارات" : "Notifications"}
              </h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-72 overflow-y-auto">
              {isPending ? (
                <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{isAr ? "جاري التحميل..." : "Chargement..."}</span>
                </div>
              ) : !items || items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                  <Bell className="h-6 w-6 opacity-30" />
                  <p className="text-sm">{isAr ? "لا توجد إشعارات" : "Aucune notification"}</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {items.map(item => {
                    const Icon = ICON_MAP[item.type];
                    const colorClass = COLOR_MAP[item.type];
                    const { title, sub } = renderText(item, isAr);
                    return (
                      <li key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 leading-snug">{title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items && items.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-2.5">
                <button
                  onClick={() => { setItems([]); setOpen(false); }}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {isAr ? "تمييز الكل كمقروء" : "Tout marquer comme lu"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
