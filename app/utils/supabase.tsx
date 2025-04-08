import { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type SupabaseContextType = {
  supabase: SupabaseClient;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => {
    const supabaseUrl = window.ENV.SUPABASE_URL;
    const supabaseAnonKey = window.ENV.SUPABASE_ANON_KEY;
    
    return createClient(supabaseUrl, supabaseAnonKey);
  });
  
  useEffect(() => {
    // Configurer les listeners d'authentification ici si nécessaire
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Mettre à jour la session si nécessaire
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase doit être utilisé à l\'intérieur d\'un SupabaseProvider');
  }
  return context.supabase;
}
