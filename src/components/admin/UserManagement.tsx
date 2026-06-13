import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, ShieldOff, Users, Pencil, Ban, History, Trash2, Search, AlertTriangle } from 'lucide-react';
import type { Profile, UserRole } from '@/types/database';
import { UserDetailModal } from './UserDetailModal';
import { logAdminAction, fetchAuditLog, type AuditLogEntry } from '@/lib/auditLog';
import { useAuth } from '@/hooks/useAuth';

type UserWithMeta = Profile & { roles: string[]; is_banned: boolean };

const ACTION_LABELS: Record<string, string> = {
  'user.update_name': 'Nome atualizado',
  'user.promote_admin': 'Promovido a admin',
  'user.demote_admin': 'Admin removido',
  'user.ban': 'Banido',
  'user.unban': 'Desbanido',
  'user.delete': 'Usuário deletado',
};

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<UserWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserWithMeta | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'banned'>('all');
  const [confirmDelete, setConfirmDelete] = useState<UserWithMeta | null>(null);
  const [confirmBan, setConfirmBan] = useState<UserWithMeta | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [banning, setBanning] = useState(false);

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
      toast.success('Usuário banido — perderá acesso imediatamente');
    }
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: confirmDelete.id },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || 'Falha ao excluir');
      }
      await logAdminAction('user.delete', { type: 'user', id: confirmDelete.id }, { email: confirmDelete.email });
      toast.success('Usuário excluído');
      setConfirmDelete(null);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir');
    } finally {
      setDeleting(false);
    }
  };

  const openAudit = async () => {
    setShowAudit(true);
    setLoadingAudit(true);
    const data = await fetchAuditLog(undefined, 100);
    setAudit(data);
    setLoadingAudit(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  const filtered = profiles.filter(p => {
    if (filter === 'admin' && !p.roles.includes('admin')) return false;
    if (filter === 'banned' && !p.is_banned) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (p.email || '').toLowerCase().includes(q) || (p.display_name || '').toLowerCase().includes(q);
  });

  const stats = {
    total: profiles.length,
    admins: profiles.filter(p => p.roles.includes('admin')).length,
    banned: profiles.filter(p => p.is_banned).length,
  };

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={stats.total} tone="default" />
        <StatCard label="Admins" value={stats.admins} tone="primary" />
        <StatCard label="Banidos" value={stats.banned} tone="destructive" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary border border-border rounded-lg p-0.5">
            {(['all', 'admin', 'banned'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'admin' ? 'Admins' : 'Banidos'}
              </button>
            ))}
          </div>
          <button onClick={openAudit}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-colors">
            <History className="h-3.5 w-3.5" /> Auditoria
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-secondary/30">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{filtered.length} usuário(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Usuário</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Cadastro</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isAdmin = p.roles.includes('admin');
                const isBanned = p.is_banned;
                const isSelf = currentUser?.id === p.id;
                return (
                  <tr key={p.id}
                    onClick={() => setSelected(p)}
                    className={`border-b border-border/40 hover:bg-secondary/40 transition-colors cursor-pointer ${isBanned ? 'opacity-70' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          isAdmin ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'
                        }`}>
                          {(p.display_name || p.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                            {p.display_name || 'Sem nome'}
                            {isSelf && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">VOCÊ</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isAdmin ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted text-muted-foreground'}`}>
                          {isAdmin ? 'Admin' : 'Usuário'}
                        </span>
                        {isBanned && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">
                            Banido
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 justify-end flex-wrap">
                        <IconBtn title="Detalhes" onClick={() => setSelected(p)} icon={Pencil} />
                        <IconBtn
                          title={isAdmin ? 'Remover admin' : 'Promover a admin'}
                          onClick={() => quickToggleAdmin(p)}
                          icon={isAdmin ? ShieldOff : Shield}
                          tone={isAdmin ? 'destructive' : 'primary'}
                          disabled={isSelf}
                        />
                        <IconBtn
                          title={isBanned ? 'Desbanir' : 'Banir'}
                          onClick={() => quickToggleBan(p)}
                          icon={Ban}
                          tone={isBanned ? 'primary' : 'destructive'}
                          disabled={isSelf}
                        />
                        <IconBtn
                          title="Excluir usuário"
                          onClick={() => setConfirmDelete(p)}
                          icon={Trash2}
                          tone="destructive"
                          disabled={isSelf}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <UserDetailModal user={selected} onClose={() => setSelected(null)} onChanged={load} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="bg-card border border-destructive/40 rounded-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 border border-destructive/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground leading-tight">Excluir usuário?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta ação é permanente. <span className="text-foreground font-medium">{confirmDelete.email}</span> será removido junto com seus dados.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
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

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'default' | 'primary' | 'destructive' }) {
  const tones = {
    default: 'border-border bg-card',
    primary: 'border-primary/30 bg-primary/5',
    destructive: 'border-destructive/30 bg-destructive/5',
  } as const;
  const text = {
    default: 'text-foreground',
    primary: 'text-primary',
    destructive: 'text-destructive',
  } as const;
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
      <p className={`text-2xl font-display leading-tight mt-1 ${text[tone]}`}>{value.toLocaleString('pt-BR')}</p>
    </div>
  );
}

function IconBtn({ icon: Icon, title, onClick, tone = 'default', disabled }: {
  icon: any; title: string; onClick: () => void;
  tone?: 'default' | 'primary' | 'destructive'; disabled?: boolean;
}) {
  const tones = {
    default: 'border-border text-muted-foreground hover:text-foreground hover:border-border/80',
    primary: 'border-primary/40 text-primary hover:bg-primary/10',
    destructive: 'border-destructive/40 text-destructive hover:bg-destructive/10',
  };
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-md border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${tones[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
