import { useEffect, useState } from "react";
import { Link, NavLink as RouterNavLink } from "react-router-dom";
import { Menu, X, LogIn, Shield, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Início", path: "/" },
  { label: "Filmes", path: "/filmes" },
  { label: "Séries", path: "/series" },
  { label: "Animes", path: "/animes" },
  { label: "Canais", path: "/canais" },
  { label: "Pedidos", path: "/pedidos" },
  { label: "Minha Lista", path: "/minha-lista" },
  { label: "Contato", path: "/contato" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/95 backdrop-blur-xl border-b border-primary/20 shadow-[0_4px_24px_-12px_hsl(var(--primary)/0.5)]"
          : "bg-gradient-to-b from-black via-black/80 to-transparent border-b border-transparent"
      }`}
    >
      {/* Top red accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/logo-pipocamax.png"
            alt="PipocaMax"
            width={36}
            height={36}
            className="h-9 w-9 object-contain drop-shadow-[0_0_14px_hsl(var(--primary)/0.7)] group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300"
          />
          <div className="flex flex-col leading-none">
            <span className="font-display text-2xl font-bold tracking-[0.18em] text-foreground">
              PIPOCA<span className="text-primary">MAX</span>
            </span>
            <span className="hidden sm:block text-[9px] font-semibold tracking-[0.32em] uppercase text-primary/70 mt-0.5">
              Cinema · Séries · Animes
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center rounded-full border border-primary/15 bg-gradient-to-r from-background/40 via-background/70 to-background/40 backdrop-blur-md px-1.5 py-1 max-w-fit mx-auto shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04)]">
          {navLinks.map((link) => (
            <RouterNavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              className={({ isActive }) =>
                `group relative text-[12px] font-bold uppercase tracking-[0.18em] px-3.5 py-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "text-primary-foreground bg-gradient-to-b from-primary to-primary/80 shadow-[0_4px_18px_-6px_hsl(var(--primary)/0.7),inset_0_1px_0_0_hsl(var(--foreground)/0.2)]"
                    : "text-foreground/70 hover:text-foreground hover:bg-primary/10"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative z-10">{link.label}</span>
                  {!isActive && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </>
              )}
            </RouterNavLink>
          ))}
        </div>

        {/* Right cluster */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <div className="text-foreground/80 hover:text-primary transition-colors">
            <GlobalSearch />
          </div>
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider border border-primary/40 text-primary px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" /> Painel
            </Link>
          )}
          {user ? (
            <Link
              to="/admin"
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors px-2"
            >
              {user.email?.split("@")[0]}
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)] transition-all"
            >
              <LogIn className="h-3.5 w-3.5" /> Entrar
            </Link>
          )}
        </div>

        {/* Mobile */}
        <div className="flex lg:hidden items-center gap-2">
          <div className="text-foreground/90">
            <GlobalSearch />
          </div>
          <button
            className="text-foreground p-2 rounded-md hover:bg-primary/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-black/98 backdrop-blur-xl border-b border-primary/20 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <RouterNavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `text-sm font-semibold uppercase tracking-wider py-2.5 px-3 rounded-md transition-colors border-l-2 ${
                      isActive
                        ? "text-primary border-primary bg-primary/10"
                        : "text-foreground/80 border-transparent hover:text-primary hover:border-primary/50 hover:bg-primary/5"
                    }`
                  }
                >
                  {link.label}
                </RouterNavLink>
              ))}
              <div className="h-px bg-primary/20 my-2" />
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary py-2.5 px-3 rounded-md hover:bg-primary/10"
                >
                  <Shield className="h-4 w-4" /> Painel Admin
                </Link>
              )}
              {user ? (
                <span className="text-sm text-muted-foreground py-2 px-3">
                  {user.email?.split("@")[0]}
                </span>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider bg-primary text-primary-foreground py-2.5 px-3 rounded-md mt-1"
                >
                  <LogIn className="h-4 w-4" /> Entrar
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
