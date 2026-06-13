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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
  const token = authHeader.slice(7);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Identify caller
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claimsRes, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsRes?.claims?.sub) return json({ error: 'Unauthorized' }, 401);
  const callerId = claimsRes.claims.sub as string;

  const admin = createClient(SUPABASE_URL, SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify caller is admin
  const { data: roleRow } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', callerId)
    .eq('role', 'admin')
    .maybeSingle();
  if (!roleRow) return json({ error: 'Forbidden' }, 403);

  const body = await req.json().catch(() => ({}));
  const targetId = String(body.userId || '');
  if (!targetId) return json({ error: 'userId obrigatório.' }, 400);
  if (targetId === callerId) return json({ error: 'Você não pode excluir sua própria conta.' }, 400);

  const { error: delErr } = await admin.auth.admin.deleteUser(targetId);
  if (delErr) return json({ error: delErr.message }, 400);

  // Best-effort cleanup (cascade should handle most)
  await admin.from('profiles').delete().eq('id', targetId);
  await admin.from('user_roles').delete().eq('user_id', targetId);
  await admin.from('signup_ips').delete().eq('user_id', targetId);

  return json({ ok: true });
});
