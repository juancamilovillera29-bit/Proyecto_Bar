// ============================================
// Componente: TarjetaPedidoKDS — Tarjeta KDS
// ============================================
import { useState, useEffect } from 'react';
import { Clock, ChevronRight, User } from 'lucide-react';
import { EstadoBadge } from '../comunes/EstadoBadge.jsx';

const TRANSICIONES_ESTADO = {
  recibido:       { siguiente: 'en_preparacion', etiqueta: 'Iniciar preparación' },
  en_preparacion: { siguiente: 'listo',          etiqueta: 'Marcar como listo' },
  listo:          { siguiente: 'entregado',       etiqueta: 'Marcar entregado' },
  entregado:      { siguiente: null,              etiqueta: null },
};

const COLORES_URGENCIA = {
  recibido:       { borde: 'var(--azul-info)',              bg: 'var(--azul-bg)' },
  en_preparacion: { borde: 'var(--amarillo-advertencia)',   bg: 'var(--amarillo-bg)' },
  listo:          { borde: 'var(--verde-exito-claro)',      bg: 'var(--verde-bg)' },
  entregado:      { borde: 'var(--gris-medio)',             bg: 'var(--carbon-oscuro)' },
};

function tiempoTranscurrido(fechaStr) {
  const diff = Math.floor((Date.now() - new Date(fechaStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

export function TarjetaPedidoKDS({ pedido, alCambiarEstado }) {
  const [tiempo, setTiempo] = useState(tiempoTranscurrido(pedido.creado_en));
  const [procesando, setProcesando] = useState(false);
  const colores = COLORES_URGENCIA[pedido.estado] || COLORES_URGENCIA.recibido;
  const transicion = TRANSICIONES_ESTADO[pedido.estado];
  const minutosTranscurridos = Math.floor((Date.now() - new Date(pedido.creado_en).getTime()) / 60000);
  const urgente = minutosTranscurridos > 15 && pedido.estado !== 'entregado';

  useEffect(() => {
    const intervalo = setInterval(() => {
      setTiempo(tiempoTranscurrido(pedido.creado_en));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [pedido.creado_en]);

  async function manejarCambioEstado() {
    if (!transicion?.siguiente || procesando) return;
    setProcesando(true);
    try {
      await alCambiarEstado(pedido.id, transicion.siguiente);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div style={{
      background: 'var(--superficie-1)',
      border: `2px solid ${urgente ? 'var(--rojo-claro)' : colores.borde}`,
      borderRadius: 'var(--radio-xl)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 300ms ease both',
      boxShadow: urgente ? '0 0 20px rgba(230, 57, 70, 0.2)' : 'none',
    }}>
      {/* Encabezado */}
      <div style={{
        background: colores.bg,
        borderBottom: `1px solid ${colores.borde}`,
        padding: '14px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: '1.4rem',
            color: 'var(--texto-primario)',
          }}>
            {pedido.mesa?.nombre || 'Mesa'}
          </div>
          {urgente && (
            <span style={{
              background: 'var(--rojo-bg)', color: 'var(--rojo-claro)',
              border: '1px solid var(--rojo-error)',
              borderRadius: 'var(--radio-full)', fontSize: 'var(--texto-xs)',
              padding: '2px 8px', fontWeight: 600,
              animation: 'pulsar 1.5s ease infinite',
            }}>
              ⚠ URGENTE
            </span>
          )}
        </div>
        <EstadoBadge estado={pedido.estado} />
      </div>

      {/* Ítems del pedido */}
      <div style={{ padding: '14px 16px', flex: 1 }}>
        {pedido.observaciones && (
          <div style={{
            background: 'var(--amarillo-bg)', border: '1px solid var(--amarillo-advertencia)',
            borderRadius: 'var(--radio-md)', padding: '8px 12px', marginBottom: 12,
            fontSize: 'var(--texto-xs)', color: 'var(--amarillo-advertencia)',
          }}>
            📝 {pedido.observaciones}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(pedido.detalles || []).map(detalle => (
            <div key={detalle.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px',
              background: 'var(--superficie-2)',
              borderRadius: 'var(--radio-md)',
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--texto-primario)' }}>
                {detalle.producto?.nombre || 'Producto'}
              </span>
              <span style={{
                fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: '1.3rem',
                color: 'var(--dorado-puro)',
                background: 'var(--dorado-muy-suave)',
                padding: '2px 10px', borderRadius: 'var(--radio-full)',
              }}>
                ×{detalle.cantidad}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pie: tiempo y acción */}
      <div style={{
        borderTop: '1px solid var(--borde-sutil)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: urgente ? 'var(--rojo-claro)' : 'var(--texto-terciario)', fontSize: 'var(--texto-sm)' }}>
          <Clock size={14} />
          <span style={{ fontWeight: urgente ? 700 : 400 }}>{tiempo}</span>
        </div>
        {transicion?.siguiente && (
          <button
            className="btn btn-primario btn-sm"
            onClick={manejarCambioEstado}
            disabled={procesando}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {procesando ? 'Actualizando...' : transicion.etiqueta}
            {!procesando && <ChevronRight size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
