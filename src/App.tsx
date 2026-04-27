import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { lazy, Suspense } from "react";
import Index from "./pages/Index.tsx";
import { SiteScripts } from "./components/SiteScripts.tsx";
import { Loader2 } from "lucide-react";

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
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min — content changes are infrequent
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 text-primary animate-spin" />
  </div>
);

const App = () => (
  <GoogleReCaptchaProvider reCaptchaKey="6LffhagsAAAAAEeoO_4__DnPycbPuXETkIJYPLRI">
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SiteScripts>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </SiteScripts>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </GoogleReCaptchaProvider>
);

export default App;
