import { supabase } from '@/integrations/supabase/client';

export type AuditAction =
  | 'user.update_name'
  | 'user.promote_admin'
  | 'user.demote_admin'
  | 'user.ban'
  | 'user.unban'
  | 'user.delete';

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

export async function logAdminAction(
  action: AuditAction,
  target: { type: string; id: string },
  details?: Record<string, any>,
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('admin_audit_log' as any).insert({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action,
      target_type: target.type,
      target_id: target.id,
      details: details ?? null,
    } as any);
  } catch (e) {
    console.warn('[auditLog] failed:', e);
  }
}

export async function fetchAuditLog(targetId?: string, limit = 50): Promise<AuditLogEntry[]> {
  let q = supabase.from('admin_audit_log' as any).select('*').order('created_at', { ascending: false }).limit(limit);
  if (targetId) q = q.eq('target_id', targetId);
  const { data, error } = await q;
  if (error) {
    console.warn('[auditLog] fetch error:', error.message);
    return [];
  }
  return (data || []) as unknown as AuditLogEntry[];
}
