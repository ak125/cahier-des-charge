import { createClient } from '@supabase/supabase-js';
import { createCookieSessionStorage } from '@remix-run/node';

// Créer une session de cookie pour stocker le token de session Supabase
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb-session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET || 'supabase-remix-secret'],
    secure: process.env.NODE_ENV === 'production',
  },
});

// Créer un client Supabase pour le serveur
export function createServerClient(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL et SUPABASE_ANON_KEY doivent être définis');
  }
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  return client;
}

// Hook pour récupérer et rafraîchir la session
export async function getSession(request: Request) {
  const cookie = request.headers.get('Cookie');
  return sessionStorage.getSession(cookie);
}

// Définir le token de session Supabase dans les cookies
export async function setSupabaseToken(request: Request, response: Response) {
  const session = await getSession(request);
  
  // Obtenir le token d'accès de Supabase
  const supabase = createServerClient(request);
  const { data: { session: supabaseSession } } = await supabase.auth.getSession();
  
  if (supabaseSession) {
    session.set('accessToken', supabaseSession.access_token);
    session.set('refreshToken', supabaseSession.refresh_token);
  } else {
    session.unset('accessToken');
    session.unset('refreshToken');
  }
  
  const cookie = await sessionStorage.commitSession(session);
  response.headers.set('Set-Cookie', cookie);
  
  return response;
}
