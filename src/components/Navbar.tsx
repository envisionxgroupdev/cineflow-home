import { useState } from "react";
import { Link } from "react-router-dom";
import { Film, Menu, X, LogIn, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Início", path: "/" },
  { label: "Lançamentos", path: "/#lancamentos" },
  { label: "Filmes", path: "/#filmes" },
  { label: "Séries", path: "/#series" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Film className="h-7 w-7 text-primary" />
          <span className="font-display text-2xl tracking-wider text-foreground">
            CINE<span className="text-gradient-cinema">FLOW</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a key={link.path} href={link.path}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {link.label}
            </a>
          ))}
          <GlobalSearch />
          {isAdmin && (
            <Link to="/admin"
              className="flex items-center gap-1.5 text-sm font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-md hover:bg-primary/20 transition-colors">
              <Shield className="h-4 w-4" /> Painel
            </Link>
          )}
          {user ? (
            <Link to="/admin"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {user.email?.split('@')[0]}
            </Link>
          ) : (
            <Link to="/login"
              className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
              <LogIn className="h-4 w-4" /> Login
            </Link>
          )}
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-3">
          <GlobalSearch />
          <button className="text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="md:hidden bg-background border-b border-border overflow-hidden">
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <a key={link.path} href={link.path} onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2">
                  {link.label}
                </a>
              ))}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary py-2">
                  <Shield className="h-4 w-4" /> Painel
                </Link>
              )}
              {user ? (
                <span className="text-sm text-muted-foreground py-2">{user.email?.split('@')[0]}</span>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary py-2">
                  <LogIn className="h-4 w-4" /> Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
