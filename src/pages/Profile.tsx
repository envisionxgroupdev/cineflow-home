import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useWatchlist';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  User as UserIcon, Mail, Calendar, Shield, LogOut, Save, Loader2,
  Bookmark, Film, Tv, KeyRound, Eye, EyeOff, Crown, Sparkles,
} from 'lucide-react';

const Profile = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const { items: watchlist, loading: wlLoading } = useWatchlist();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const [newPass, setNewPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, created_at')
        .eq('id', user.id)
        .maybeSingle();
      const name = data?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || '';
      setDisplayName(name);
      setOriginalName(name);
      setCreatedAt(data?.created_at || user.created_at || null);
    })();
  }, [user, authLoading, navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;
    const clean = displayName.trim();
    if (!clean) { toast.error('Nome não pode estar vazio'); return; }
    if (clean.length > 80) { toast.error('Nome muito longo'); return; }
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({ display_name: clean }).eq('id', user.id);
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    setOriginalName(clean);
    toast.success('Perfil atualizado');
  };

  const handleChangePassword = async () => {
    if (newPass.length < 6) { toast.error('A senha precisa ter pelo menos 6 caracteres'); return; }
    setChangingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setChangingPass(false);
    if (error) { toast.error(error.message); return; }
    setNewPass('');
    toast.success('Senha alterada com sucesso');
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const initial = (displayName || user.email || '?')[0].toUpperCase();
  const movieCount = watchlist.filter(i => i.content_type === 'movie').length;
  const seriesCount = watchlist.filter(i => i.content_type === 'series').length;
  const nameChanged = displayName.trim() !== originalName;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Meu Perfil — PipocaMax</title>
        <meta name="description" content="Gerencie sua conta no PipocaMax." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Navbar />

      <main className="flex-1 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero card */}
          <div className="relative rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary/15 via-card to-card mb-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(var(--primary)/0.25),_transparent_60%)] pointer-events-none" />
            <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center text-3xl sm:text-4xl font-display font-bold text-primary shrink-0 shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-display text-2xl sm:text-3xl text-foreground leading-tight truncate">
                    {displayName || 'Sem nome'}
                  </h1>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                      <Shield className="h-3 w-3" /> Admin
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}
                </p>
                {createdAt && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Calendar className="h-3 w-3" />
                    Membro desde {new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-destructive/40 text-destructive rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard icon={Bookmark} label="Minha Lista" value={watchlist.length} loading={wlLoading} />
            <StatCard icon={Film} label="Filmes" value={movieCount} loading={wlLoading} />
            <StatCard icon={Tv} label="Séries" value={seriesCount} loading={wlLoading} />
          </div>

          {/* Profile + Password */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Edit profile */}
            <section className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Informações</h2>
              </div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Nome de exibição</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={80}
                placeholder="Seu nome"
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5 mt-4">E-mail</label>
              <input
                value={user.email || ''}
                disabled
                className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed"
              />
              <button
                onClick={handleSaveProfile}
                disabled={!nameChanged || savingProfile}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar alterações
              </button>
            </section>

            {/* Change password */}
            <section className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Segurança</h2>
              </div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Nova senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-3 py-2.5 pr-10 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">Mínimo de 6 caracteres.</p>
              <button
                onClick={handleChangePassword}
                disabled={newPass.length < 6 || changingPass}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-secondary border border-border text-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Alterar senha
              </button>
            </section>
          </div>

          {/* Recent watchlist */}
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Minha Lista</h2>
              </div>
              <Link to="/minha-lista" className="text-xs font-semibold text-primary hover:text-primary/80">Ver tudo →</Link>
            </div>
            {wlLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
            ) : watchlist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Você ainda não adicionou nada à sua lista.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {watchlist.slice(0, 6).map(item => (
                  <Link
                    key={item.id}
                    to={`/${item.content_type === 'movie' ? 'filme' : 'serie'}/${item.content_id}`}
                    className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-border bg-secondary"
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {item.content_type === 'movie' ? <Film className="h-6 w-6" /> : <Tv className="h-6 w-6" />}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2">
                      <p className="text-[11px] font-semibold text-foreground truncate">{item.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

function StatCard({ icon: Icon, label, value, loading }: { icon: any; label: string; value: number; loading: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
        <p className="text-xl font-display text-foreground leading-tight">
          {loading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : value.toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
}

export default Profile;
