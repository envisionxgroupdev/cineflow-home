import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Send, ShieldCheck, User as UserIcon, Paperclip, X as XIcon, FileText, Image as ImageIcon, Download, MessageSquareQuote, Inbox, Search, MessageCircle, CheckCircle2, XCircle, Lock } from 'lucide-react';
import type { TicketMessage, Report } from '@/types/database';

interface Props {
  ticket: Report;
  asAdmin?: boolean;
  onSent?: () => void;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

// Use {nome} as a placeholder — substituído pelo nome do usuário ao inserir.
const CANNED_REPLIES: { label: string; text: string }[] = [
  {
    label: '👋 Saudação',
    text: 'Olá, {nome}! 👋 Aqui é a equipe PipocaMax. Como posso te ajudar hoje?',
  },
  {
    label: '🤝 Atendimento iniciado',
    text: 'Olá, {nome}! Tudo bem? Recebemos seu chamado e já estou analisando para te ajudar da melhor forma possível.',
  },
  {
    label: '🔎 Pedir mais detalhes',
    text: 'Olá, {nome}! Para conseguirmos te ajudar melhor, pode nos enviar mais alguns detalhes?\n\n• O que acontece exatamente?\n• Em qual filme/série/episódio ocorre?\n• Qual navegador e dispositivo você está usando?\n• Se possível, anexe um print da tela.',
  },
  {
    label: '🛠️ Em análise',
    text: 'Oi, {nome}! Seu chamado já foi encaminhado para nossa equipe técnica. Estamos verificando e voltamos a falar com você assim que tivermos novidades. Obrigado pela paciência! 🙏',
  },
  {
    label: '🔁 Tente novamente',
    text: 'Olá, {nome}! Pode tentar o seguinte enquanto investigamos:\n\n1. Atualizar a página (Ctrl+F5)\n2. Limpar o cache do navegador\n3. Testar em uma aba anônima\n4. Trocar de player na página do conteúdo\n\nMe conte se o problema continua, combinado?',
  },
  {
    label: '✅ Resolvido',
    text: 'Boa notícia, {nome}! ✅ O problema foi corrigido. Pode testar novamente e qualquer coisa é só nos avisar por aqui. Vou marcar este ticket como resolvido.',
  },
  {
    label: '🎬 Conteúdo adicionado',
    text: 'Oi, {nome}! 🎬 O conteúdo já foi adicionado ao catálogo. Basta atualizar a página ou pesquisar pelo título. Bom filme!',
  },
  {
    label: '⛔ Fora do escopo',
    text: 'Olá, {nome}! Obrigado pelo contato. Infelizmente esse pedido está fora do escopo do nosso suporte, então vamos encerrar este ticket — mas seguimos por aqui sempre que precisar.',
  },
  {
    label: '🙏 Encerramento',
    text: 'Obrigado por usar o PipocaMax, {nome}! 🍿 Qualquer outro problema é só abrir um novo chamado. Bom filme!',
  },
];

function AttachmentView({ path, name, type }: { path: string; name: string | null; type: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    supabase.storage.from('ticket-attachments').createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled && data?.signedUrl) setUrl(data.signedUrl);
    });
    return () => { cancelled = true; };
  }, [path]);

  const isImage = (type || '').startsWith('image/');
  if (!url) return <div className="mt-2 text-[11px] text-muted-foreground italic">Carregando anexo...</div>;

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block mt-2">
        <img src={url} alt={name || 'anexo'} className="max-h-48 rounded-lg border border-border object-cover" />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary border border-border text-xs text-foreground hover:bg-secondary/70"
    >
      <FileText className="h-3.5 w-3.5 text-primary" />
      <span className="truncate max-w-[180px]">{name || 'arquivo.pdf'}</span>
      <Download className="h-3 w-3 text-muted-foreground" />
    </a>
  );
}

