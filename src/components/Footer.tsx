import { Home, Clapperboard, Tv, Star, Info, FileText, Shield, Lock, Send, Globe, ExternalLink, Mail, ShieldAlert, Sparkles, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteCodes } from "./SiteScripts";

export function Footer() {
  const codes = useSiteCodes();
  const footerHtml = codes.footer_scripts;

  return (
    <footer className="border-t border-border bg-cinema-deep py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-10">
          {footerHtml && (
            <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Navegação */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Navegação
              </h3>
              <div className="flex flex-col gap-2.5 text-sm">
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Home className="h-3.5 w-3.5" /> Início
                </Link>
                <Link to="/#lancamentos" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Star className="h-3.5 w-3.5" /> Lançamentos
                </Link>
                <Link to="/filmes" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Clapperboard className="h-3.5 w-3.5" /> Filmes
                </Link>
                <Link to="/series" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Tv className="h-3.5 w-3.5" /> Séries
                </Link>
                <Link to="/animes" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> Animes
                </Link>
                <Link to="/canais" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5" /> Canais de TV
                </Link>
                <Link to="/contato" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> Contato
                </Link>
                <Link to="/sobre" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" /> Sobre
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Legal
              </h3>
              <div className="flex flex-col gap-2.5 text-sm">
                <Link to="/dmca" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> DMCA
                </Link>
                <Link to="/termos" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> Termos de Uso
                </Link>
                <Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" /> Privacidade
                </Link>
              </div>
            </div>

            {/* Redes Sociais */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Redes Sociais
              </h3>
              <div className="flex flex-col gap-2.5 text-sm">
                <a href="https://t.me/+ABLySKDmGy4zNDcx" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#0088cc] transition-colors flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </a>
              </div>
            </div>

            {/* Parceiros */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-primary" />
                Parceiros
              </h3>
              <div className="flex flex-col gap-2.5 text-sm">
                <p className="text-muted-foreground/60 text-xs italic">Em breve...</p>
              </div>
            </div>
          </div>

          {/* Legal disclaimer */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background/80 to-background p-6 md:p-8 shadow-[0_0_60px_-15px_hsl(var(--primary)/0.35)]">
            {/* Decorative gradients */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_0%_0%,hsl(var(--primary)/0.18),transparent_55%)]" />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_100%_100%,hsl(var(--primary)/0.12),transparent_55%)]" />
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            {/* Corner glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-start gap-5">
              <div className="shrink-0 relative">
                <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full" />
                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 text-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <ShieldAlert className="h-7 w-7" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Aviso Legal
                  </span>
                </div>
                <h4 className="font-display text-lg md:text-xl text-foreground mb-2 leading-tight">
                  Plataforma 100% dentro da lei
                </h4>
                <p className="text-sm md:text-[15px] text-muted-foreground leading-relaxed">
                  Este site <span className="text-foreground font-semibold">não hospeda</span>, <span className="text-foreground font-semibold">não armazena</span> e <span className="text-foreground font-semibold">não distribui</span> nenhum arquivo em seus servidores. Atuamos exclusivamente como um indexador automático, organizando mídia hospedada em <span className="text-foreground font-semibold">serviços de terceiros</span> disponíveis publicamente na web.
                </p>
              </div>
            </div>
          </div>

          {/* Brand + Bottom */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/logo-pipocamax.png" alt="PipocaMax" width={28} height={28} className="h-7 w-7 object-contain drop-shadow-[0_0_10px_hsl(var(--primary)/0.45)] group-hover:scale-110 transition-transform" loading="lazy" />
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl font-bold tracking-[0.18em] text-foreground">
                  PIPOCA<span className="text-gradient-cinema">MAX</span>
                </span>
                <span className="text-[8px] font-semibold tracking-[0.3em] uppercase text-muted-foreground/70 mt-1">
                  Sua sessão favorita
                </span>
              </div>
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              © 2026 PipocaMax. Todos os direitos reservados.
            </p>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
