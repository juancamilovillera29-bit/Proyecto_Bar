// ============================================
// Componente: TarjetaProducto — Menú del cliente (Diseño Moderno)
// ============================================
import { Plus, Minus, Wine } from 'lucide-react';
import { useCarrito } from '../../contextos/ContextoCarrito.jsx';

export function formatearPrecio(valor) {
  const num = Number(valor) || 0;
  if (num >= 1000) {
    return `$${num.toLocaleString('es-CO')}`;
  }
  return `$${num.toLocaleString('es-CO', { minimumFractionDigits: num % 1 !== 0 ? 2 : 0 })}`;
}

export function TarjetaProducto({ producto }) {
  const { articulos, agregarArticulo, quitarArticulo } = useCarrito();
  const enCarrito = articulos.find(a => a.producto.id === producto.id);
  const cantidad = enCarrito?.cantidad || 0;

  return (
    <div style={{
      background: '#19191d',
      borderRadius: '18px',
      padding: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      border: cantidad > 0 ? '1px solid #d49a37' : '1px solid #27272e',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
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

        {producto.descripcion && (
          <p style={{
            fontSize: '0.8rem',
            color: '#8f9098',
            margin: '3px 0 6px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {producto.descripcion}
          </p>
        )}

        <div style={{
          fontFamily: 'var(--fuente-titular, sans-serif)',
          fontWeight: 800,
          fontSize: '1rem',
          color: '#e5a93c',
        }}>
          {formatearPrecio(producto.precio_venta)}
        </div>
      </div>

      {/* Botones de acción / Stepper */}
      {cantidad === 0 ? (
        <button
          type="button"
          onClick={() => agregarArticulo(producto)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#e5a93c',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#121214',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(229, 169, 60, 0.3)',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
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
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#e5a93c',
              border: 'none',
              color: '#121214',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

