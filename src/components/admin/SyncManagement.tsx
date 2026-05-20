import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Download, Film, Tv, Loader2, Search, Check, Zap, Square, Sparkles, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMovieDetails, getSeriesDetails, getImageUrl } from "@/services/tmdb";
import { toast } from "sonner";
import { fetchJsonResilient } from "@/lib/resilientFetch";

// Retry helper for TMDB calls (avoids transient failures during bulk import)
async function withRetry<T>(fn: () => Promise<T>, retries = 4, delayMs = 800): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      if (i < retries) {
        // exponential backoff with jitter
        const wait = delayMs * Math.pow(2, i) + Math.random() * 300;
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

type Category = "movie" | "serie" | "anime" | "canais";

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

interface ChannelItem {
  id: string;
  name: string;
  category: string;
  description: string;
  logo_url: string;
  embed_url: string;
  is_active: boolean;
  alreadyImported?: boolean;
  loading?: boolean;
}

const PAGE_SIZE = 20;
const BULK_BATCH_SIZE = 5;

export function SyncManagement() {
  const [category, setCategory] = useState<Category>("movie");
  const [warezIds, setWarezIds] = useState<number[]>([]);
  const [previews, setPreviews] = useState<TmdbPreview[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [importedChannelIds, setImportedChannelIds] = useState<Set<string>>(new Set());
  const [loadingList, setLoadingList] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<number>>(new Set());
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(0);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, failed: 0 });
  const cancelBulkRef = useRef(false);

  const isChannels = category === "canais";
  const isAnime = category === "anime";
  const tmdbType: "movie" | "series" = category === "movie" ? "movie" : "series";
  const dbTable = tmdbType === "movie" ? "movies" : "series";

  // Load already imported TMDB IDs (movies + series, including animes)
  const loadImported = useCallback(async () => {
    const allIds: number[] = [];
    for (const table of ["movies", "series"] as const) {
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data } = await supabase.from(table).select("tmdb_id").range(from, from + PAGE - 1);
        if (!data || data.length === 0) break;
        allIds.push(...data.map((d: any) => d.tmdb_id).filter(Boolean));
        if (data.length < PAGE) break;
        from += PAGE;
      }
    }
    const idSet = new Set(allIds);
    setImportedIds(idSet);
    return idSet;
  }, []);

  const loadImportedChannels = useCallback(async () => {
    const all: string[] = [];
    let from = 0;
    while (true) {
      const { data } = await supabase.from("tv_channels").select("external_id").range(from, from + 999);
      if (!data || data.length === 0) break;
      all.push(...data.map((d: any) => d.external_id).filter(Boolean));
      if (data.length < 1000) break;
      from += 1000;
    }
    const set = new Set(all);
    setImportedChannelIds(set);
    return set;
  }, []);

  // Fetch list from WarezCDN
  const fetchWarezList = async () => {
    setLoadingList(true);
    setPreviews([]);
    setChannels([]);
    setPage(0);
    try {
      if (isChannels) {
        const json: any = await fetchJsonResilient(`https://warezcdn.site/lista?category=canais&format=json`, { timeoutMs: 20_000, retries: 2 });
        const list: ChannelItem[] = (json.data || []).filter((c: any) => c.is_active);
        const importedSet = await loadImportedChannels();
        setChannels(list.map((c) => ({ ...c, alreadyImported: importedSet.has(c.id) })));
        toast.success(`${list.length} canais encontrados no WarezCDN`);
      } else {
        const apiCat = isAnime ? "anime" : category;
        const data: any = await fetchJsonResilient(`https://warezcdn.site/lista?category=${apiCat}&type=tmdb&format=json`, { timeoutMs: 20_000, retries: 2 });
        const ids: number[] = Array.isArray(data) ? data.map((id: any) => Number(id)).filter(Boolean) : [];
        setWarezIds(ids);
        await loadImported();
        toast.success(`${ids.length} IDs encontrados no WarezCDN`);
      }
    } catch (err: any) {
      toast.error(`Erro ao buscar lista: ${err?.message || 'falha de rede'}. Tente novamente.`);
      setWarezIds([]);
      setChannels([]);
    }
    setLoadingList(false);
  };

  // Load TMDB previews for current page (movies/series/anime)
  const loadPage = useCallback(async (pageNum: number) => {
    if (warezIds.length === 0 || isChannels) return;
    setLoadingPreviews(true);
    const start = pageNum * PAGE_SIZE;
    const slice = warezIds.slice(start, start + PAGE_SIZE);

    const results: TmdbPreview[] = [];
    await Promise.allSettled(
      slice.map(async (tmdbId) => {
        try {
          if (tmdbType === "movie") {
            const d = await withRetry(() => getMovieDetails(tmdbId));
            results.push({
              tmdb_id: d.id, title: d.title, original_title: d.original_title,
              year: d.release_date?.slice(0, 4) || "",
              image_url: getImageUrl(d.poster_path),
              backdrop_url: getImageUrl(d.backdrop_path, "w1280"),
              overview: d.overview,
              genre: d.genres?.map((g) => g.name).slice(0, 3).join(", ") || "",
              rating: Math.round(d.vote_average * 10) / 10,
              alreadyImported: importedIds.has(d.id),
            });
          } else {
            const d = await withRetry(() => getSeriesDetails(tmdbId));
            results.push({
              tmdb_id: d.id, title: d.name, original_title: d.original_name,
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
  }, [warezIds, tmdbType, importedIds, isChannels]);

  useEffect(() => {
    if (warezIds.length > 0 && !isChannels) loadPage(page);
  }, [page, warezIds, loadPage, isChannels]);

  // Build payload for movie/series/anime
  const buildTmdbPayload = (item: TmdbPreview) => {
    const base: any = {
      title: item.title, original_title: item.original_title, overview: item.overview,
      year: item.year, genre: item.genre, rating: item.rating,
      image_url: item.image_url, backdrop_url: item.backdrop_url,
      tmdb_id: item.tmdb_id, is_release: false,
    };
    if (tmdbType === "movie") base.release_date = item.year ? `${item.year}-01-01` : null;
    else { base.first_air_date = item.year ? `${item.year}-01-01` : null; base.is_anime = isAnime; }
    return base;
  };

  // Import single TMDB item
  const handleImport = async (item: TmdbPreview) => {
    if (importedIds.has(item.tmdb_id)) { toast.info(`"${item.title}" já foi importado!`); return; }
    setPreviews((prev) => prev.map((p) => p.tmdb_id === item.tmdb_id ? { ...p, loading: true } : p));

    const payload = buildTmdbPayload(item);
    const { error } = await supabase.from(dbTable).upsert(payload, { onConflict: 'tmdb_id' });
    if (error) {
      toast.error(`Erro ao importar: ${error.message}`);
    } else {
      toast.success(`${item.title} importado!`);
      setImportedIds((prev) => new Set([...prev, item.tmdb_id]));
    }
    setPreviews((prev) => prev.map((p) => p.tmdb_id === item.tmdb_id ? { ...p, loading: false, alreadyImported: !error } : p));
  };

  // Import single channel
  const handleImportChannel = async (ch: ChannelItem) => {
    if (importedChannelIds.has(ch.id)) { toast.info(`"${ch.name}" já foi importado!`); return; }
    setChannels((prev) => prev.map((c) => c.id === ch.id ? { ...c, loading: true } : c));
    const { error } = await supabase.from("tv_channels").upsert({
      external_id: ch.id, name: ch.name, category: ch.category || null,
      description: ch.description || null, logo_url: ch.logo_url || null,
      embed_url: ch.embed_url, is_active: ch.is_active,
    }, { onConflict: 'external_id' });
    if (error) { toast.error(`Erro: ${error.message}`); }
    else {
      toast.success(`${ch.name} importado!`);
      setImportedChannelIds((prev) => new Set([...prev, ch.id]));
    }
    setChannels((prev) => prev.map((c) => c.id === ch.id ? { ...c, loading: false, alreadyImported: !error } : c));
  };

  // Bulk import
  const handleBulkImport = async () => {
    cancelBulkRef.current = false;

    if (isChannels) {
      const toImport = channels.filter((c) => !importedChannelIds.has(c.id));
      if (toImport.length === 0) { toast.info("Todos os canais já foram importados!"); return; }
      setBulkImporting(true);
      setBulkProgress({ done: 0, total: toImport.length, failed: 0 });
      let done = 0, failed = 0;
      for (let i = 0; i < toImport.length; i += BULK_BATCH_SIZE) {
        if (cancelBulkRef.current) break;
        const batch = toImport.slice(i, i + BULK_BATCH_SIZE);
        const results = await Promise.allSettled(batch.map(async (ch) => {
          const { error } = await supabase.from("tv_channels").upsert({
            external_id: ch.id, name: ch.name, category: ch.category || null,
            description: ch.description || null, logo_url: ch.logo_url || null,
            embed_url: ch.embed_url, is_active: ch.is_active,
          }, { onConflict: 'external_id' });
          if (error) throw error;
          setImportedChannelIds((prev) => new Set([...prev, ch.id]));
        }));
        results.forEach((r) => { done++; if (r.status === "rejected") failed++; });
        setBulkProgress({ done, total: toImport.length, failed });
      }
      setBulkImporting(false);
      toast.success(`Concluído! ${done - failed} importados, ${failed} falhas.`);
      await loadImportedChannels();
      setChannels((prev) => prev.map((c) => ({ ...c, alreadyImported: true })));
      return;
    }

    const idsToImport = warezIds.filter((id) => !importedIds.has(id));
    if (idsToImport.length === 0) { toast.info("Todos os conteúdos já foram importados!"); return; }
    setBulkImporting(true);
    setBulkProgress({ done: 0, total: idsToImport.length, failed: 0 });
    let done = 0, failed = 0;

    for (let i = 0; i < idsToImport.length; i += BULK_BATCH_SIZE) {
      if (cancelBulkRef.current) break;
      const batch = idsToImport.slice(i, i + BULK_BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(async (tmdbId) => {
        let payload: any;
        if (tmdbType === "movie") {
          const d = await withRetry(() => getMovieDetails(tmdbId));
          payload = {
            title: d.title, original_title: d.original_title, overview: d.overview,
            year: d.release_date?.slice(0, 4) || "",
            genre: d.genres?.map(g => g.name).slice(0, 3).join(", ") || "",
            rating: Math.round(d.vote_average * 10) / 10,
            image_url: getImageUrl(d.poster_path),
            backdrop_url: getImageUrl(d.backdrop_path, "w1280"),
            tmdb_id: d.id, is_release: false, release_date: d.release_date || null,
          };
        } else {
          const d = await withRetry(() => getSeriesDetails(tmdbId));
          payload = {
            title: d.name, original_title: d.original_name, overview: d.overview,
            year: d.first_air_date?.slice(0, 4) || "",
            genre: d.genres?.map(g => g.name).slice(0, 3).join(", ") || "",
            rating: Math.round(d.vote_average * 10) / 10,
            image_url: getImageUrl(d.poster_path),
            backdrop_url: getImageUrl(d.backdrop_path, "w1280"),
            tmdb_id: d.id, is_release: false,
            first_air_date: d.first_air_date || null, is_anime: isAnime,
          };
        }
        const { error } = await supabase.from(dbTable).upsert(payload, { onConflict: 'tmdb_id' });
        if (error) throw error;
        setImportedIds((prev) => new Set([...prev, tmdbId]));
      }));
      results.forEach((r) => { done++; if (r.status === "rejected") failed++; });
      setBulkProgress({ done, total: idsToImport.length, failed });
    }
    setBulkImporting(false);
    toast.success(`Concluído! ${done - failed} importados, ${failed} falhas.`);
    await loadImported();
  };

  const cancelBulkImport = () => { cancelBulkRef.current = true; };

  const totalPages = Math.ceil(warezIds.length / PAGE_SIZE);
  const filtered = searchFilter
    ? previews.filter((p) => p.title.toLowerCase().includes(searchFilter.toLowerCase()))
    : previews;
  const filteredChannels = searchFilter
    ? channels.filter((c) => c.name.toLowerCase().includes(searchFilter.toLowerCase()))
    : channels;

  const categories: { key: Category; label: string; icon: any }[] = [
    { key: "movie", label: "Filmes", icon: Film },
    { key: "serie", label: "Séries", icon: Tv },
    { key: "anime", label: "Animes", icon: Sparkles },
    { key: "canais", label: "Canais", icon: Radio },
  ];

  const totalCount = isChannels ? channels.length : warezIds.length;
  const remainingCount = isChannels
    ? channels.filter(c => !importedChannelIds.has(c.id)).length
    : warezIds.filter(id => !importedIds.has(id)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key); setWarezIds([]); setPreviews([]); setChannels([]); setSearchFilter(""); }}
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

      {totalCount > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">{totalCount}</span>{" "}
              {isChannels ? "canais" : "conteúdos"} disponíveis no WarezCDN
              {!isChannels && <> {" · "}Página {page + 1} de {totalPages}</>}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {!bulkImporting ? (
                <button
                  onClick={handleBulkImport}
                  className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:bg-accent/80 transition-colors"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Importar Tudo ({remainingCount})
                </button>
              ) : (
                <button
                  onClick={cancelBulkImport}
                  className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:bg-destructive/90 transition-colors"
                >
                  <Square className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={isChannels ? "Filtrar canais..." : "Filtrar na página..."}
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {bulkImporting && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Importando em massa...
                </span>
                <span className="text-muted-foreground">
                  {bulkProgress.done}/{bulkProgress.total}
                  {bulkProgress.failed > 0 && <span className="text-destructive ml-1">({bulkProgress.failed} falhas)</span>}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TMDB previews grid */}
      {!isChannels && (
        loadingPreviews ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((item) => (
              <div key={item.tmdb_id}
                className={`bg-card border border-border rounded-lg overflow-hidden group transition-all hover:border-primary/50 ${item.alreadyImported ? "opacity-60" : ""}`}>
                <div className="aspect-[2/3] relative">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                  {item.alreadyImported && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="flex items-center gap-1 text-primary text-xs font-bold">
                        <Check className="h-4 w-4" /> Importado
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2.5 space-y-1.5">
                  <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{item.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{item.year} · ⭐ {item.rating}</p>
                  {!item.alreadyImported && (
                    <button onClick={() => handleImport(item)} disabled={item.loading}
                      className="w-full flex items-center justify-center gap-1 bg-primary text-primary-foreground px-2 py-1.5 rounded text-[11px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                      {item.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                      Importar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Channels grid */}
      {isChannels && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredChannels.map((ch) => (
            <div key={ch.id} className={`bg-card border border-border rounded-lg overflow-hidden group transition-all hover:border-primary/50 ${ch.alreadyImported ? "opacity-60" : ""}`}>
              <div className="aspect-square relative bg-secondary/50 flex items-center justify-center p-3">
                {ch.logo_url ? (
                  <img src={ch.logo_url} alt={ch.name} className="max-w-full max-h-full object-contain" loading="lazy" />
                ) : (
                  <Tv className="h-10 w-10 text-muted-foreground" />
                )}
                {ch.alreadyImported && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="flex items-center gap-1 text-primary text-xs font-bold">
                      <Check className="h-4 w-4" /> Importado
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1.5">
                <h3 className="text-xs font-semibold text-foreground line-clamp-1">{ch.name}</h3>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{ch.category || "—"}</p>
                {!ch.alreadyImported && (
                  <button onClick={() => handleImportChannel(ch)} disabled={ch.loading}
                    className="w-full flex items-center justify-center gap-1 bg-primary text-primary-foreground px-2 py-1.5 rounded text-[11px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {ch.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    Importar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isChannels && warezIds.length > 0 && !loadingPreviews && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-40">Anterior</button>
          <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-40">Próxima</button>
        </div>
      )}

      {totalCount === 0 && !loadingList && (
        <div className="text-center py-16 text-muted-foreground">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Clique em "Sincronizar WarezCDN" para buscar conteúdos disponíveis</p>
        </div>
      )}
    </div>
  );
}
