import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { TmdbSearchModal } from "@/components/TmdbSearchModal";
import { EditContentModal } from "@/components/EditContentModal";
import { UserManagement } from "@/components/admin/UserManagement";
import { MaintenanceManagement } from "@/components/admin/MaintenanceManagement";
import { ReportsManagement } from "@/components/admin/ReportsManagement";
import { RequestsManagement } from "@/components/admin/RequestsManagement";
import {
  Film, Tv, Plus, Search, Trash2, Pencil, ArrowLeft, LogOut, Loader2, Users,
  Sparkles, LayoutDashboard, RefreshCw, Code2, Megaphone, Inbox,
  MessageSquare, Radio, Bell, Home, Wrench, Ticket,
} from "lucide-react";
import { Dashboard } from "@/components/admin/Dashboard";
import { SyncManagement } from "@/components/admin/SyncManagement";
import { CodeManagement } from "@/components/admin/CodeManagement";
import { AdsManagement } from "@/components/admin/AdsManagement";
import { NotificationsManagement } from "@/components/admin/NotificationsManagement";
import { AnnouncementManagement } from "@/components/admin/AnnouncementManagement";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Movie, Series } from "@/types/database";
import type { TvChannel } from "@/types/channel";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

type Tab =
  | "dashboard" | "movies" | "series" | "animes" | "channels"
  | "users" | "reports" | "requests"
  | "sync" | "codes" | "ads" | "notifications" | "announcement" | "maintenance";

