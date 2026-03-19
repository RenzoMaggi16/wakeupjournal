import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, LogOut, BrainCircuit, Settings, LayoutDashboard, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "./ThemeToggle";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="border-gradient-bottom bg-background/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-gradient" style={{color: 'var(--accent-gradient-from)'}} />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight">Wakeup Journal</h1>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/mentor">
              <Button variant="ghost" size="sm" className="gap-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200">
                <BrainCircuit className="h-4 w-4" />
                Mentor IA
              </Button>
            </Link>
            <Link to="/configuracion">
              <Button variant="ghost" size="sm" className="gap-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200">
                <Settings className="h-4 w-4" />
                Configuración
              </Button>
            </Link>
            <div className="w-px h-5 bg-border/50 mx-1" />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="h-9 w-9 rounded-lg"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/30 mt-3 pt-3 pb-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
            <Link to="/" onClick={closeMenu}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3 h-10 rounded-lg hover:bg-white/[0.06]">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/mentor" onClick={closeMenu}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3 h-10 rounded-lg hover:bg-white/[0.06]">
                <BrainCircuit className="h-4 w-4" />
                Mentor IA
              </Button>
            </Link>
            <Link to="/configuracion" onClick={closeMenu}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3 h-10 rounded-lg hover:bg-white/[0.06]">
                <Settings className="h-4 w-4" />
                Configuración
              </Button>
            </Link>
            <div className="border-t border-border/30 pt-1 mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { handleSignOut(); closeMenu(); }}
                className="w-full justify-start gap-3 h-10 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
