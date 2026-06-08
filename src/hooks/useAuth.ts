import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Roles run in background; loading only reflects session readiness
    const checkRoles = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
        if (!mounted) return;
        if (error) {
          console.warn('[useAuth] checkRoles error:', error.message);
          return;
        }
        const roles = (data || []).map((r: any) => r.role);
        const banned = roles.includes('banned');
        setIsBanned(banned);
        setIsAdmin(roles.includes('admin') && !banned);
        if (banned) {
          await supabase.auth.signOut();
        }
      } catch (e: any) {
        console.warn('[useAuth] checkRoles exception:', e?.message || e);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) void checkRoles(session.user.id);
    }).catch(() => { if (mounted) setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        void checkRoles(session.user.id);
      } else {
        setIsAdmin(false);
        setIsBanned(false);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    if (data.user) {
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);
      const banned = (rolesData || []).some((r: any) => r.role === 'banned');
      if (banned) {
        await supabase.auth.signOut();
        return { error: { message: 'Sua conta foi banida. Entre em contato com o suporte.' } as any };
      }
    }
    return { error: null };
  }

  async function signUp(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: displayName ?? email.split('@')[0] },
      },
    });
    if (!error && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        display_name: displayName ?? email.split('@')[0],
      } as any, { onConflict: 'id' });
    }
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, session, loading, isAdmin, isBanned, signIn, signUp, signOut };
}
