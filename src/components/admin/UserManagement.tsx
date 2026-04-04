import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, ShieldOff, Users } from 'lucide-react';
import type { Profile, UserRole } from '@/types/database';

export function UserManagement() {
  const [profiles, setProfiles] = useState<(Profile & { roles: string[] })[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
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
              return (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{p.display_name || p.email || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {isAdmin ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleAdmin(p.id, isAdmin)}
                      className={`p-1.5 rounded transition-colors ${isAdmin ? 'text-destructive hover:bg-destructive/10' : 'text-primary hover:bg-primary/10'}`}
                      title={isAdmin ? 'Remover admin' : 'Tornar admin'}>
                      {isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
