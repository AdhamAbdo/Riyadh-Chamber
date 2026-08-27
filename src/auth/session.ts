import type { Session, User } from '@/types';
import type { Session as SupabaseSession } from '@supabase/supabase-js';

// Supabase Auth already persists its own session (access/refresh tokens) in
// localStorage under its own key, and handles refresh automatically. This
// module just maps a Supabase auth session + our `profiles` row into the
// app-level `Session` shape the rest of the UI already expects.

export function buildSession(supabaseSession: SupabaseSession, profile: User): Session {
  return {
    userId: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    expiresAt: (supabaseSession.expires_at ?? Math.floor(Date.now() / 1000) + 3600) * 1000,
  };
}
