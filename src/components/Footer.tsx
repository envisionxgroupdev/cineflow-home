import { Home, Clapperboard, Tv, Star, Info, FileText, Shield, Lock, Send, Globe, ExternalLink, Mail, ShieldAlert } from "lucide-react";
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
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/40 to-transparent p-5 md:p-6">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_60%)]" />
            <div className="relative flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1.5">Aviso Legal</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este site <span className="text-foreground font-medium">não hospeda</span> e <span className="text-foreground font-medium">não armazena</span> nenhum arquivo em seus servidores.
                  Indexamos apenas mídia hospedada em serviços de terceiros.
                </p>
              </div>
            </div>
          </div>

          {/* Brand + Bottom */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/favicon.png" alt="PipocaMax" width={24} height={24} className="h-6 w-6 object-contain" loading="lazy" />
              <span className="font-display text-xl tracking-wider text-foreground">
                PIPOCA<span className="text-gradient-cinema">MAX</span>
              </span>
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
