import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { BackToDashboard } from '@/components/BackToDashboard';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Palette,
  Wallet,
  Plug,
  Check,
  Moon,
  Sun,
  Zap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Save,
  Database,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ManageAccounts from './ManageAccounts';
import { useColors, THEMES, ThemeType } from '@/context/ColorProvider';
import { cn } from "@/lib/utils";
import { TradovateIntegration } from '@/components/TradovateIntegration';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type SectionKey = 'perfil' | 'apariencia' | 'cuentas' | 'brokers';

// ─── Miniature theme preview mockup ─────────────────────────
const ThemePreviewMockup = ({
  background, card, profit, loss, foreground,
}: {
  background: string; card: string; profit: string; loss: string; foreground: string;
}) => (
  <div className="w-full aspect-video rounded-lg overflow-hidden flex flex-col gap-1 p-2" style={{ backgroundColor: background }}>
    <div className="flex gap-1 flex-1">
      <div className="flex-1 rounded-md flex flex-col justify-between p-1.5" style={{ backgroundColor: card }}>
        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: foreground, opacity: 0.3 }} />
        <div className="h-3 w-10 rounded" style={{ backgroundColor: profit, opacity: 0.85 }} />
      </div>
      <div className="flex-1 rounded-md flex flex-col justify-between p-1.5" style={{ backgroundColor: card }}>
        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: foreground, opacity: 0.3 }} />
        <div className="h-3 w-10 rounded" style={{ backgroundColor: profit, opacity: 0.85 }} />
      </div>
    </div>
    <div className="rounded-md p-1.5 flex items-end gap-0.5" style={{ backgroundColor: card, height: 28 }}>
      {[40, 55, 45, 70, 60, 80, 72].map((h, i) => (
        <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: profit, opacity: 0.7 + i * 0.04 }} />
      ))}
    </div>
  </div>
);

// ─── Sidebar nav item ─────────────────────────────────────────
const NavItem = ({
  icon: Icon, label, active, onClick,
}: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-left",
      active
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    )}
  >
    <Icon className="h-4 w-4 shrink-0" />
    {label}
  </button>
);

// ─── Section header ───────────────────────────────────────────
const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
    <Separator className="mt-4" />
  </div>
);

