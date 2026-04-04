import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { TmdbSearchModal } from "@/components/TmdbSearchModal";
import { Film, Tv, Plus, Search, Trash2, ArrowLeft, LogOut, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Movie, Series } from "@/types/database";

type Tab = "movies" | "series";

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("movies");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [tmdbOpen, setTmdbOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoadingData(true);
    const [moviesRes, seriesRes] = await Promise.all([
      supabase.from('movies').select('*').order('created_at', { ascending: false }),
      supabase.from('series').select('*').order('created_at', { ascending: false }),
    ]);
    if (moviesRes.data) setMovies(moviesRes.data as Movie[]);
    if (seriesRes.data) setSeries(seriesRes.data as Series[]);
    setLoadingData(false);
  };

  const handleDelete = async (id: string) => {
    const table = activeTab === "movies" ? "movies" : "series";
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      toast.error('Erro ao deletar: ' + error.message);
      return;
    }
    toast.success('Removido com sucesso');
    if (activeTab === "movies") setMovies(movies.filter((m) => m.id !== id));
    else setSeries(series.filter((s) => s.id !== id));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { key: "movies" as Tab, label: "Filmes", icon: Film, count: movies.length },
    { key: "series" as Tab, label: "Séries", icon: Tv, count: series.length },
  ];

  const currentItems = activeTab === "movies" ? movies : series;
  const filteredItems = currentItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="font-display text-3xl md:text-5xl text-foreground">
                PAINEL <span className="text-gradient-cinema">ADMIN</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:block">{user.email}</span>
              <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {!isAdmin && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 mb-6">
              Você não tem permissão de administrador. Contate o administrador do sistema.
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-border pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-primary-foreground/20" : "bg-muted"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Buscar ${activeTab === "movies" ? "filmes" : "séries"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => setTmdbOpen(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Adicionar via TMDB
              </button>
            )}
          </div>

          {/* Table */}
          {loadingData ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Poster</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Ano</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Gênero</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nota</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="px-4 py-2">
                          <img src={item.image_url || '/placeholder.svg'} alt={item.title} className="w-10 h-14 object-cover rounded" />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{item.title}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{item.year}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{item.genre}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                            {item.rating}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          {currentItems.length === 0
                            ? `Nenhum ${activeTab === "movies" ? "filme" : "série"} adicionado ainda. Use o botão "Adicionar via TMDB".`
                            : "Nenhum item encontrado"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TMDB Search Modal */}
      <TmdbSearchModal
        type={activeTab === "movies" ? "movie" : "series"}
        open={tmdbOpen}
        onClose={() => setTmdbOpen(false)}
        onAdded={() => loadData()}
      />
    </div>
  );
};

export default Admin;
