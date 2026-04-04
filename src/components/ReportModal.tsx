import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportModalProps {
  contentId: string;
  contentType: 'movie' | 'series';
  contentTitle: string;
  open: boolean;
  onClose: () => void;
}

const reasons = [
  'Player não funciona',
  'Vídeo sem áudio',
  'Áudio errado / sem dublagem',
  'Qualidade ruim',
  'Link quebrado',
  'Conteúdo errado',
  'Outro',
];

export function ReportModal({ contentId, contentType, contentTitle, open, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!reason) { toast.error('Selecione um motivo'); return; }
    setSending(true);
    const { error } = await supabase.from('reports').insert({
      content_id: contentId,
      content_type: contentType,
      content_title: contentTitle,
      reason,
      details: details || null,
      status: 'pending',
    });
    if (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } else {
      toast.success('Reporte enviado! Obrigado.');
      setReason('');
      setDetails('');
      onClose();
    }
    setSending(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-display text-lg text-foreground">REPORTAR PROBLEMA</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Reportando: <span className="text-foreground font-medium">{contentTitle}</span>
          </p>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Motivo</label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    reason === r ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Detalhes (opcional)</label>
            <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3}
              placeholder="Descreva o problema..."
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button onClick={handleSend} disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-destructive/90 disabled:opacity-50 transition-colors">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar Reporte'}
          </button>
        </div>
      </div>
    </div>
  );
}
