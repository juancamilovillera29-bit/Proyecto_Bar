// ============================================
// Página: PantallaKDS — Kitchen Display System
// Pantalla de cocina en tiempo real
// ============================================
import { useState } from 'react';
import { ChefHat, RefreshCw, Wine, Monitor } from 'lucide-react';
import { TarjetaPedidoKDS } from '../../componentes/kds/TarjetaPedidoKDS.jsx';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { ProveedorPedidos, usePedidos } from '../../contextos/ContextoPedidos.jsx';

const FILTROS_ESTADO = [
  { valor: 'activos',        etiqueta: 'Activos',          color: 'var(--texto-primario)' },
  { valor: 'recibido',       etiqueta: 'Recibidos',        color: 'var(--azul-info)' },
  { valor: 'en_preparacion', etiqueta: 'En preparación',   color: 'var(--amarillo-advertencia)' },
  { valor: 'listo',          etiqueta: 'Listos',           color: 'var(--verde-exito-claro)' },
];

function ContenidoKDS({ modoAdmin }) {
  const { pedidosActivos, pedidosPendientes, pedidosEnCocina, pedidosListos, cargando, cargarPedidos, cambiarEstadoPedido } = usePedidos();
  const [filtro, setFiltro] = useState('activos');

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
      {/* Encabezado KDS */}
      <div style={{
        background: 'var(--negro-base)',
        borderBottom: '1px solid var(--borde-sutil)',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
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
