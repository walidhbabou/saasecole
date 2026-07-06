import { Badge } from "@/components/ui/badge";
import type { AttendanceStatus, FeeStatus, EnrollmentStatus } from "@/types";

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, { label: string; variant: "default" | "destructive" | "warning" | "secondary" }> = {
    present: { label: "Présent", variant: "default" },
    absent: { label: "Absent", variant: "destructive" },
    late: { label: "En retard", variant: "warning" },
    excused: { label: "Excusé", variant: "secondary" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function FeeBadge({ status }: { status: FeeStatus }) {
  const map: Record<FeeStatus, { label: string; variant: "default" | "destructive" | "warning" | "secondary" | "success" }> = {
    pending: { label: "En attente", variant: "secondary" },
    paid: { label: "Payé", variant: "success" },
    overdue: { label: "En retard", variant: "destructive" },
    cancelled: { label: "Annulé", variant: "warning" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant as "default"}>{label}</Badge>;
}

export function EnrollmentBadge({ status }: { status: EnrollmentStatus }) {
  const map: Record<EnrollmentStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    active: { label: "Actif", variant: "default" },
    transferred: { label: "Transféré", variant: "secondary" },
    withdrawn: { label: "Retiré", variant: "destructive" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
