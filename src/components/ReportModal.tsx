import { useRef, useState, useCallback } from 'react';
import { X, AlertTriangle, Loader2, LogIn, Paperclip, FileText, Image as ImageIcon, X as XIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { checkCooldown, markSubmitted } from '@/lib/antiSpam';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

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
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    if (!f) { setFile(null); return; }
    if (!ALLOWED_MIME.includes(f.type)) { toast.error('Tipo não permitido. Use imagem ou PDF.'); return; }
    if (f.size > MAX_FILE_BYTES) { toast.error('Arquivo muito grande (máx 10 MB).'); return; }
    setFile(f);
  };

  const handleSend = useCallback(async () => {
    if (!user) return;
    if (!reason) { toast.error('Selecione um motivo'); return; }
    const guard = checkCooldown('report', 30_000);
    if (!guard.ok) { toast.error(guard.reason); return; }

    setSending(true);
    const { data: ticket, error } = await supabase.from('reports').insert({
      user_id: user.id,
      content_id: contentId,
      content_type: contentType,
      content_title: contentTitle,
      reason,
      details: details || null,
      status: 'open',
      reporter_email: user.email ?? null,
    }).select('id').single();

    if (error || !ticket) {
      setSending(false);
      toast.error('Erro ao enviar: ' + (error?.message ?? 'desconhecido'));
      return;
    }

    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    let attachmentType: string | null = null;
    let attachmentSize: number | null = null;

    if (file) {
      const ext = file.name.split('.').pop() || 'bin';
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${ticket.id}/${safe}`;
      const { error: upErr } = await supabase.storage
        .from('ticket-attachments')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (!upErr) {
        attachmentPath = path;
        attachmentName = file.name;
        attachmentType = file.type;
        attachmentSize = file.size;
      } else {
        toast.error('Anexo não enviado: ' + upErr.message);
      }
    }

    const body = details?.trim()
      ? `Motivo: ${reason}\n\n${details.trim()}`
      : `Motivo: ${reason}`;
    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      is_admin: false,
      body,
      attachment_url: attachmentPath,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
      attachment_size: attachmentSize,
    });

    markSubmitted('report');
    toast.success('Ticket aberto! Acompanhe pelo seu perfil.');
    setReason('');
    setDetails('');
    setFile(null);
    setSending(false);
    onClose();
  }, [reason, details, user, contentId, contentType, contentTitle, file, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-display text-lg text-foreground">ABRIR TICKET</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {!user ? (
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-foreground font-medium mb-1">Faça login para reportar</p>
              <p className="text-xs text-muted-foreground">
                Você precisa de uma conta para abrir um ticket e acompanhar a resposta da equipe.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
              <Link
                to="/login"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <LogIn className="h-4 w-4" /> Entrar
              </Link>
            </div>
          </div>
        ) : (
          <>
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
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Descreva o problema</label>
                <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3}
                  maxLength={1000}
                  placeholder="Conte mais detalhes para a equipe..."
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Anexo (opcional)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={e => pickFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-lg text-xs">
                    {file.type.startsWith('image/')
                      ? <ImageIcon className="h-3.5 w-3.5 text-primary" />
                      : <FileText className="h-3.5 w-3.5 text-primary" />}
                    <span className="flex-1 truncate text-foreground">{file.name}</span>
                    <span className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => pickFile(null)} type="button" className="text-muted-foreground hover:text-destructive">
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-secondary border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Anexar imagem ou PDF (até 10 MB)
                  </button>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground">
                Você poderá acompanhar e responder este ticket pelo seu perfil.
              </p>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
              <button onClick={handleSend} disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-destructive/90 disabled:opacity-50 transition-colors">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Abrir ticket'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
