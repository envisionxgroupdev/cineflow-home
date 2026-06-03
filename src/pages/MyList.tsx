import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MovieCard } from '@/components/MovieCard';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/hooks/useAuth';
import { Bookmark, Loader2, LogIn, Trash2 } from 'lucide-react';

const MyList = () => {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, remove } = useWatchlist();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Minha Lista — PipocaMax</title>
        <meta name="description" content="Sua lista de filmes e séries para assistir depois." />
      </Helmet>
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary">
            <Bookmark className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Minha Lista</h1>
            <p className="text-sm text-muted-foreground">Conteúdos salvos para assistir depois</p>
          </div>
        </div>

        {authLoading || loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
        ) : !user ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-muted-foreground">Entre na sua conta para criar sua lista.</p>
            <Link to="/login" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold">
              <LogIn className="h-4 w-4" /> Entrar
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Bookmark className="h-12 w-12 text-muted-foreground/50 mx-auto" />
            <p className="text-muted-foreground">Sua lista está vazia.</p>
            <p className="text-xs text-muted-foreground/70">Abra um filme ou série e toque em <span className="text-foreground font-semibold">Listar</span>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {items.map(i => (
              <div key={i.id} className="relative group">
                <MovieCard
                  id={i.content_id}
                  title={i.title}
                  year={i.year ?? ''}
                  rating={Number(i.rating) || 0}
                  imageUrl={i.image_url ?? '/placeholder.svg'}
                  genre=""
                  type={i.content_type}
                />
                <button
                  onClick={() => remove(i.content_id, i.content_type)}
                  className="absolute top-1.5 left-1.5 z-10 p-1.5 bg-background/85 backdrop-blur-sm border border-border rounded-md text-muted-foreground hover:text-destructive hover:border-destructive transition-colors opacity-0 group-hover:opacity-100"
                  title="Remover da lista"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MyList;
