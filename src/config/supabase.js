// ============================================
// BORONDO — Cliente Supabase
// Conexión con Supabase y fallback local
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Determina si Supabase está configurado con credenciales válidas
export const supabaseConfigurado = Boolean(
  supabaseUrl &&
  supabaseAnon &&
  supabaseUrl !== 'https://tu-proyecto.supabase.co' &&
  !supabaseUrl.includes('tu-proyecto')
);

// Crea el cliente Supabase
export const supabase = supabaseConfigurado
  ? createClient(supabaseUrl, supabaseAnon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  : null;

export default supabase;
