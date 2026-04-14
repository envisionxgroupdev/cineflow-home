import { Film } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteCodes } from "./SiteScripts";

export function Footer() {
  const codes = useSiteCodes();
  const footerHtml = codes.footer_scripts;

  return (
    <footer className="border-t border-border bg-cinema-deep py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-8">
          {footerHtml && (
            <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-3">
                <Film className="h-5 w-5 text-primary" />
                <span className="font-display text-xl tracking-wider text-foreground">
                  CINE<span className="text-gradient-cinema">FLOW</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Sua plataforma de filmes e séries online grátis em HD.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Navegação</h3>
              <div className="flex flex-col gap-2 text-sm">
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Início</Link>
                <Link to="/filmes" className="text-muted-foreground hover:text-primary transition-colors">Filmes</Link>
                <Link to="/series" className="text-muted-foreground hover:text-primary transition-colors">Séries</Link>
                <Link to="/sobre" className="text-muted-foreground hover:text-primary transition-colors">Sobre</Link>
              </div>
            </div>

            {/* Legal + Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Legal</h3>
              <div className="flex flex-col gap-2 text-sm">
                <Link to="/dmca" className="text-muted-foreground hover:text-primary transition-colors">DMCA</Link>
                <Link to="/termos" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</Link>
                <Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">Privacidade</Link>
                <a href="https://t.me/+ABLySKDmGy4zNDcx" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Telegram</a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-center text-sm text-muted-foreground">
              © 2026 Cineflow. Todos os direitos reservados.
            </p>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