// ─── Perfil section ───────────────────────────────────────────
const PerfilSection = () => {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isSavingPw, setIsSavingPw] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        setDisplayName(data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? '');
      }
    });
  }, []);

  const isGoogleUser = user?.app_metadata?.provider === 'google' ||
    (user?.identities ?? []).some((id: any) => id.provider === 'google');

  const handleSaveName = async () => {
    setIsSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
    if (error) {
      toast.error('Error al guardar el nombre: ' + error.message);
    } else {
      toast.success('Nombre actualizado');
    }
    setIsSavingName(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setIsSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error('Error al cambiar la contraseña: ' + error.message);
    } else {
      toast.success('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsSavingPw(false);
  };

  const avatarLetter = (displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="space-y-8">
      <SectionHeader title="Perfil" description="Administrá la información de tu cuenta." />

      {/* Avatar + email */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
          {avatarLetter}
        </div>
        <div>
          <p className="font-semibold text-base">{displayName || 'Sin nombre'}</p>
          <p className="text-sm text-muted-foreground">{user?.email ?? '—'}</p>
        </div>
      </div>

      {/* Email (read-only) */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          Email
        </Label>
        <Input value={user?.email ?? ''} readOnly disabled className="bg-muted/40 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">El email no se puede modificar.</p>
      </div>

      {/* Display name */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          Nombre de usuario
        </Label>
        <div className="flex gap-2">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tu nombre"
            className="flex-1"
          />
          <Button onClick={handleSaveName} disabled={isSavingName} size="sm" className="gap-1.5">
            {isSavingName ? (
              <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {/* Password change */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-0.5">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            Cambiar contraseña
          </h3>
          {isGoogleUser && (
            <p className="text-xs text-muted-foreground">
              Tu cuenta está vinculada con Google. Podés establecer una contraseña adicional si lo deseás.
            </p>
          )}
        </div>

        <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-muted/20">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nueva contraseña</Label>
            <div className="relative">
              <Input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Confirmar nueva contraseña</Label>
            <div className="relative">
              <Input
                type={showConfirmPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí la contraseña"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={isSavingPw || !newPassword || !confirmPassword}
            size="sm"
            className="w-full mt-1"
          >
            {isSavingPw ? (
              <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            Actualizar contraseña
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Apariencia section ───────────────────────────────────────
const AparienciaSection = () => {
  const { currentTheme, setTheme, isLoading } = useColors();
  const [isChanging, setIsChanging] = useState(false);

  const handleThemeChange = async (themeKey: ThemeType) => {
    setIsChanging(true);
    await setTheme(themeKey);
    setIsChanging(false);
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div>
      <SectionHeader title="Apariencia" description="Elegí el esquema de colores de tu journal." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(THEMES) as [ThemeType, typeof THEMES[ThemeType]][]).map(([key, theme]) => {
          const isActive = currentTheme === key;
          const isDarkTheme = theme.colors.mode === 'dark';
          const cardBg = isDarkTheme ? (key === 'wakeup' ? '#110d1e' : '#1a1a1a') : '#e8e8e8';
          const cardFg = isDarkTheme ? '#ffffff' : '#111111';

          return (
            <button
              key={key}
              onClick={() => handleThemeChange(key)}
              disabled={isChanging}
              className={cn(
                "relative rounded-xl border-2 text-left transition-all duration-200 overflow-hidden focus:outline-none",
                "hover:border-primary/50 cursor-pointer",
                isActive
                  ? "border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-lg"
                  : "border-border/50 hover:shadow-md"
              )}
            >
              {isActive && (
                <div className="absolute top-2.5 right-2.5 z-10 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
              )}
              <div className="p-3 pb-0" style={{ backgroundColor: theme.colors.background }}>
                <ThemePreviewMockup
                  background={theme.colors.background} card={cardBg}
                  profit={theme.colors.profit} loss={theme.colors.loss} foreground={cardFg}
                />
              </div>
              <div className="p-4 bg-card">
                <div className="flex items-center gap-2 mb-1">
                  {key === 'wakeup' && <Zap className="h-3.5 w-3.5 text-yellow-400 shrink-0" />}
                  {key === 'dark' && <Moon className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                  {key === 'light' && <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                  <span className="text-sm font-semibold">{theme.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  {key === 'wakeup' && "El tema original de Wakeup Journal. Alto contraste neón."}
                  {key === 'dark' && "Modo oscuro clásico, sobrio y profesional."}
                  {key === 'light' && "Modo claro limpio, ideal para ambientes iluminados."}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.profit }} />
                    <span className="text-[10px] text-muted-foreground">Ganancia</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.loss }} />
                    <span className="text-[10px] text-muted-foreground">Pérdida</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Cuentas section ─────────────────────────────────────────
const CuentasSection = () => (
  <div>
    <SectionHeader title="Gestionar Cuentas" description="Administrá tus cuentas de trading." />
    <ManageAccounts />
  </div>
);

// ─── Brokers section ─────────────────────────────────────────
const BrokersSection = () => {
  const [activeTab, setActiveTab] = useState<'tradovate' | 'rithmic'>('tradovate');

  const { data: tradovateStatus } = useQuery({
    queryKey: ['tradovate-status-preview'],
    queryFn: async () => {
      const { data } = await supabase.from('tradovate_connections').select('status').maybeSingle();
      return data?.status ?? null;
    },
  });

  return (
    <div>
      <SectionHeader
        title="Brokers y Conexiones"
        description="Conectá tus brokers para sincronizar trades automáticamente."
      />

      {/* Broker tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('tradovate')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
            activeTab === 'tradovate'
              ? "bg-muted border-border text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Plug className="h-4 w-4" />
          Tradovate
          {tradovateStatus === 'connected' ? (
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10 px-1.5 py-0">
              Conectado
            </Badge>
          ) : tradovateStatus === 'error' ? (
            <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive bg-destructive/10 px-1.5 py-0">
              Error
            </Badge>
          ) : null}
        </button>

        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-transparent text-muted-foreground/40 cursor-not-allowed"
        >
          <Database className="h-4 w-4" />
          Rithmic
          <Badge variant="outline" className="text-[10px] border-muted-foreground/20 text-muted-foreground/50 bg-muted/20 px-1.5 py-0">
            Próximamente
          </Badge>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tradovate' && (
          <motion.div
            key="tradovate"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <TradovateIntegration />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Settings page ───────────────────────────────────────
const Settings = () => {
  const [activeSection, setActiveSection] = useState<SectionKey>('perfil');

  const navItems: { key: SectionKey; label: string; icon: React.ElementType }[] = [
    { key: 'perfil', label: 'Perfil', icon: User },
    { key: 'apariencia', label: 'Apariencia', icon: Palette },
    { key: 'cuentas', label: 'Cuentas', icon: Wallet },
    { key: 'brokers', label: 'Brokers', icon: Plug },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <BackToDashboard />

        <div className="flex gap-8 mt-2">
          {/* ── Sidebar ────────────────────────────────────── */}
          <aside className="w-44 shrink-0 hidden md:block">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Configuración
            </p>
            <nav className="space-y-0.5">
              {navItems.map(({ key, label, icon }) => (
                <NavItem
                  key={key}
                  icon={icon}
                  label={label}
                  active={activeSection === key}
                  onClick={() => setActiveSection(key)}
                />
              ))}
            </nav>
          </aside>

          {/* ── Mobile tabs ────────────────────────────────── */}
          <div className="md:hidden w-full mb-4">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {navItems.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all",
                    activeSection === key
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Content ────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {activeSection === 'perfil' && <PerfilSection />}
                {activeSection === 'apariencia' && <AparienciaSection />}
                {activeSection === 'cuentas' && <CuentasSection />}
                {activeSection === 'brokers' && <BrokersSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
