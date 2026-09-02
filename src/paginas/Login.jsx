// ============================================
// Página: Login — Acceso al panel administrativo
// ============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wine, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../contextos/ContextoAuth.jsx';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail]               = useState('');
  const [clave, setClave]               = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando]         = useState(false);
  const [error, setError]               = useState('');

  async function manejarLogin(e) {
    e.preventDefault();
    setCargando(true);
    setError('');
    const { error: err } = await iniciarSesion(email, clave);
    setCargando(false);
    if (err) {
      setError('Correo o contraseña incorrectos. Verifica tus datos.');
    } else {
      navegar('/admin/dashboard');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--negro-profundo)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--espacio-4)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decoración de fondo */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, left: -100, width: 400, height: 400,
        borderRadius: '50%', background: 'rgba(201,168,76,0.03)',
        border: '1px solid rgba(201,168,76,0.06)',
      }} />
      <div style={{
        position: 'absolute', top: -50, right: -50, width: 300, height: 300,
        borderRadius: '50%', background: 'rgba(201,168,76,0.02)',
        border: '1px solid rgba(201,168,76,0.04)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--dorado-puro), var(--dorado-suave))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(201,168,76,0.3)',
          }}>
            <Wine size={32} color="var(--negro-profundo)" />
          </div>
          <h1 style={{
            fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: '2.2rem',
            color: 'var(--dorado-puro)', letterSpacing: '0.1em', margin: 0,
          }}>
            BORONDO
          </h1>
          <div style={{ color: 'var(--texto-terciario)', fontSize: 'var(--texto-sm)', letterSpacing: '0.3em', marginTop: 4 }}>
            BAR POS
          </div>
        </div>

        {/* Tarjeta de login */}
        <div style={{
          background: 'var(--carbon-oscuro)',
          border: '1px solid var(--borde-normal)',
          borderRadius: 'var(--radio-2xl)',
          padding: '36px',
          boxShadow: 'var(--sombra-lg)',
        }}>
          <h2 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-xl)', marginBottom: 6, color: 'var(--texto-primario)' }}>
            Acceso al sistema
          </h2>
          <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--texto-terciario)', marginBottom: 28 }}>
            Ingresa tus credenciales de administrador
          </p>

          <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="campo">
              <label htmlFor="email-login">Correo electrónico <span className="requerido">*</span></label>
              <input
                id="email-login"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@borondo.bar"
                required
                autoComplete="email"
              />
            </div>

            <div className="campo">
              <label htmlFor="clave-login">Contraseña <span className="requerido">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  id="clave-login"
                  type={mostrarClave ? 'text' : 'password'}
                  value={clave}
                  onChange={e => setClave(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarClave(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--texto-muted)',
                    cursor: 'pointer', padding: 4,
                  }}
                >
                  {mostrarClave ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'var(--rojo-bg)', border: '1px solid var(--rojo-error)',
                borderRadius: 'var(--radio-md)', padding: '10px 14px',
                fontSize: 'var(--texto-sm)', color: 'var(--rojo-claro)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primario btn-bloque"
              disabled={cargando}
              style={{ marginTop: 8, padding: 'var(--espacio-4)', fontSize: 'var(--texto-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {cargando ? (
                <><div className="spinner" style={{ borderTopColor: 'var(--negro-profundo)', borderColor: 'rgba(0,0,0,0.2)' }} /> Ingresando...</>
              ) : (
                <><LogIn size={18} /> Ingresar al sistema</>
              )}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)' }}>
          BORONDO Bar POS © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
