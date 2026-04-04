import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Film, Tv, Settings, Plus, Search, Trash2, Edit, Key, Save, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

type Tab = "movies" | "series" | "settings";

interface ContentItem {
  id: string;
  title: string;
  year: string;
  genre: string;
  rating: number;
  type: "movie" | "series";
}

const initialMovies: ContentItem[] = [
  { id: "1", title: "Duna: Parte Dois", year: "2024", genre: "Sci-Fi", rating: 8.5, type: "movie" },
  { id: "2", title: "Oppenheimer", year: "2023", genre: "Drama", rating: 8.9, type: "movie" },
  { id: "3", title: "Pobres Criaturas", year: "2024", genre: "Fantasia", rating: 8.2, type: "movie" },
];

const initialSeries: ContentItem[] = [
  { id: "s1", title: "The Bear", year: "2024", genre: "Drama", rating: 8.6, type: "series" },
  { id: "s2", title: "Shogun", year: "2024", genre: "História", rating: 8.8, type: "series" },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState<Tab>("movies");
  const [movies, setMovies] = useState(initialMovies);
  const [series, setSeries] = useState(initialSeries);
  const [apiKey, setApiKey] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { key: "movies" as Tab, label: "Filmes", icon: Film, count: movies.length },
    { key: "series" as Tab, label: "Séries", icon: Tv, count: series.length },
    { key: "settings" as Tab, label: "Configurações", icon: Settings },
  ];

  const currentItems = activeTab === "movies" ? movies : series;
  const filteredItems = currentItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (activeTab === "movies") {
      setMovies(movies.filter((m) => m.id !== id));
    } else {
      setSeries(series.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-4xl md:text-5xl text-foreground">
              PAINEL <span className="text-gradient-cinema">ADMIN</span>
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-border pb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? "bg-primary-foreground/20" : "bg-muted"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab !== "settings" ? (
            <div>
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
                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </div>

              {/* Table */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
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
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{item.title}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{item.year}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{item.genre}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                              {item.rating}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            Nenhum item encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Settings Tab */
            <div className="max-w-2xl">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  CONEXÃO API — TMDB
                </h3>

                <p className="text-sm text-muted-foreground mb-6">
                  Conecte sua chave API do{" "}
                  <a
                    href="https://www.themoviedb.org/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    The Movie Database (TMDB)
                  </a>{" "}
                  para puxar automaticamente sinopses, imagens e informações dos filmes e séries.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      API Key (v3 auth)
                    </label>
                    <input
                      type="password"
                      placeholder="Cole sua chave API aqui..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                    <Save className="h-4 w-4" />
                    Salvar Configurações
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Como obter a chave API:</h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Acesse <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">themoviedb.org</a> e crie uma conta</li>
                    <li>Vá em Configurações → API</li>
                    <li>Solicite uma chave de API (gratuita)</li>
                    <li>Cole a chave acima e salve</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
