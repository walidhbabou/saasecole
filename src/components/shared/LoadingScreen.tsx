import { Loader2 } from "lucide-react";

export function LoadingScreen({ label = "Chargement en cours" }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_42%),linear-gradient(135deg,rgba(241,245,249,0.96),rgba(255,255,255,0.98))]" />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Veuillez patienter</p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">{label}</h1>
          </div>
        </div>
      </div>
    </div>
  );
}