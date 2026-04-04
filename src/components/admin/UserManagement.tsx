import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, ShieldOff, Users, Pencil, Ban, X, Check } from 'lucide-react';
import type { Profile, UserRole } from '@/types/database';

type UserWithMeta = Profile & { roles: string[]; is_banned: boolean };

export function UserManagement() {
  const [profiles, setProfiles] = useState<UserWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserWithMeta | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'ban' | 'unban' | 'delete' } | null>(null);

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

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (isCurrentlyAdmin) {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
      if (error) { toast.error(error.message); return; }
      toast.success('Admin removido');
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
      if (error) { toast.error(error.message); return; }
      toast.success('Admin adicionado');
    }
    load();
  };

  const toggleBan = async (userId: string, isBanned: boolean) => {
    if (isBanned) {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'banned');
      if (error) { toast.error(error.message); return; }
      toast.success('Usuário desbanido');
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'banned' as any });
      if (error) { toast.error(error.message); return; }
      toast.success('Usuário banido');
    }
    setConfirmAction(null);
    load();
  };

  const saveDisplayName = async () => {
    if (!editingUser) return;
    const { error } = await supabase.from('profiles').update({ display_name: editName }).eq('id', editingUser.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Nome atualizado');
    setEditingUser(null);
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div>
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
                  <tr key={p.id} className={`border-b border-border/50 hover:bg-secondary/50 transition-colors ${isBanned ? 'opacity-60' : ''}`}>
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
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => { setEditingUser(p); setEditName(p.display_name || ''); }}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Editar nome">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => toggleAdmin(p.id, isAdmin)}
                          className={`p-1.5 rounded transition-colors ${isAdmin ? 'text-destructive hover:bg-destructive/10' : 'text-primary hover:bg-primary/10'}`}
                          title={isAdmin ? 'Remover admin' : 'Tornar admin'}>
                          {isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setConfirmAction({ userId: p.id, action: isBanned ? 'unban' : 'ban' })}
                          className={`p-1.5 rounded transition-colors ${isBanned ? 'text-primary hover:bg-primary/10' : 'text-destructive hover:bg-destructive/10'}`}
                          title={isBanned ? 'Desbanir' : 'Banir'}>
                          <Ban className="h-4 w-4" />
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

      {/* Edit Name Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-display text-lg text-foreground">EDITAR USUÁRIO</h3>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm text-foreground">{editingUser.email}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Nome de exibição</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Nome..." />
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-3">
              <button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
              <button onClick={saveDisplayName}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Check className="h-4 w-4" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Ban/Unban Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <Ban className={`h-12 w-12 mx-auto mb-4 ${confirmAction.action === 'ban' ? 'text-destructive' : 'text-primary'}`} />
              <h3 className="font-display text-lg text-foreground mb-2">
                {confirmAction.action === 'ban' ? 'BANIR USUÁRIO?' : 'DESBANIR USUÁRIO?'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {confirmAction.action === 'ban'
                  ? 'O usuário não poderá mais acessar a plataforma.'
                  : 'O usuário terá acesso restaurado à plataforma.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmAction(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button onClick={() => {
                    const user = profiles.find(p => p.id === confirmAction.userId);
                    if (user) toggleBan(user.id, confirmAction.action === 'unban');
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    confirmAction.action === 'ban'
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}>
                  {confirmAction.action === 'ban' ? 'Banir' : 'Desbanir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
