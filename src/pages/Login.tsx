import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { toast } from 'sonner';

const Login = () => {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executeRecaptcha) { setError('reCAPTCHA não carregou'); return; }
    setError('');
    setLoading(true);
    try {
      await executeRecaptcha(mode);
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) setError(error.message?.includes('banida') ? error.message : 'E-mail ou senha incorretos');
        else navigate('/');
      } else {
        if (password.length < 6) { setError('Senha precisa ter pelo menos 6 caracteres'); setLoading(false); return; }
        const { error } = await signUp(email, password, name);
        if (error) setError(error.message || 'Erro ao criar conta');
        else {
          toast.success('Conta criada! Verifique seu e-mail se necessário.');
          navigate('/');
        }
      }
    } catch {
      setError('Erro no reCAPTCHA');
    }
    setLoading(false);
  }, [executeRecaptcha, signIn, signUp, email, password, name, mode, navigate]);

  const isSignup = mode === 'signup';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Helmet>
        <title>{isSignup ? 'Cadastro' : 'Login'} — PipocaMax</title>
        <meta name="description" content="Acesse ou crie sua conta no PipocaMax." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://pipocamax.com/login" />
      </Helmet>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/favicon.png" alt="PipocaMax" width={32} height={32} className="h-8 w-8 object-contain" />
            <h1 className="font-display text-3xl text-foreground">
              PIPOCA<span className="text-gradient-cinema">MAX</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {isSignup ? 'Crie sua conta gratuita' : 'Faça login na sua conta'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-secondary rounded-lg p-1 mb-4 border border-border">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              !isSignup ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              isSignup ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-2.5 pr-10 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSignup ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {loading ? 'Aguarde...' : isSignup ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
