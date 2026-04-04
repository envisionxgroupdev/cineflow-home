import { Film } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-cinema-deep py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <span className="font-display text-xl tracking-wider text-foreground">
              CINE<span className="text-gradient-cinema">FLOW</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Cineflow. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
