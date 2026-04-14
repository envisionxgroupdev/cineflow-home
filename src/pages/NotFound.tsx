import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Film } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Helmet>
        <title>Página Não Encontrada — Cineflow</title>
        <meta name="description" content="A página que você procura não foi encontrada. Volte para a página inicial do Cineflow." />
      </Helmet>
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-display font-bold text-foreground">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Página não encontrada</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors">
            <Film className="h-4 w-4" /> Voltar ao Início
          </Link>
          <Link to="/filmes" className="text-primary hover:underline px-6 py-3 text-sm font-medium">
            Ver Filmes
          </Link>
          <Link to="/series" className="text-primary hover:underline px-6 py-3 text-sm font-medium">
            Ver Séries
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
