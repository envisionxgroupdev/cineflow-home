import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Check, X, Eye } from 'lucide-react';
import type { Report } from '@/types/database';

export function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    setReports((data || []) as Report[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: 'resolved' | 'dismissed') => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === 'resolved' ? 'Marcado como resolvido' : 'Descartado');
    load();
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const pendingCount = reports.filter(r => r.status === 'pending').length;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['pending', 'resolved', 'dismissed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}>
            {f === 'pending' ? `Pendentes (${pendingCount})` : f === 'resolved' ? 'Resolvidos' : f === 'dismissed' ? 'Descartados' : 'Todos'}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Conteúdo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Motivo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{r.content_title}</p>
                    <p className="text-xs text-muted-foreground">{r.content_type === 'movie' ? 'Filme' : 'Série'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">{r.reason}</span>
                    {r.details && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.details}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {new Date(r.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      r.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      r.status === 'resolved' ? 'bg-green-500/10 text-green-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {r.status === 'pending' ? 'Pendente' : r.status === 'resolved' ? 'Resolvido' : 'Descartado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'pending' && (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => updateStatus(r.id, 'resolved')} title="Marcar como resolvido"
                          className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition-colors">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => updateStatus(r.id, 'dismissed')} title="Descartar"
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum reporte {filter !== 'all' ? 'neste filtro' : 'ainda'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
