// ============================================
// Componente: TarjetaProducto — Menú del cliente (Diseño Moderno)
// ============================================
import { Plus, Minus, Wine } from 'lucide-react';
import { useCarrito } from '../../contextos/ContextoCarrito.jsx';
import { formatearImporte } from '../../contextos/ContextoConfiguracion.jsx';
import { obtenerConfiguracionActiva } from '../../servicios/configuracion.js';

export function formatearPrecio(valor) {
  return formatearImporte(valor, obtenerConfiguracionActiva());
}

export function TarjetaProducto({ producto }) {
  const { articulos, agregarArticulo, quitarArticulo } = useCarrito();
  const enCarrito = articulos.find(a => a.producto.id === producto.id);
  const cantidad = enCarrito?.cantidad || 0;
  
  const stockDisponible = typeof producto.stock === 'number' ? producto.stock : parseInt(producto.stock ?? '0', 10);
  const agotado = stockDisponible <= 0;
  const sinMasStock = cantidad >= stockDisponible;
  const stockMinimo = producto.stock_minimo || 5;
  const pocosDisponibles = !agotado && stockDisponible <= stockMinimo;

  return (
    <div style={{
      background: '#19191d',
      borderRadius: '18px',
      padding: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      border: agotado ? '1px solid rgba(239, 68, 68, 0.2)' : cantidad > 0 ? '1px solid #d49a37' : '1px solid #27272e',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      opacity: agotado ? 0.75 : 1,
      transition: 'all 0.2s ease',
    }}>
      {/* Imagen / Miniatura */}
      <div style={{
        width: '68px',
        height: '68px',
        borderRadius: '14px',
        background: '#121214',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
      }}>
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Wine size={26} color="#d49a37" style={{ opacity: 0.8 }} />
        )}
      </div>

      {/* Información */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <h3 style={{
            fontFamily: 'var(--fuente-principal, sans-serif)',
            fontWeight: 700,
            fontSize: '1.05rem',
            color: '#ffffff',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {producto.nombre}
          </h3>
          {agotado && (
            <span style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}>
              Agotado
            </span>
          )}
        </div>

        {producto.descripcion && (
          <p style={{
            fontSize: '0.8rem',
            color: '#8f9098',
            margin: '3px 0 4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {producto.descripcion}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{
            fontFamily: 'var(--fuente-titular, sans-serif)',
            fontWeight: 800,
            fontSize: '1rem',
            color: '#e5a93c',
          }}>
            {formatearPrecio(producto.precio_venta)}
          </div>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: agotado ? '#f87171' : pocosDisponibles ? '#f59e0b' : '#9ca3af',
          }}>
            {agotado ? 'Sin stock' : `${stockDisponible} disp.`}
          </span>
        </div>
      </div>

      {/* Botones de acción / Stepper */}
      {agotado ? (
        <button
          type="button"
          disabled
          style={{
            padding: '8px 12px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#71717a',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'not-allowed',
          }}
        >
          Agotado
        </button>
      ) : cantidad === 0 ? (
        <button
          type="button"
          onClick={() => agregarArticulo(producto)}
          disabled={sinMasStock}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: sinMasStock ? '#3f3f46' : '#e5a93c',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: sinMasStock ? '#71717a' : '#121214',
            cursor: sinMasStock ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            boxShadow: sinMasStock ? 'none' : '0 2px 8px rgba(229, 169, 60, 0.3)',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={e => { if (!sinMasStock) e.currentTarget.style.transform = 'scale(0.92)'; }}
          onMouseUp={e => { if (!sinMasStock) e.currentTarget.style.transform = 'scale(1)'; }}
          title={sinMasStock ? 'No hay más stock disponible' : 'Agregar'}
        >
          <Plus size={20} strokeWidth={2.8} />
        </button>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#24242b',
          padding: '4px 8px',
          borderRadius: '24px',
          border: '1px solid #33333d',
        }}>
          <button
            type="button"
            onClick={() => quitarArticulo(producto.id)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#19191d',
              border: 'none',
              color: '#d49a37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <span style={{
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.95rem',
            minWidth: '18px',
            textAlign: 'center',
          }}>
            {cantidad}
          </span>
          <button
            type="button"
            onClick={() => agregarArticulo(producto)}
            disabled={sinMasStock}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: sinMasStock ? '#3f3f46' : '#e5a93c',
              border: 'none',
              color: sinMasStock ? '#71717a' : '#121214',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: sinMasStock ? 'not-allowed' : 'pointer',
              opacity: sinMasStock ? 0.6 : 1,
            }}
            title={sinMasStock ? 'Stock máximo alcanzado' : 'Agregar más'}
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
