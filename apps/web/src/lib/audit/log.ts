import type { Json } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

type AuditLogInput = {
  storeId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Json;
};

export async function writeAuditLog(input: AuditLogInput) {
  const supabase = await createClient();
  const { error } = await supabase.from('audit_logs').insert({
    store_id: input.storeId,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error('No fue posible registrar auditoría.');
  }
}
