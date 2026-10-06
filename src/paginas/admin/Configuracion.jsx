// ============================================
// Página: Configuración
// ============================================
import { useEffect, useState } from 'react';
import { Check, Database, Pencil, Save, Wine, X } from 'lucide-react';
import { supabaseConfigurado } from '../../config/supabase.js';
import { obtenerConfiguracionSistema } from '../../servicios/configuracion.js';
import { obtenerOpcionesMoneda, obtenerOpcionesZonaHoraria, useConfiguracion } from '../../contextos/ContextoConfiguracion.jsx';

const configuracionInicial = {
  nombre: 'BORONDO Bar POS',
  version: '1.0.0',
  moneda: 'MXN',
  idioma: 'es',
  zona_horaria: 'America/Mexico_City',
};

export default function Configuracion() {
  const { configuracion, guardar, idioma, texto } = useConfiguracion();
  const [formulario, setFormulario] = useState(configuracionInicial);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const opcionesMoneda = obtenerOpcionesMoneda(idioma);
  const opcionesZonaHoraria = obtenerOpcionesZonaHoraria();

  useEffect(() => {
    let activa = true;

    async function cargarConfiguracion() {
      setCargando(true);
      setError('');
      try {
        const datos = await obtenerConfiguracionSistema();
        if (activa) {
          setFormulario(datos);
        }
      } catch (err) {
        if (activa) setError(err?.message || 'No se pudo cargar la configuración del sistema.');
      } finally {
        if (activa) setCargando(false);
      }
    }

    cargarConfiguracion();
    return () => { activa = false; };
  }, []);

  function empezarEdicion() {
    setFormulario({ ...configuracion });
    setError('');
    setMensaje('');
    setEditando(true);
  }

  function cancelarEdicion() {
    setFormulario({ ...configuracion });
    setError('');
    setEditando(false);
  }

  async function guardarCambios(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    setMensaje('');

    try {
      const guardada = await guardar(formulario);
      setFormulario(guardada);
      setEditando(false);
      setMensaje('Configuración guardada para todos los administradores.');
    } catch (err) {
      console.error('Error al guardar la configuración del sistema:', err);
      setError(err?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  }

  const campos = [
    { clave: 'nombre', etiqueta: 'Nombre del sistema' },
    { clave: 'version', etiqueta: 'Versión' },
    { clave: 'moneda', etiqueta: texto('Moneda') },
    { clave: 'idioma', etiqueta: texto('Idioma') },
    { clave: 'zona_horaria', etiqueta: texto('Zona horaria') },
  ];

  return (
    <div style={{ padding: 'var(--espacio-8)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-8)', animation: 'fadeIn 300ms ease both' }}>
      <h1 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-3xl)', color: 'var(--texto-primario)' }}>{texto('Configuración')}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
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

        <div className="tarjeta">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wine size={20} color="var(--dorado-puro)" />
              <h3 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-lg)', color: 'var(--texto-primario)' }}>Sistema</h3>
            </div>
            {!editando && (
              <button type="button" className="btn btn-fantasma btn-sm" onClick={empezarEdicion} disabled={cargando}>
                <Pencil size={14} /> Editar
              </button>
            )}
          </div>

          {cargando ? (
            <p style={{ color: 'var(--texto-terciario)', fontSize: 'var(--texto-sm)' }}>Cargando configuración...</p>
          ) : editando ? (
            <form onSubmit={guardarCambios} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {campos.map(campo => (
                <div className="campo" key={campo.clave}>
                  <label htmlFor={`config-${campo.clave}`}>{texto(campo.etiqueta)}</label>
                  {campo.clave === 'idioma' ? (
                    <select id="config-idioma" required value={formulario.idioma}
                      onChange={evento => setFormulario(actual => ({ ...actual, idioma: evento.target.value }))}>
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  ) : campo.clave === 'moneda' ? (
                    <select id="config-moneda" required value={formulario.moneda}
                      onChange={evento => setFormulario(actual => ({ ...actual, moneda: evento.target.value }))}>
                      {opcionesMoneda.map(opcion => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
                    </select>
                  ) : campo.clave === 'zona_horaria' ? (
                    <select id="config-zona_horaria" required value={formulario.zona_horaria}
                      onChange={evento => setFormulario(actual => ({ ...actual, zona_horaria: evento.target.value }))}>
                      {opcionesZonaHoraria.map(zona => (
                        <option key={zona} value={zona}>
                          {zona === 'America/Bogota' ? `${zona} — Colombia` : zona}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`config-${campo.clave}`}
                      type="text"
                      required
                      maxLength={100}
                      value={formulario[campo.clave]}
                      onChange={evento => setFormulario(actual => ({ ...actual, [campo.clave]: evento.target.value }))}
                    />
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn-fantasma btn-sm" onClick={cancelarEdicion} disabled={guardando}>
                  <X size={14} /> Cancelar
                </button>
                <button type="submit" className="btn btn-primario btn-sm" disabled={guardando}>
                  <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {campos.map(campo => (
                <div key={campo.clave} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--borde-sutil)' }}>
                  <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--texto-terciario)' }}>{texto(campo.etiqueta)}</span>
                  <span style={{ fontSize: 'var(--texto-sm)', fontWeight: 600, color: 'var(--texto-primario)', textAlign: 'right', overflowWrap: 'anywhere' }}>{configuracion[campo.clave]}</span>
                </div>
              ))}
            </div>
          )}
          {error && <p role="alert" style={{ color: 'var(--rojo-claro)', fontSize: 'var(--texto-sm)', margin: '12px 0 0' }}>{error}</p>}
          {mensaje && <p role="status" style={{ color: 'var(--verde-exito-claro)', fontSize: 'var(--texto-sm)', margin: '12px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}><Check size={15} />{mensaje}</p>}
        </div>
      </div>
    </div>
  );
}