interface TabMeta {
  key: Tab;
  label: string;
  icon: typeof Film;
  description: string;
  count?: number | null;
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [animes, setAnimes] = useState<Series[]>([]);
  const [channels, setChannels] = useState<TvChannel[]>([]);
  const [moviesCount, setMoviesCount] = useState<number>(0);
  const [seriesCount, setSeriesCount] = useState<number>(0);
  const [animesCount, setAnimesCount] = useState<number>(0);
  const [channelsCount, setChannelsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [tmdbOpen, setTmdbOpen] = useState(false);
  const [editItem, setEditItem] = useState<(Movie | Series) | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); }
  }, [authLoading, user, isAdmin, navigate]);
  useEffect(() => { if (user && isAdmin) loadData(); }, [user, isAdmin]);

  const loadData = async () => {
    setLoadingData(true);
    const [moviesRes, seriesRes, animesRes, channelsRes, mCount, sCount, aCount, cCount] = await Promise.all([
      supabase.from('movies').select('*').order('created_at', { ascending: false }),
      supabase.from('series').select('*').eq('is_anime', false).order('created_at', { ascending: false }),
      supabase.from('series').select('*').eq('is_anime', true).order('created_at', { ascending: false }),
      supabase.from('tv_channels').select('*').order('name'),
      supabase.from('movies').select('id', { count: 'exact', head: true }),
      supabase.from('series').select('id', { count: 'exact', head: true }).eq('is_anime', false),
      supabase.from('series').select('id', { count: 'exact', head: true }).eq('is_anime', true),
      supabase.from('tv_channels').select('id', { count: 'exact', head: true }),
    ]);
    if (moviesRes.data) setMovies(moviesRes.data as Movie[]);
    if (seriesRes.data) setSeries(seriesRes.data as Series[]);
    if (animesRes.data) setAnimes(animesRes.data as Series[]);
    if (channelsRes.data) setChannels(channelsRes.data as TvChannel[]);
    setMoviesCount(mCount.count ?? 0);
    setSeriesCount(sCount.count ?? 0);
    setAnimesCount(aCount.count ?? 0);
    setChannelsCount(cCount.count ?? 0);
    setLoadingData(false);
  };

  const handleDelete = async (id: string) => {
    const table =
      activeTab === "movies" ? "movies" :
      activeTab === "channels" ? "tv_channels" : "series";
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { toast.error('Erro ao deletar: ' + error.message); setDeleteConfirm(null); return; }
    toast.success('Removido com sucesso');
    if (activeTab === "movies") { setMovies(movies.filter(m => m.id !== id)); setMoviesCount(c => Math.max(0, c - 1)); }
    else if (activeTab === "series") { setSeries(series.filter(s => s.id !== id)); setSeriesCount(c => Math.max(0, c - 1)); }
    else if (activeTab === "animes") { setAnimes(animes.filter(a => a.id !== id)); setAnimesCount(c => Math.max(0, c - 1)); }
    else if (activeTab === "channels") { setChannels(channels.filter(ch => ch.id !== id)); setChannelsCount(c => Math.max(0, c - 1)); }
    setDeleteConfirm(null);
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  // Grouped sidebar structure
  const groups: { label: string; items: TabMeta[] }[] = [
    {
      label: "Geral",
      items: [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Visão geral e métricas do site" },
      ],
    },
    {
      label: "Conteúdo",
      items: [
        { key: "movies", label: "Filmes", icon: Film, count: moviesCount, description: "Gerencie o catálogo de filmes" },
        { key: "series", label: "Séries", icon: Tv, count: seriesCount, description: "Gerencie o catálogo de séries" },
        { key: "animes", label: "Animes", icon: Sparkles, count: animesCount, description: "Gerencie o catálogo de animes" },
        { key: "channels", label: "Canais", icon: Radio, count: channelsCount, description: "Canais de TV ao vivo" },
      ],
    },
    {
      label: "Comunidade",
      items: [
        { key: "reports", label: "Tickets", icon: Ticket, description: "Tickets de reportes abertos pelos usuários" },
        { key: "requests", label: "Pedidos", icon: Inbox, description: "Pedidos de novos conteúdos" },
        { key: "users", label: "Usuários", icon: Users, description: "Permissões e administração de contas" },
      ],
    },
    {
      label: "Sistema",
      items: [
        { key: "sync", label: "Sincronização", icon: RefreshCw, description: "Importar conteúdos do WarezCDN/TMDB" },
        { key: "codes", label: "Códigos", icon: Code2, description: "Scripts globais do site" },
        { key: "ads", label: "Anúncios", icon: Megaphone, description: "Posicionamento e gestão de anúncios" },
        { key: "notifications", label: "Notificações", icon: Bell, description: "Avisos enviados aos visitantes" },
        { key: "announcement", label: "Banner de aviso", icon: Megaphone, description: "Mensagem em destaque no topo do site" },
        { key: "maintenance", label: "Manutenção", icon: Wrench, description: "Ativar/desativar modo manutenção do site" },
      ],
    },
  ];

  const allTabs = groups.flatMap(g => g.items);
  const currentTab = allTabs.find(t => t.key === activeTab) ?? allTabs[0];

  const isContentTab = activeTab === "movies" || activeTab === "series" || activeTab === "animes";
  const currentItems: (Movie | Series)[] =
    activeTab === "movies" ? movies :
    activeTab === "animes" ? animes :
    activeTab === "series" ? series : [];
  const filteredItems = currentItems.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <SidebarProvider>
      <Helmet>
        <title>Painel Administrativo — PipocaMax</title>
        <meta name="description" content="Painel administrativo restrito do PipocaMax para gerenciar filmes, séries, animes, canais de TV, usuários, anúncios e configurações do site." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://pipocamax.sbs/admin" />
      </Helmet>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar
          groups={groups}
          activeTab={activeTab}
          onSelect={(k) => { setActiveTab(k); setSearchQuery(""); }}
          onSignOut={handleSignOut}
          userEmail={user.email ?? ""}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 h-14 flex items-center gap-3 border-b border-border/60 bg-background/80 backdrop-blur-xl px-4">
            <SidebarTrigger />
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors" title="Ir ao site">
              <Home className="h-4 w-4" />
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-medium text-foreground truncate">{currentTab.label}</span>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:block">{user.email}</span>
              <button onClick={handleSignOut} className="text-muted-foreground hover:text-destructive transition-colors" title="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full">
              {/* Page header */}
              <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <currentTab.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="font-display text-2xl sm:text-3xl text-foreground leading-tight">
                      {currentTab.label.toUpperCase()}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{currentTab.description}</p>
                  </div>
                </div>
                {currentTab.count != null && (
                  <div className="rounded-xl border border-border/60 bg-card px-4 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
                    <p className="text-xl font-display text-foreground leading-tight">{currentTab.count.toLocaleString('pt-BR')}</p>
                  </div>
                )}
              </div>

              {!isAdmin && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 mb-6">
                  Você não tem permissão de administrador.
                </div>
              )}

              {activeTab === "dashboard" ? (isAdmin ? <Dashboard /> : null)
                : activeTab === "users" ? (isAdmin ? <UserManagement /> : null)
                : activeTab === "reports" ? (isAdmin ? <ReportsManagement /> : null)
                : activeTab === "requests" ? (isAdmin ? <RequestsManagement /> : null)
                : activeTab === "sync" ? (isAdmin ? <SyncManagement /> : null)
                : activeTab === "codes" ? (isAdmin ? <CodeManagement /> : null)
                : activeTab === "ads" ? (isAdmin ? <AdsManagement /> : null)
                : activeTab === "notifications" ? (isAdmin ? <NotificationsManagement /> : null)
                : activeTab === "announcement" ? (isAdmin ? <AnnouncementManagement /> : null)
                : activeTab === "maintenance" ? (isAdmin ? <MaintenanceManagement /> : null)
                : activeTab === "channels" ? (
                  <>
                    <Toolbar
                      placeholder="Buscar canais..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                      action={isAdmin ? {
                        label: "Sincronizar canais",
                        icon: RefreshCw,
                        onClick: () => setActiveTab("sync"),
                      } : undefined}
                    />
                    {loadingData ? <LoadingBlock /> : (
                      <TableShell>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border/60 bg-secondary/30">
                              <Th>Logo</Th>
                              <Th>Nome</Th>
                              <Th className="hidden sm:table-cell">Categoria</Th>
                              <Th>Status</Th>
                              <Th className="text-right">Ações</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredChannels.map(ch => (
                              <tr key={ch.id} className="border-b border-border/40 hover:bg-secondary/40 transition-colors">
                                <td className="px-4 py-2">
                                  <div className="w-10 h-10 rounded-lg bg-secondary border border-border/40 flex items-center justify-center p-1">
                                    {ch.logo_url
                                      ? <img src={ch.logo_url} alt={ch.name} className="max-w-full max-h-full object-contain" />
                                      : <Radio className="h-4 w-4 text-muted-foreground" />}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-medium text-foreground">{ch.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{ch.external_id}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{ch.category || '—'}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ch.is_active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    {ch.is_active ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {isAdmin && (
                                    <button onClick={() => setDeleteConfirm(ch.id)}
                                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Excluir">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {filteredChannels.length === 0 && (
                              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                {channels.length === 0 ? 'Nenhum canal sincronizado. Vá em Sincronização → Canais.' : 'Nenhum canal encontrado.'}
                              </td></tr>
                            )}
                          </tbody>
                        </table>
                      </TableShell>
                    )}
                  </>
                ) : isContentTab ? (
                  <>
                    <Toolbar
                      placeholder={`Buscar ${activeTab === "movies" ? "filmes" : activeTab === "animes" ? "animes" : "séries"}...`}
                      value={searchQuery}
                      onChange={setSearchQuery}
                      action={isAdmin ? {
                        label: "Adicionar via TMDB",
                        icon: Plus,
                        onClick: () => setTmdbOpen(true),
                      } : undefined}
                    />
                    {loadingData ? <LoadingBlock /> : (
                      <TableShell>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border/60 bg-secondary/30">
                              <Th>Poster</Th>
                              <Th>Título</Th>
                              <Th className="hidden sm:table-cell">Ano</Th>
                              <Th className="hidden md:table-cell">Gênero</Th>
                              <Th>Status</Th>
                              <Th className="text-right">Ações</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredItems.map(item => (
                              <tr key={item.id} className="border-b border-border/40 hover:bg-secondary/40 transition-colors">
                                <td className="px-4 py-2">
                                  <img src={item.image_url || '/placeholder.svg'} alt={item.title} className="w-10 h-14 object-cover rounded-md border border-border/40" />
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                                  <p className="text-xs text-muted-foreground">⭐ {item.rating}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{item.year}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{item.genre}</td>
                                <td className="px-4 py-3">
                                  {item.is_release && (
                                    <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                      <Sparkles className="h-3 w-3" /> Lançamento
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {isAdmin && (
                                    <div className="flex items-center gap-1 justify-end">
                                      <button onClick={() => setEditItem(item)}
                                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Editar">
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => setDeleteConfirm(item.id)}
                                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Excluir">
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {filteredItems.length === 0 && (
                              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                {currentItems.length === 0 ? `Nenhum ${activeTab === "movies" ? "filme" : activeTab === "animes" ? "anime" : "série"} adicionado ainda.` : "Nenhum item encontrado"}
                              </td></tr>
                            )}
                          </tbody>
                        </table>
                      </TableShell>
                    )}
                  </>
                ) : null}
            </div>
          </main>
        </div>
      </div>

      <TmdbSearchModal
        type={activeTab === "movies" ? "movie" : "series"}
        open={tmdbOpen}
        onClose={() => setTmdbOpen(false)}
        onAdded={() => loadData()}
      />
      {editItem && (
        <EditContentModal
          item={editItem}
          type={activeTab === "movies" ? "movie" : "series"}
          open={!!editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { loadData(); setEditItem(null); }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="h-14 w-14 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-display text-lg text-foreground mb-2">CONFIRMAR EXCLUSÃO</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Tem certeza que deseja excluir este item? Essa ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
};

/* ---------------- Reusable subcomponents ---------------- */

function AdminSidebar({
  groups, activeTab, onSelect, onSignOut, userEmail,
}: {
  groups: { label: string; items: TabMeta[] }[];
  activeTab: Tab;
  onSelect: (k: Tab) => void;
  onSignOut: () => void;
  userEmail: string;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarHeader className="border-b border-border/60">
        <Link to="/" className="flex items-center gap-2 px-2 py-1.5 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-display text-sm shrink-0">
            P
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-sm text-foreground leading-tight truncate">PIPOCA<span className="text-primary">MAX</span></p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin Panel</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => onSelect(item.key)}
                        tooltip={item.label}
                        className={isActive
                          ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                          : "text-muted-foreground hover:text-foreground"}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {item.count != null && !collapsed && (
                          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          }`}>
                            {item.count}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60">
        {!collapsed ? (
          <div className="px-2 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Logado como</p>
            <p className="text-xs text-foreground truncate">{userEmail}</p>
            <button
              onClick={onSignOut}
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        ) : (
          <button
            onClick={onSignOut}
            className="mx-auto my-1 p-2 rounded-md text-muted-foreground hover:text-destructive transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function Toolbar({
  value, onChange, placeholder, action,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  action?: { label: string; icon: typeof Plus; onClick: () => void };
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-colors"
        />
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
        >
          <action.icon className="h-4 w-4" /> {action.label}
        </button>
      )}
    </div>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

function LoadingBlock() {
  return (
    <div className="flex justify-center py-16 bg-card border border-border/60 rounded-xl">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  );
}

export default Admin;
