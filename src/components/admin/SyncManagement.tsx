import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Download, Film, Tv, Loader2, Search, Check, ExternalLink, Zap, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMovieDetails, getSeriesDetails, getImageUrl } from "@/services/tmdb";
import { toast } from "sonner";

type Category = "movie" | "serie" | "anime";

interface TmdbPreview {
  tmdb_id: number;
  title: string;
  year: string;
  image_url: string;
  overview: string;
  genre: string;
  rating: number;
  backdrop_url: string;
  original_title: string;
  alreadyImported: boolean;
  loading?: boolean;
}

export function SyncManagement() {
  const [category, setCategory] = useState<Category>("movie");
  const [warezIds, setWarezIds] = useState<number[]>([]);
  const [previews, setPreviews] = useState<TmdbPreview[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<number>>(new Set());
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // Load already imported TMDB IDs
  const loadImported = useCallback(async () => {
    const table = category === "movie" ? "movies" : "series";
    const { data } = await supabase.from(table).select("tmdb_id");
    if (data) {
      setImportedIds(new Set(data.map((d: any) => d.tmdb_id).filter(Boolean)));
    }
  }, [category]);

  // Fetch WarezCDN list
  const fetchWarezList = async () => {
    setLoadingList(true);
    setPreviews([]);
    setPage(0);
    try {
      const targetUrl = encodeURIComponent(`https://warezcdn.site/lista?category=${category}&type=tmdb&format=json`);
      const res = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${targetUrl}`);
      const data = await res.json();
      const ids: number[] = Array.isArray(data) ? data.map((id: any) => Number(id)).filter(Boolean) : [];
      setWarezIds(ids);
      await loadImported();
      toast.success(`${ids.length} IDs encontrados no WarezCDN`);
    } catch (err) {
      toast.error("Erro ao buscar lista do WarezCDN");
      setWarezIds([]);
    }
    setLoadingList(false);
  };

  // Load TMDB previews for current page
  const loadPage = useCallback(async (pageNum: number) => {
    if (warezIds.length === 0) return;
    setLoadingPreviews(true);
    const start = pageNum * PAGE_SIZE;
    const slice = warezIds.slice(start, start + PAGE_SIZE);

    const results: TmdbPreview[] = [];
    await Promise.allSettled(
      slice.map(async (tmdbId) => {
        try {
          if (category === "movie") {
            const d = await getMovieDetails(tmdbId);
            results.push({
              tmdb_id: d.id,
              title: d.title,
              original_title: d.original_title,
              year: d.release_date?.slice(0, 4) || "",
              image_url: getImageUrl(d.poster_path),
              backdrop_url: getImageUrl(d.backdrop_path, "w1280"),
              overview: d.overview,
              genre: d.genres?.map((g) => g.name).slice(0, 3).join(", ") || "",
              rating: Math.round(d.vote_average * 10) / 10,
              alreadyImported: importedIds.has(d.id),
            });
          } else {
            const d = await getSeriesDetails(tmdbId);
            results.push({
              tmdb_id: d.id,
              title: d.name,
              original_title: d.original_name,
              year: d.first_air_date?.slice(0, 4) || "",
              image_url: getImageUrl(d.poster_path),
              backdrop_url: getImageUrl(d.backdrop_path, "w1280"),
              overview: d.overview,
              genre: d.genres?.map((g) => g.name).slice(0, 3).join(", ") || "",
              rating: Math.round(d.vote_average * 10) / 10,
              alreadyImported: importedIds.has(d.id),
            });
          }
        } catch {}
      })
    );
    results.sort((a, b) => slice.indexOf(a.tmdb_id) - slice.indexOf(b.tmdb_id));
    setPreviews(results);
    setLoadingPreviews(false);
  }, [warezIds, category, importedIds]);

  useEffect(() => {
    if (warezIds.length > 0) loadPage(page);
  }, [page, warezIds, loadPage]);

  // Import single item
  const handleImport = async (item: TmdbPreview) => {
    setPreviews((prev) =>
      prev.map((p) => (p.tmdb_id === item.tmdb_id ? { ...p, loading: true } : p))
    );

    const table = category === "movie" ? "movies" : "series";
    const payload: any = {
      title: item.title,
      original_title: item.original_title,
      overview: item.overview,
      year: item.year,
      genre: item.genre,
      rating: item.rating,
      image_url: item.image_url,
      backdrop_url: item.backdrop_url,
      tmdb_id: item.tmdb_id,
      is_release: false,
    };

    if (category === "movie") {
      payload.release_date = item.year ? `${item.year}-01-01` : null;
    } else {
      payload.first_air_date = item.year ? `${item.year}-01-01` : null;
    }

    const { error } = await supabase.from(table).insert(payload);
    if (error) {
      toast.error(`Erro ao importar: ${error.message}`);
    } else {
      toast.success(`${item.title} importado!`);
      setImportedIds((prev) => new Set([...prev, item.tmdb_id]));
    }

    setPreviews((prev) =>
      prev.map((p) =>
        p.tmdb_id === item.tmdb_id ? { ...p, loading: false, alreadyImported: !error } : p
      )
    );
  };

  const totalPages = Math.ceil(warezIds.length / PAGE_SIZE);
  const filtered = searchFilter
    ? previews.filter((p) => p.title.toLowerCase().includes(searchFilter.toLowerCase()))
    : previews;

  const categories: { key: Category; label: string; icon: any }[] = [
    { key: "movie", label: "Filmes", icon: Film },
    { key: "serie", label: "Séries", icon: Tv },
    { key: "anime", label: "Animes", icon: Tv },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key); setWarezIds([]); setPreviews([]); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === cat.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchWarezList}
          disabled={loadingList}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Sincronizar WarezCDN
        </button>
      </div>

      {warezIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{warezIds.length}</span> conteúdos disponíveis no WarezCDN
            {" · "}Página {page + 1} de {totalPages}
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtrar na página..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      )}

      {loadingPreviews ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <div
              key={item.tmdb_id}
              className={`bg-card border border-border rounded-lg overflow-hidden group transition-all hover:border-primary/50 ${
                item.alreadyImported ? "opacity-60" : ""
              }`}
            >
              <div className="aspect-[2/3] relative">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {item.alreadyImported && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                      <Check className="h-4 w-4" /> Importado
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2.5 space-y-1.5">
                <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{item.title}</h3>
                <p className="text-[10px] text-muted-foreground">{item.year} · ⭐ {item.rating}</p>
                {!item.alreadyImported && (
                  <button
                    onClick={() => handleImport(item)}
                    disabled={item.loading}
                    className="w-full flex items-center justify-center gap-1 bg-primary text-primary-foreground px-2 py-1.5 rounded text-[11px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {item.loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                    Importar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {warezIds.length > 0 && !loadingPreviews && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}

      {warezIds.length === 0 && !loadingList && (
        <div className="text-center py-16 text-muted-foreground">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Clique em "Sincronizar WarezCDN" para buscar conteúdos disponíveis</p>
        </div>
      )}
    </div>
  );
}
