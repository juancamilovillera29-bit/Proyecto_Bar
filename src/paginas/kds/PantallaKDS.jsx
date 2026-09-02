// ============================================
// Página: PantallaKDS — Kitchen Display System
// Pantalla de cocina en tiempo real con alertas
// ============================================
import { useState, useEffect, useRef } from 'react';
import { ChefHat, RefreshCw, Wine, Monitor, Bell } from 'lucide-react';
import { TarjetaPedidoKDS } from '../../componentes/kds/TarjetaPedidoKDS.jsx';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { ProveedorPedidos, usePedidos } from '../../contextos/ContextoPedidos.jsx';
import { sonarNuevoPedido } from '../../servicios/notificaciones.js';

const FILTROS_ESTADO = [
  { valor: 'activos',        etiqueta: 'Activos',          color: 'var(--texto-primario)' },
  { valor: 'recibido',       etiqueta: 'Recibidos',        color: 'var(--azul-info)' },
  { valor: 'en_preparacion', etiqueta: 'En preparación',   color: 'var(--amarillo-advertencia)' },
  { valor: 'listo',          etiqueta: 'Listos',           color: 'var(--verde-exito-claro)' },
];

function ContenidoKDS({ modoAdmin }) {
  const { pedidosActivos, pedidosPendientes, pedidosEnCocina, pedidosListos, cargando, cargarPedidos, cambiarEstadoPedido } = usePedidos();
  const [filtro, setFiltro] = useState('activos');
  const [flashNuevoPedido, setFlashNuevoPedido] = useState(false);
  const pedidosKnownRef = useRef(new Set());
  const interactuoRef = useRef(false);

  // Marcar interacción del usuario para desbloquear audio
  useEffect(() => {
    function marcarInteraccion() { interactuoRef.current = true; }
    window.addEventListener('click', marcarInteraccion, { once: true });
    window.addEventListener('keydown', marcarInteraccion, { once: true });
    return () => {
      window.removeEventListener('click', marcarInteraccion);
      window.removeEventListener('keydown', marcarInteraccion);
    };
  }, []);

  // Detectar pedidos nuevos y disparar alerta
  useEffect(() => {
    if (!pedidosActivos || pedidosActivos.length === 0) return;

    let hayNuevo = false;
    for (const p of pedidosActivos) {
      if (!pedidosKnownRef.current.has(p.id)) {
        pedidosKnownRef.current.add(p.id);
        if (pedidosKnownRef.current.size > 1) {
          // Solo disparar si ya teníamos pedidos cargados antes (no en la carga inicial)
          hayNuevo = true;
        }
      }
    }

    if (hayNuevo && interactuoRef.current) {
      sonarNuevoPedido();
      setFlashNuevoPedido(true);
      setTimeout(() => setFlashNuevoPedido(false), 3000);
    }
  }, [pedidosActivos]);

  const pedidosMostrados = {
    activos:        pedidosActivos,
    recibido:       pedidosPendientes,
    en_preparacion: pedidosEnCocina,
    listo:          pedidosListos,
  }[filtro] || pedidosActivos;

  if (cargando) return <CargandoSpinner mensaje="Cargando pedidos..." tamano="grande" />;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--negro-profundo)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Banner de alerta de nuevo pedido */}
      {flashNuevoPedido && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 9000,
          background: 'linear-gradient(90deg, #e5a93c, #f5c842, #e5a93c)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          animation: 'flashBanner 0.4s ease',
          boxShadow: '0 4px 20px rgba(229,169,60,0.6)',
        }}>
          <Bell size={20} color="#121214" />
          <span style={{ fontWeight: 800, color: '#121214', fontSize: '1rem', letterSpacing: '0.05em' }}>
            🆕 ¡NUEVO PEDIDO RECIBIDO!
          </span>
          <Bell size={20} color="#121214" />
        </div>
      )}

      <style>{`
        @keyframes flashBanner {
          0%   { transform: translateY(-100%); opacity: 0; }
          30%  { transform: translateY(0);     opacity: 1; }
          70%  { transform: translateY(0);     opacity: 1; }
          100% { transform: translateY(0);     opacity: 1; }
        }
      `}</style>

      {/* Encabezado KDS */}
      <div style={{
        background: 'var(--negro-base)',
        borderBottom: '1px solid var(--borde-sutil)',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        marginTop: flashNuevoPedido ? 44 : 0,
        transition: 'margin-top 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--dorado-puro), var(--dorado-suave))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wine size={20} color="var(--negro-profundo)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--dorado-puro)', letterSpacing: '0.05em' }}>
              BORONDO <span style={{ color: 'var(--texto-terciario)', fontWeight: 400 }}>KDS</span>
            </div>
            <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)', letterSpacing: '0.08em' }}>
              KITCHEN DISPLAY SYSTEM
            </div>
          </div>
        </div>

        {/* Filtros por estado */}
        <div style={{ display: 'flex', gap: 8 }}>
          {FILTROS_ESTADO.map(f => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radio-full)',
                border: `1px solid ${f.valor === filtro ? f.color : 'var(--borde-normal)'}`,
                background: f.valor === filtro ? `${f.color}22` : 'transparent',
                color: f.valor === filtro ? f.color : 'var(--texto-terciario)',
                fontSize: 'var(--texto-sm)', fontWeight: f.valor === filtro ? 700 : 400,
                cursor: 'pointer', transition: 'all var(--transicion-rapida)',
              }}
            >
              {f.etiqueta}
              <span style={{
                marginLeft: 6,
                background: f.valor === filtro ? f.color : 'var(--superficie-3)',
                color: f.valor === filtro ? 'var(--negro-profundo)' : 'var(--texto-terciario)',
                borderRadius: 'var(--radio-full)',
                fontSize: 'var(--texto-xs)',
                padding: '1px 7px',
                fontWeight: 700,
              }}>
                {({
                  activos:        pedidosActivos,
                  recibido:       pedidosPendientes,
                  en_preparacion: pedidosEnCocina,
                  listo:          pedidosListos,
                }[f.valor] || []).length}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)' }}>
            {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <button
            onClick={cargarPedidos}
            style={{
              background: 'var(--superficie-3)', border: '1px solid var(--borde-normal)',
              borderRadius: 'var(--radio-md)', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--texto-terciario)', cursor: 'pointer',
              transition: 'all var(--transicion-rapida)',
            }}
            title="Actualizar"
          >
            <RefreshCw size={16} />
          </button>
          {!modoAdmin && (
            <a
              href="/admin/dashboard"
              style={{
                padding: '6px 12px', borderRadius: 'var(--radio-md)',
                background: 'var(--dorado-muy-suave)', border: '1px solid var(--dorado-opaco)',
                color: 'var(--dorado-puro)', fontSize: 'var(--texto-xs)', fontWeight: 600,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <Monitor size={12} /> Admin
            </a>
          )}
        </div>
      </div>

      {/* Grid de pedidos */}
      <div style={{
        flex: 1, padding: '20px',
        display: pedidosMostrados.length > 0 ? 'grid' : 'flex',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
        alignContent: 'start',
        overflowY: 'auto',
        alignItems: pedidosMostrados.length === 0 ? 'center' : undefined,
        justifyContent: pedidosMostrados.length === 0 ? 'center' : undefined,
      }}>
        {pedidosMostrados.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--texto-muted)' }}>
            <ChefHat size={60} style={{ marginBottom: 20, opacity: 0.3 }} />
            <div style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-2xl)', fontWeight: 700, marginBottom: 8 }}>
              No hay pedidos {filtro !== 'activos' ? `en estado "${filtro.replace('_', ' ')}"` : 'activos'}
            </div>
            <div style={{ fontSize: 'var(--texto-sm)' }}>Los pedidos aparecerán aquí en tiempo real</div>
          </div>
        ) : (
          pedidosMostrados.map(pedido => (
            <TarjetaPedidoKDS
              key={pedido.id}
              pedido={pedido}
              alCambiarEstado={cambiarEstadoPedido}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function PantallaKDS({ modoAdmin = false }) {
  return (
    <ProveedorPedidos>
      <ContenidoKDS modoAdmin={modoAdmin} />
    </ProveedorPedidos>
  );
}

