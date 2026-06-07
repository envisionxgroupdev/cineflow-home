import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Shield, Ban, Check, Loader2, History, Mail, Calendar, UserCircle2, Save } from 'lucide-react';
import type { Profile } from '@/types/database';
import { logAdminAction, fetchAuditLog, type AuditLogEntry } from '@/lib/auditLog';

interface Props {
  user: Profile & { roles: string[]; is_banned: boolean };
  onClose: () => void;
  onChanged: () => void;
}

const ACTION_LABELS: Record<string, { label: string; tone: string }> = {
  'user.update_name': { label: 'Nome atualizado', tone: 'text-foreground' },
  'user.promote_admin': { label: 'Promovido a admin', tone: 'text-primary' },
  'user.demote_admin': { label: 'Admin removido', tone: 'text-muted-foreground' },
  'user.ban': { label: 'Usuário banido', tone: 'text-destructive' },
  'user.unban': { label: 'Usuário desbanido', tone: 'text-primary' },
  'user.delete': { label: 'Usuário deletado', tone: 'text-destructive' },
};

export function UserDetailModal({ user, onClose, onChanged }: Props) {
  const [name, setName] = useState(user.display_name || '');
  const [isAdmin, setIsAdmin] = useState(user.roles.includes('admin'));
  const [isBanned, setIsBanned] = useState(user.is_banned);
  const [saving, setSaving] = useState(false);
  const [log, setLog] = useState<AuditLogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(true);

  useEffect(() => {
    fetchAuditLog(user.id).then(l => { setLog(l); setLoadingLog(false); });
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Name
      if (name !== (user.display_name || '')) {
        const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', user.id);
        if (error) throw error;
        await logAdminAction('user.update_name', { type: 'user', id: user.id }, { from: user.display_name, to: name });
      }
      // Admin role
      const wasAdmin = user.roles.includes('admin');
      if (isAdmin && !wasAdmin) {
        const { error } = await supabase.from('user_roles').insert({ user_id: user.id, role: 'admin' });
        if (error) throw error;
        await logAdminAction('user.promote_admin', { type: 'user', id: user.id });
      } else if (!isAdmin && wasAdmin) {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', user.id).eq('role', 'admin');
        if (error) throw error;
        await logAdminAction('user.demote_admin', { type: 'user', id: user.id });
      }
      // Ban
      if (isBanned && !user.is_banned) {
        const { error } = await supabase.from('user_roles').insert({ user_id: user.id, role: 'banned' as any });
        if (error) throw error;
        await logAdminAction('user.ban', { type: 'user', id: user.id });
      } else if (!isBanned && user.is_banned) {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', user.id).eq('role', 'banned');
        if (error) throw error;
        await logAdminAction('user.unban', { type: 'user', id: user.id });
      }
      toast.success('Alterações salvas');
      onChanged();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    name !== (user.display_name || '') ||
    isAdmin !== user.roles.includes('admin') ||
    isBanned !== user.is_banned;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
              {(user.display_name || user.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-display text-lg text-foreground leading-tight">DETALHES DO USUÁRIO</h3>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-6">
          {/* Info */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={Mail} label="Email" value={user.email || '—'} />
            <InfoRow icon={Calendar} label="Cadastro" value={new Date(user.created_at).toLocaleString('pt-BR')} />
            <InfoRow icon={UserCircle2} label="ID" value={user.id} mono />
          </section>

          {/* Edit name */}
          <section>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Nome de exibição</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome..."
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </section>

          {/* Roles */}
          <section>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Permissões</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <RoleToggle
                active={isAdmin}
                onToggle={() => setIsAdmin(v => !v)}
                icon={Shield}
                title="Administrador"
                description="Acesso total ao painel"
                activeTone="primary"
              />
              <RoleToggle
                active={isBanned}
                onToggle={() => setIsBanned(v => !v)}
                icon={Ban}
                title="Banido"
                description="Bloqueia login e acesso"
                activeTone="destructive"
              />
            </div>
          </section>

          {/* Audit log */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <History className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Histórico de auditoria</h4>
            </div>
            {loadingLog ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>
            ) : log.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">Nenhuma ação registrada ainda.</p>
            ) : (
              <ul className="border border-border rounded-lg divide-y divide-border/60 max-h-56 overflow-y-auto">
                {log.map(entry => {
                  const meta = ACTION_LABELS[entry.action] || { label: entry.action, tone: 'text-foreground' };
                  return (
                    <li key={entry.id} className="px-3 py-2 text-xs flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`font-medium ${meta.tone}`}>{meta.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          por {entry.actor_email || 'sistema'}
                          {entry.details && Object.keys(entry.details).length > 0
                            ? ` — ${JSON.stringify(entry.details)}`
                            : ''}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(entry.created_at).toLocaleString('pt-BR')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="p-4 border-t border-border flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            Fechar
          </button>
          <button onClick={handleSave} disabled={!hasChanges || saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-secondary/40 border border-border/60 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className={`text-xs text-foreground break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function RoleToggle({
  active, onToggle, icon: Icon, title, description, activeTone,
}: {
  active: boolean; onToggle: () => void; icon: any; title: string; description: string;
  activeTone: 'primary' | 'destructive';
}) {
  const activeClasses = activeTone === 'primary'
    ? 'border-primary/50 bg-primary/10 text-primary'
    : 'border-destructive/50 bg-destructive/10 text-destructive';
  return (
    <button type="button" onClick={onToggle}
      className={`text-left p-3 rounded-lg border transition-colors ${active ? activeClasses : 'border-border bg-secondary/40 text-muted-foreground hover:border-border/80'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <span className={`h-5 w-9 rounded-full flex items-center transition-colors ${active ? (activeTone === 'primary' ? 'bg-primary' : 'bg-destructive') : 'bg-muted'}`}>
          <span className={`h-4 w-4 rounded-full bg-background transition-transform ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </span>
      </div>
      <p className="text-[11px] mt-1 opacity-80">{description}</p>
      {active && <p className="text-[10px] mt-1 font-bold uppercase tracking-wider">{activeTone === 'destructive' ? 'Ativo · Conta bloqueada' : 'Ativo'}</p>}
    </button>
  );
}
