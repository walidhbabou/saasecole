import { createAdminClient } from "@/lib/supabase/admin";

export type AuditEvent = {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  school_id?: string | null;
  actor_id?: string | null;
  actor_role?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAuditEvent(event: AuditEvent) {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      action: event.action,
      entity_type: event.entity_type,
      entity_id: event.entity_id ?? null,
      school_id: event.school_id ?? null,
      actor_id: event.actor_id ?? null,
      actor_role: event.actor_role ?? null,
      metadata: event.metadata ?? {},
    });
  } catch {
    // Audit logging must never break the primary operation.
  }
}