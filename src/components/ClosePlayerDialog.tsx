import { AlertTriangle, X, Play } from 'lucide-react';
import { useEffect } from 'react';

interface ClosePlayerDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function ClosePlayerDialog({
  open,
  onCancel,
  onConfirm,
  title = 'Fechar o player?',
  description = 'Você vai perder o progresso atual e o player será encerrado. Tem certeza que deseja sair?',
}: ClosePlayerDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-player-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/80 shadow-2xl shadow-primary/10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      >
        {/* Glow header */}
        <div className="relative h-24 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.4),transparent_60%)]" />
          <div className="relative h-14 w-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/30">
            <AlertTriangle className="h-7 w-7 text-primary" />
          </div>
          <button
            onClick={onCancel}
            aria-label="Cancelar"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/60 hover:bg-background/90 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pt-5 pb-6 text-center">
          <h2 id="close-player-title" className="font-display text-xl text-foreground mb-2">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {description}
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <button
              onClick={onConfirm}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border border-border/60 bg-secondary/60 text-foreground hover:bg-secondary transition-all"
            >
              <X className="h-4 w-4" /> Sim, fechar
            </button>
            <button
              onClick={onCancel}
              autoFocus
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:brightness-110 transition-all"
            >
              <Play className="h-4 w-4 fill-current" /> Continuar assistindo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
