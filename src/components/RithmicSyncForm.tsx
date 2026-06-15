import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Wifi, WifiOff, RefreshCw, Loader2, CheckCircle2, XCircle,
  Clock, ShieldCheck, Database
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSyncAt: string | null;
  errorMessage: string | null;
}

const RITHMIC_API_URL = import.meta.env.VITE_RITHMIC_SYNC_API_URL || 'http://localhost:8000';

export const RithmicSyncForm = () => {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    lastSyncAt: null,
    errorMessage: null,
  });
  
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Form State
  const [rithmicUsername, setRithmicUsername] = useState('');
  const [rithmicPassword, setRithmicPassword] = useState('');
  const [environment, setEnvironment] = useState<'demo' | 'live'>('demo');

  // Fetch initial status from DB
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoadingStatus(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rithmic_connections')
        .select('status, last_sync_at, error_message')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching Rithmic status:', error);
        return;
      }

      if (data) {
        setConnectionStatus({
          status: data.status as any,
          lastSyncAt: data.last_sync_at,
          errorMessage: data.error_message,
        });
        if (data.status === 'syncing') {
          setIsSyncing(true);
        }
      }
    } catch (error) {
      console.error('Error fetching Rithmic status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Polling for sync status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSyncing) {
      interval = setInterval(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const res = await fetch(`${RITHMIC_API_URL}/api/sync/status/${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setConnectionStatus({
              status: data.status,
              lastSyncAt: data.last_sync_at,
              errorMessage: data.error_message,
            });

            if (data.status === 'connected' || data.status === 'error') {
              setIsSyncing(false);
              clearInterval(interval);
              if (data.status === 'connected') {
                toast.success('Sincronización de Rithmic completada');
                queryClient.invalidateQueries({ queryKey: ['trades'] });
                fetchStatus(); // re-fetch to get correct last_sync_at formatting
              } else if (data.status === 'error') {
                toast.error(`Error en la sincronización: ${data.error_message}`);
              }
            }
          }
        } catch (e) {
          console.error("Error polling Rithmic status", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSyncing, queryClient, fetchStatus]);


  const handleSync = async () => {
    if (!rithmicUsername.trim() || !rithmicPassword.trim()) {
      toast.error('Todos los campos son obligatorios.');
      return;
    }

    try {
      setIsSyncing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${RITHMIC_API_URL}/api/sync/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: session.user.id,
          rithmic_username: rithmicUsername.trim(),
          rithmic_password: rithmicPassword,
          environment: environment
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al iniciar la sincronización');
      }

      toast.info('Sincronización en proceso. Esto puede tardar unos segundos...');
      setRithmicPassword(''); // Clear password from memory immediately

    } catch (error: any) {
      toast.error(error.message || 'Error de conexión con el servicio de Rithmic');
      setIsSyncing(false);
      setConnectionStatus(prev => ({
        ...prev,
        status: 'error',
        errorMessage: error.message,
      }));
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await fetch(`${RITHMIC_API_URL}/api/rithmic-connections/${user.id}`, {
        method: 'DELETE'
      });

      await supabase.from('rithmic_connections').delete().eq('user_id', user.id);

      setConnectionStatus({
        status: 'disconnected',
        lastSyncAt: null,
        errorMessage: null,
      });
      toast.success('Desconectado de Rithmic');
    } catch (error: any) {
      toast.error('Error al desconectar');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const isConnected = connectionStatus.status === 'connected';
  const isError = connectionStatus.status === 'error';

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando estado de Rithmic...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ Connection Status Card ═══ */}
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80">
        <div
          className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 transition-colors duration-500 ${
            isConnected ? 'bg-emerald-500' : isError ? 'bg-red-500' : isSyncing ? 'bg-blue-500' : 'bg-zinc-500'
          }`}
        />

        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                  isConnected ? 'bg-emerald-500/15 text-emerald-400'
                  : isError ? 'bg-red-500/15 text-red-400'
                  : isSyncing ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-zinc-500/15 text-zinc-400'
                }`}
              >
                <Database className="h-5 w-5" />
                {isConnected && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Rithmic</CardTitle>
                <CardDescription className="text-xs">
                  Lucid, TradeSea, Apex, etc.
                </CardDescription>
              </div>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : isError ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : isSyncing ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
              }`}
            >
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-400' : isError ? 'bg-red-400' : isSyncing ? 'bg-blue-400 animate-pulse' : 'bg-zinc-400'
                }`}
              />
              {isConnected ? 'Conectado' : isError ? 'Error' : isSyncing ? 'Sincronizando' : 'Desconectado'}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isError && connectionStatus.errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{connectionStatus.errorMessage}</p>
            </div>
          )}

          {!isConnected && !isSyncing && (
            <div className="space-y-4 p-4 rounded-lg border border-border/40 bg-muted/10">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Tus credenciales no se almacenan nunca. Sólo se usan en el momento para obtener el historial.
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rit-username">Usuario Rithmic</Label>
                  <Input id="rit-username" value={rithmicUsername} onChange={e => setRithmicUsername(e.target.value)} disabled={isSyncing} />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="rit-password">Contraseña Rithmic</Label>
                  <Input id="rit-password" type="password" value={rithmicPassword} onChange={e => setRithmicPassword(e.target.value)} disabled={isSyncing} autoComplete="off" />
                </div>

                <div className="space-y-1.5">
                  <Label>Entorno (Gateway)</Label>
                  <Select value={environment} onValueChange={(v) => setEnvironment(v as 'demo' | 'live')} disabled={isSyncing}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demo (Simulación)</SelectItem>
                      <SelectItem value="live">Live (Producción)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSync}
                disabled={isSyncing || !rithmicUsername.trim() || !rithmicPassword.trim()}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white mt-4"
              >
                <RefreshCw className="h-4 w-4" />
                Iniciar Sincronización
              </Button>
            </div>
          )}

          {isSyncing && (
             <div className="space-y-4 py-6 text-center border border-border/40 bg-muted/10 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">Sincronizando historial...</p>
                <p className="text-xs text-muted-foreground/70">Esto puede tardar entre 10 y 30 segundos.</p>
             </div>
          )}

          {isConnected && (
            <>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <WifiOff className="h-4 w-4" />
                  Desconectar
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Última sincronización: {formatDate(connectionStatus.lastSyncAt)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RithmicSyncForm;
