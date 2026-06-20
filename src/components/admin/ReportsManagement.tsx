import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Check, X, Eye, Trash2, Clock } from 'lucide-react';
import type { Report } from '@/types/database';

export function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

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
    if (viewingReport?.id === id) setViewingReport(null);
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
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setViewingReport(r)} title="Ver detalhes"
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(r.id, 'resolved')} title="Marcar como resolvido"
                            className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition-colors">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => updateStatus(r.id, 'dismissed')} title="Descartar"
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
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

      {/* Report Detail Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setViewingReport(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-display text-lg text-foreground">DETALHES DO REPORTE</h3>
              </div>
              <button onClick={() => setViewingReport(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Conteúdo</p>
                <p className="text-sm text-foreground font-medium">{viewingReport.content_title}</p>
                <p className="text-xs text-muted-foreground">{viewingReport.content_type === 'movie' ? 'Filme' : 'Série'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Motivo</p>
                <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">{viewingReport.reason}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Detalhes</p>
                <p className="text-sm text-muted-foreground bg-secondary rounded-lg p-3">
                  {viewingReport.details || 'Nenhum detalhe adicional fornecido.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Data</p>
                  <p className="text-sm text-foreground">{new Date(viewingReport.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Status</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    viewingReport.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                    viewingReport.status === 'resolved' ? 'bg-green-500/10 text-green-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {viewingReport.status === 'pending' ? 'Pendente' : viewingReport.status === 'resolved' ? 'Resolvido' : 'Descartado'}
                  </span>
                </div>
              </div>
            </div>
            {viewingReport.status === 'pending' && (
              <div className="p-4 border-t border-border flex gap-3">
                <button onClick={() => updateStatus(viewingReport.id, 'dismissed')}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  Descartar
                </button>
                <button onClick={() => updateStatus(viewingReport.id, 'resolved')}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                  <Check className="h-4 w-4" /> Resolvido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