export function TicketChat({ ticket, asAdmin = false, onSent }: Props) {
  const { user } = useAuth();
  const [currentTicket, setCurrentTicket] = useState<Report>(ticket);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [authorName, setAuthorName] = useState<string>('Usuário');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showCanned, setShowCanned] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setCurrentTicket(ticket); }, [ticket.id, ticket.status]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (error) toast.error(error.message);
    else setMessages((data || []) as TicketMessage[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!ticket.user_id) return;
    supabase.from('profiles').select('display_name,email').eq('id', ticket.user_id).maybeSingle()
      .then(({ data }) => {
        if (data) setAuthorName(data.display_name || data.email?.split('@')[0] || 'Usuário');
      });
  }, [ticket.user_id]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [ticket.id]);

  useEffect(() => {
    const patch = asAdmin ? { unread_for_admin: false } : { unread_for_user: false };
    supabase.from('reports').update(patch).eq('id', ticket.id).then(() => {});
    // eslint-disable-next-line
  }, [ticket.id, asAdmin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const ch = supabase
      .channel(`ticket-${ticket.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticket.id}` },
        (payload) => {
          setMessages(prev => prev.some(m => m.id === (payload.new as any).id) ? prev : [...prev, payload.new as TicketMessage]);
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports', filter: `id=eq.${ticket.id}` },
        (payload) => {
          setCurrentTicket(prev => ({ ...prev, ...(payload.new as Report) }));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [ticket.id]);

  // Derived status: Recebido | Em análise | Respondido | Resolvido | Recusado | Fechado
  const derivedStatus = (() => {
    const s = currentTicket.status;
    if (s === 'resolved') return { key: 'resolved', label: 'Resolvido', Icon: CheckCircle2, cls: 'bg-green-500/15 text-green-400 border-green-500/40' };
    if (s === 'dismissed') return { key: 'dismissed', label: 'Recusado', Icon: XCircle, cls: 'bg-destructive/15 text-destructive border-destructive/40' };
    if (s === 'closed') return { key: 'closed', label: 'Fechado', Icon: Lock, cls: 'bg-muted text-muted-foreground border-border' };
    const hasAdminReply = messages.some(m => m.is_admin);
    if (hasAdminReply) return { key: 'replied', label: 'Respondido', Icon: MessageCircle, cls: 'bg-primary/15 text-primary border-primary/40' };
    if (currentTicket.unread_for_admin === false) return { key: 'analyzing', label: 'Em análise', Icon: Search, cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40' };
    return { key: 'received', label: 'Recebido', Icon: Inbox, cls: 'bg-blue-500/15 text-blue-400 border-blue-500/40' };
  })();
  const StatusIcon = derivedStatus.Icon;

  const pickFile = (f: File | null) => {
    if (!f) { setPendingFile(null); return; }
    if (!ALLOWED_MIME.includes(f.type)) { toast.error('Tipo não permitido. Use imagem (JPG/PNG/WEBP/GIF) ou PDF.'); return; }
    if (f.size > MAX_FILE_BYTES) { toast.error('Arquivo muito grande (máx 10 MB).'); return; }
    setPendingFile(f);
  };

  const send = async () => {
    const text = body.trim();
    if (!user) return;
    if (!text && !pendingFile) return;
    if (text.length > 2000) { toast.error('Mensagem muito longa (máx 2000)'); return; }
    setSending(true);

    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    let attachmentType: string | null = null;
    let attachmentSize: number | null = null;

    if (pendingFile) {
      const ext = pendingFile.name.split('.').pop() || 'bin';
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${ticket.id}/${safe}`;
      const { error: upErr } = await supabase.storage
        .from('ticket-attachments')
        .upload(path, pendingFile, { contentType: pendingFile.type, upsert: false });
      if (upErr) {
        setSending(false);
        toast.error('Falha no upload: ' + upErr.message);
        return;
      }
      attachmentPath = path;
      attachmentName = pendingFile.name;
      attachmentType = pendingFile.type;
      attachmentSize = pendingFile.size;
    }

    const { error } = await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      is_admin: asAdmin,
      body: text || null,
      attachment_url: attachmentPath,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
      attachment_size: attachmentSize,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setBody('');
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onSent?.();
  };

  return (
    <div className="flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status do ticket</span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide transition-colors ${derivedStatus.cls}`}>
          <StatusIcon className="h-3 w-3" />
          {derivedStatus.label}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-secondary/30 rounded-lg border border-border">
        {/* Original ticket opening — shown like the first entry of the thread */}
        <article className="rounded-lg border border-border bg-card/60 overflow-hidden">
          <header className="flex items-center justify-between gap-2 px-3 py-2 bg-secondary/60 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full flex items-center justify-center bg-secondary text-muted-foreground border border-border shrink-0">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{authorName}</p>
                <p className="text-[10px] text-muted-foreground">Abertura do ticket</p>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {new Date(currentTicket.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </header>
          <div className="px-3 py-2.5 text-sm text-foreground space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="text-destructive font-semibold">{currentTicket.reason}</span>
              {' · '}{currentTicket.content_type === 'movie' ? 'Filme' : 'Série'}: <span className="text-foreground">{currentTicket.content_title}</span>
            </p>
            {currentTicket.details && (
              <p className="whitespace-pre-wrap break-words pt-1">{currentTicket.details}</p>
            )}
          </div>
        </article>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6 border border-dashed border-border rounded-lg">
            {asAdmin ? 'Nenhuma resposta ainda. Envie a primeira resposta abaixo.' : 'Aguardando resposta da equipe. Você será notificado quando houver novidades.'}
          </p>
        ) : (
          messages.map((m, idx) => {
            const mine = m.sender_id === user?.id;
            const senderLabel = m.is_admin
              ? 'Equipe PipocaMax'
              : (mine ? 'Você' : authorName);
            const headerCls = m.is_admin
              ? 'bg-primary/10 border-b border-primary/30'
              : 'bg-secondary/60 border-b border-border';
            const borderCls = m.is_admin ? 'border-primary/40' : 'border-border';

            return (
              <article key={m.id} className={`rounded-lg border ${borderCls} bg-card/60 overflow-hidden`}>
                <header className={`flex items-center justify-between gap-2 px-3 py-2 ${headerCls}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${m.is_admin ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-secondary text-muted-foreground border border-border'}`}>
                      {m.is_admin ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-semibold ${m.is_admin ? 'text-primary' : 'text-foreground'}`}>{senderLabel}</span>
                      {m.is_admin && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground uppercase">Staff</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">· Resposta #{idx + 1}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                    {new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </header>
                <div className="px-3 py-2.5 text-sm text-foreground">
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  {m.attachment_url && (
                    <AttachmentView path={m.attachment_url} name={m.attachment_name} type={m.attachment_type} />
                  )}
                </div>
              </article>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>


      {currentTicket.status !== 'closed' && currentTicket.status !== 'resolved' && currentTicket.status !== 'dismissed' ? (
        <div className="mt-3 space-y-2">
          {asAdmin && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowCanned(s => !s)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageSquareQuote className="h-3 w-3" />
                Respostas rápidas {showCanned ? '▲' : '▼'}
              </button>
              {showCanned && (
                <div className="flex flex-wrap gap-1.5">
                  {CANNED_REPLIES.map(r => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => {
                        const personalized = r.text.replace(/\{nome\}/g, authorName || 'tudo bem');
                        setBody(prev => (prev.trim() ? prev + '\n\n' + personalized : personalized));
                      }}
                      title={r.text.replace(/\{nome\}/g, authorName || '')}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {pendingFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-lg text-xs">
              {pendingFile.type.startsWith('image/')
                ? <ImageIcon className="h-3.5 w-3.5 text-primary" />
                : <FileText className="h-3.5 w-3.5 text-primary" />}
              <span className="flex-1 truncate text-foreground">{pendingFile.name}</span>
              <span className="text-muted-foreground">{(pendingFile.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => pickFile(null)} className="text-muted-foreground hover:text-destructive">
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => pickFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Anexar imagem ou PDF (até 10 MB)"
              className="self-end h-[42px] w-[42px] flex items-center justify-center rounded-lg bg-secondary border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={asAdmin ? 'Escreva uma resposta ao usuário...' : 'Escreva uma resposta...'}
              rows={2}
              maxLength={2000}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }}
              className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <button
              onClick={send}
              disabled={sending || (!body.trim() && !pendingFile)}
              className="self-end flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-center text-muted-foreground py-2 border border-dashed border-border rounded-lg">
          Este ticket foi fechado. Nenhuma nova mensagem pode ser enviada.
        </p>
      )}
    </div>
  );
}
