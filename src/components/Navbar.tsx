import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Film, Menu, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalSearch } from "./GlobalSearch";

const navLinks = [
  { label: "Início", path: "/" },
  { label: "Filmes", path: "/#filmes" },
  { label: "Séries", path: "/#series" },
  { label: "Lançamentos", path: "/#lancamentos" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <Link to="/admin"
            className="flex items-center gap-1.5 text-sm font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-md hover:bg-primary/20 transition-colors">
            <Shield className="h-4 w-4" /> Admin
          </Link>
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
              <Link to="/admin" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 text-sm font-medium text-primary py-2">
                <Shield className="h-4 w-4" /> Admin
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
