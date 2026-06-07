import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, ShieldOff, Users, Pencil, Ban, History } from 'lucide-react';
import type { Profile, UserRole } from '@/types/database';
import { UserDetailModal } from './UserDetailModal';
import { logAdminAction, fetchAuditLog, type AuditLogEntry } from '@/lib/auditLog';

type UserWithMeta = Profile & { roles: string[]; is_banned: boolean };

const ACTION_LABELS: Record<string, string> = {
  'user.update_name': 'Nome atualizado',
  'user.promote_admin': 'Promovido a admin',
  'user.demote_admin': 'Admin removido',
  'user.ban': 'Banido',
  'user.unban': 'Desbanido',
};

export function UserManagement() {
  const [profiles, setProfiles] = useState<UserWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserWithMeta | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [pRes, rRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
    ]);
    const profs = (pRes.data || []) as Profile[];
    const roles = (rRes.data || []) as UserRole[];
    setProfiles(profs.map(p => ({
      ...p,
      roles: roles.filter(r => r.user_id === p.id).map(r => r.role),
      is_banned: roles.some(r => r.user_id === p.id && r.role === 'banned' as any),
    })));
    setLoading(false);
  };

  const quickToggleAdmin = async (u: UserWithMeta) => {
    const wasAdmin = u.roles.includes('admin');
    if (wasAdmin) {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', u.id).eq('role', 'admin');
      if (error) { toast.error(error.message); return; }
      await logAdminAction('user.demote_admin', { type: 'user', id: u.id });
      toast.success('Admin removido');
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: u.id, role: 'admin' });
      if (error) { toast.error(error.message); return; }
      await logAdminAction('user.promote_admin', { type: 'user', id: u.id });
      toast.success('Admin adicionado');
    }
    load();
  };

  const quickToggleBan = async (u: UserWithMeta) => {
    if (u.is_banned) {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', u.id).eq('role', 'banned');
      if (error) { toast.error(error.message); return; }
      await logAdminAction('user.unban', { type: 'user', id: u.id });
      toast.success('Usuário desbanido');
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: u.id, role: 'banned' as any });
      if (error) { toast.error(error.message); return; }
      await logAdminAction('user.ban', { type: 'user', id: u.id });
      toast.success('Usuário banido');
    }
    load();
  };

  const openAudit = async () => {
    setShowAudit(true);
    setLoadingAudit(true);
    const data = await fetchAuditLog(undefined, 100);
    setAudit(data);
    setLoadingAudit(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button onClick={openAudit}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-colors">
          <History className="h-3.5 w-3.5" /> Auditoria global
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Usuários ({profiles.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Usuário</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Cadastro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Papel</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const isAdmin = p.roles.includes('admin');
                const isBanned = p.is_banned;
                return (
                  <tr key={p.id}
                    onClick={() => setSelected(p)}
                    className={`border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer ${isBanned ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          {(p.display_name || p.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.display_name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded w-fit ${isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {isAdmin ? 'Admin' : 'Usuário'}
                        </span>
                        {isBanned && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded w-fit bg-destructive/10 text-destructive">
                            Banido
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 justify-end flex-wrap">
                        <button onClick={() => setSelected(p)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-colors">
                          <Pencil className="h-3.5 w-3.5" /> Detalhes
                        </button>
                        <button onClick={() => quickToggleAdmin(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                            isAdmin
                              ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
                              : 'border-primary/40 text-primary hover:bg-primary/10'
                          }`}>
                          {isAdmin ? <><ShieldOff className="h-3.5 w-3.5" /> Remover admin</> : <><Shield className="h-3.5 w-3.5" /> Promover</>}
                        </button>
                        <button onClick={() => quickToggleBan(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                            isBanned
                              ? 'border-primary/40 text-primary hover:bg-primary/10'
                              : 'border-destructive/40 text-destructive hover:bg-destructive/10'
                          }`}>
                          <Ban className="h-3.5 w-3.5" /> {isBanned ? 'Desbanir' : 'Banir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <UserDetailModal user={selected} onClose={() => setSelected(null)} onChanged={load} />
      )}

      {showAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowAudit(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h3 className="font-display text-lg text-foreground">AUDITORIA</h3>
              </div>
              <button onClick={() => setShowAudit(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="overflow-y-auto p-4">
              {loadingAudit ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
              ) : audit.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma ação registrada.</p>
              ) : (
                <ul className="divide-y divide-border/60 border border-border rounded-lg">
                  {audit.map(e => {
                    const target = profiles.find(p => p.id === e.target_id);
                    return (
                      <li key={e.id} className="px-3 py-2 text-xs flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{ACTION_LABELS[e.action] || e.action}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            alvo: {target?.email || target?.display_name || e.target_id} · por {e.actor_email || 'sistema'}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">{new Date(e.created_at).toLocaleString('pt-BR')}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
