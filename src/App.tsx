import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { Component, lazy, Suspense, type ReactNode } from "react";
import Index from "./pages/Index.tsx";
import { SiteScripts } from "./components/SiteScripts.tsx";
import { NotificationsToast } from "./components/NotificationsToast.tsx";
import { Loader2, RefreshCw } from "lucide-react";

// Lazy-loaded routes — keeps initial bundle small
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const MovieDetails = lazy(() => import("./pages/MovieDetails.tsx"));
const SeriesDetails = lazy(() => import("./pages/SeriesDetails.tsx"));
const AllMovies = lazy(() => import("./pages/AllMovies.tsx"));
const AllSeries = lazy(() => import("./pages/AllSeries.tsx"));
const AllAnimes = lazy(() => import("./pages/AllAnimes.tsx"));
const AllChannels = lazy(() => import("./pages/AllChannels.tsx"));
const ChannelPlayer = lazy(() => import("./pages/ChannelPlayer.tsx"));
const DMCA = lazy(() => import("./pages/DMCA.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Requests = lazy(() => import("./pages/Requests.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const MyList = lazy(() => import("./pages/MyList.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 min — content rarely changes
      gcTime: 1000 * 60 * 60 * 24, // 24h — keep in memory/storage
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const persister = typeof window !== 'undefined'
  ? createSyncStoragePersister({ storage: window.localStorage, key: 'pipocamax-cache', throttleTime: 1000 })
  : undefined;

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 text-primary animate-spin" />
  </div>
);

const CHUNK_RELOAD_KEY = 'pipocamax-chunk-reload-attempted';

class ChunkErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const isChunkError = /Importing a module script failed|Failed to fetch dynamically imported module|Loading chunk/i.test(message);

    if (isChunkError && sessionStorage.getItem(CHUNK_RELOAD_KEY) !== '1') {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      window.location.reload();
      return;
    }

    console.error(error);
  }

  handleReload = () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Atualize para continuar</h1>
            <p className="text-sm text-muted-foreground">
              O app recebeu uma nova versão e precisa recarregar os arquivos desta página.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}

const App = () => (
  <GoogleReCaptchaProvider reCaptchaKey="6LffhagsAAAAAEeoO_4__DnPycbPuXETkIJYPLRI">
    <HelmetProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: persister!,
          maxAge: 1000 * 60 * 60 * 24, // 24h
          buster: 'v1',
        }}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SiteScripts>
          <BrowserRouter>
            <ChunkErrorBoundary>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/index" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/filme/:slug" element={<MovieDetails />} />
                  <Route path="/serie/:slug" element={<SeriesDetails />} />
                  <Route path="/filmes" element={<AllMovies />} />
                  <Route path="/series" element={<AllSeries />} />
                  <Route path="/animes" element={<AllAnimes />} />
                  <Route path="/canais" element={<AllChannels />} />
                  <Route path="/canal/:externalId" element={<ChannelPlayer />} />
                  <Route path="/dmca" element={<DMCA />} />
                  <Route path="/termos" element={<Terms />} />
                  <Route path="/privacidade" element={<Privacy />} />
                  <Route path="/sobre" element={<About />} />
                  <Route path="/pedidos" element={<Requests />} />
                  <Route path="/contato" element={<Contact />} />
                  <Route path="/minha-lista" element={<MyList />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ChunkErrorBoundary>
            <NotificationsToast />
          </BrowserRouter>
          </SiteScripts>
        </TooltipProvider>
      </PersistQueryClientProvider>
    </HelmetProvider>
  </GoogleReCaptchaProvider>
);

export default App;
