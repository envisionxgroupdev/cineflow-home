import { Film } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-cinema-deep py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-8">
          {/* Top */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              <span className="font-display text-xl tracking-wider text-foreground">
                CINE<span className="text-gradient-cinema">FLOW</span>
              </span>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link to="/sobre" className="text-muted-foreground hover:text-primary transition-colors">Sobre</Link>
              <Link to="/dmca" className="text-muted-foreground hover:text-primary transition-colors">DMCA</Link>
              <Link to="/termos" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</Link>
              <Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">Privacidade</Link>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Sitemap</a>
            </div>
          </div>
          {/* Bottom */}
          <p className="text-center text-sm text-muted-foreground">
            © 2026 Cineflow. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
