// ============================================
// Página: Configuración
// ============================================
import { Settings, Wine, Database, Monitor } from 'lucide-react';
import { supabaseConfigurado } from '../../config/supabase.js';

export default function Configuracion() {
  return (
    <div style={{ padding: 'var(--espacio-8)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-8)', animation: 'fadeIn 300ms ease both' }}>
      <h1 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-3xl)', color: 'var(--texto-primario)' }}>Configuración</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Estado del sistema */}
        <div className="tarjeta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Database size={20} color="var(--dorado-puro)" />
            <h3 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-lg)', color: 'var(--texto-primario)' }}>Base de datos</h3>
          </div>
          <div style={{
            background: supabaseConfigurado ? 'var(--verde-bg)' : 'var(--superficie-2)',
            border: `1px solid ${supabaseConfigurado ? 'var(--verde-exito)' : 'var(--borde-normal)'}`,
            borderRadius: 'var(--radio-md)', padding: 16, marginBottom: 12,
          }}>
            <div style={{ fontWeight: 700, color: supabaseConfigurado ? 'var(--verde-exito-claro)' : 'var(--texto-primario)', marginBottom: 4 }}>
              {supabaseConfigurado ? '✅ Conectado a Supabase' : '⚡ Almacenamiento Local'}
            </div>
            <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-terciario)' }}>
              {supabaseConfigurado
                ? 'Base de datos PostgreSQL en la nube conectada con sincronización en tiempo real.'
                : 'Configura las credenciales en .env para conectar con tu proyecto en la nube de Supabase.'}
            </div>
          </div>
          {!supabaseConfigurado && (
            <div style={{ background: 'var(--superficie-2)', borderRadius: 'var(--radio-md)', padding: 12, fontFamily: 'monospace', fontSize: 'var(--texto-xs)', color: 'var(--dorado-puro)', lineHeight: 1.8 }}>
              <div># Archivo .env</div>
              <div>VITE_SUPABASE_URL=...</div>
              <div>VITE_SUPABASE_ANON_KEY=...</div>
            </div>
          )}
        </div>

        {/* Información del sistema */}
        <div className="tarjeta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Wine size={20} color="var(--dorado-puro)" />
            <h3 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-lg)', color: 'var(--texto-primario)' }}>Sistema</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { etiqueta: 'Nombre del sistema', valor: 'BORONDO Bar POS' },
              { etiqueta: 'Versión', valor: '1.0.0' },
              { etiqueta: 'Moneda', valor: 'MXN (Peso mexicano)' },
              { etiqueta: 'Idioma', valor: 'Español' },
              { etiqueta: 'Zona horaria', valor: 'America/Mexico_City' },
            ].map(item => (
              <div key={item.etiqueta} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--borde-sutil)' }}>
                <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--texto-terciario)' }}>{item.etiqueta}</span>
                <span style={{ fontSize: 'var(--texto-sm)', fontWeight: 600, color: 'var(--texto-primario)' }}>{item.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Accesos directos */}
        <div className="tarjeta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Monitor size={20} color="var(--dorado-puro)" />
            <h3 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-lg)', color: 'var(--texto-primario)' }}>Accesos directos</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="/kds" target="_blank" rel="noreferrer" className="btn btn-secundario" style={{ justifyContent: 'center' }}>
              🍳 Abrir KDS en pantalla completa
            </a>
            <a href="/mesa/mesa-01" target="_blank" rel="noreferrer" className="btn btn-fantasma" style={{ justifyContent: 'center' }}>
              📱 Ver menú del cliente (Mesa 1)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
