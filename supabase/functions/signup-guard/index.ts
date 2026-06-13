import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const getIp = (req: Request): string => {
  const xff = req.headers.get('x-forwarded-for') || '';
  const first = xff.split(',')[0]?.trim();
  return (
    first ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const displayName = String(body.displayName || '').trim();
    const honeypot = String(body.website || ''); // hidden field — must stay empty
    const startedAt = Number(body.startedAt || 0);
    const userAgent = req.headers.get('user-agent') || '';

    // Anti-spam: honeypot must be empty
    if (honeypot) return json({ error: 'Spam detectado.' }, 400);

    // Anti-spam: form must take at least 2 seconds to fill
    const elapsed = Date.now() - startedAt;
    if (!startedAt || elapsed < 2000) {
      return json({ error: 'Aguarde alguns segundos antes de enviar.' }, 400);
    }

    // Basic validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'E-mail inválido.' }, 400);
    }
    if (password.length < 6) {
      return json({ error: 'Senha precisa ter pelo menos 6 caracteres.' }, 400);
    }
    if (displayName.length > 80) {
      return json({ error: 'Nome muito longo.' }, 400);
    }

    const ip = getIp(req);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1 conta por IP — only block "real" IPs
    if (ip && ip !== 'unknown' && !ip.startsWith('127.') && !ip.startsWith('::1')) {
      const { data: existing, error: ipErr } = await supabase
        .from('signup_ips')
        .select('id')
        .eq('ip', ip)
        .limit(1)
        .maybeSingle();
      if (ipErr) console.warn('[signup-guard] ip check error', ipErr.message);
      if (existing) {
        return json(
          { error: 'Já existe uma conta cadastrada a partir deste dispositivo/rede.' },
          429
        );
      }
    }

    // Create user
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName || email.split('@')[0] },
    });

    if (createErr || !created.user) {
      const msg = createErr?.message || 'Erro ao criar conta.';
      const friendly = /registered|exists/i.test(msg)
        ? 'Este e-mail já está cadastrado.'
        : msg;
      return json({ error: friendly }, 400);
    }

    // Record IP
    await supabase.from('signup_ips').insert({
      user_id: created.user.id,
      ip,
      user_agent: userAgent.slice(0, 500),
    });

    return json({ ok: true, userId: created.user.id });
  } catch (e: any) {
    console.error('[signup-guard]', e);
    return json({ error: e?.message || 'Erro interno.' }, 500);
  }
});
