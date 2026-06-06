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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) void checkRoles(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) void checkRoles(session.user.id);
      else {
        setIsAdmin(false);
        setIsBanned(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkRoles(userId: string) {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    const roles = (data || []).map((r: any) => r.role);
    const banned = roles.includes('banned');
    setIsBanned(banned);
    setIsAdmin(roles.includes('admin') && !banned);
    if (banned) {
      // force sign out if user is banned
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    }
    setLoading(false);
  }

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
