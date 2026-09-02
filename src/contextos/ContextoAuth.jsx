// ============================================
// Contexto: Autenticación del administrador
// ============================================
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseConfigurado } from '../config/supabase.js';

const ContextoAuth = createContext(null);

// Credenciales demo para modo sin Supabase
const DEMO_USUARIO = { id: 'demo-admin', email: 'admin@borondo.bar', nombre: 'Administrador Demo' };
const DEMO_CLAVE   = 'borondo2024';

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!supabaseConfigurado) {
      // Recuperar sesión demo desde localStorage
      const sesionDemo = localStorage.getItem('borondo_sesion_demo');
      if (sesionDemo) setUsuario(DEMO_USUARIO);
      setCargando(false);
      return;
    }

    // Obtener sesión Supabase inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      setCargando(false);
    });

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function iniciarSesion(email, clave) {
    if (!supabaseConfigurado) {
      // Modo demo: credenciales hardcoded
      if (email === DEMO_USUARIO.email && clave === DEMO_CLAVE) {
        localStorage.setItem('borondo_sesion_demo', 'true');
        setUsuario(DEMO_USUARIO);
        return { usuario: DEMO_USUARIO, error: null };
      }
      return { usuario: null, error: new Error('Credenciales incorrectas') };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: clave });
    return { usuario: data?.user ?? null, error };
  }

  async function cerrarSesion() {
    if (!supabaseConfigurado) {
      localStorage.removeItem('borondo_sesion_demo');
      setUsuario(null);
      return;
    }
    await supabase.auth.signOut();
    setUsuario(null);
  }

  const valor = {
    usuario,
    cargando,
    estaAutenticado: !!usuario,
    modoDemo: !supabaseConfigurado,
    iniciarSesion,
    cerrarSesion,
  };

  return (
    <ContextoAuth.Provider value={valor}>
      {children}
    </ContextoAuth.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(ContextoAuth);
  if (!contexto) throw new Error('useAuth debe usarse dentro de ProveedorAuth');
  return contexto;
}

export default ContextoAuth;
