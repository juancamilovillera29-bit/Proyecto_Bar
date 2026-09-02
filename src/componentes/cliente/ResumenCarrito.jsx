// ============================================
// Componente: ResumenCarrito — Barra dorada inferior (Mockup UI)
// ============================================
import { ShoppingCart } from 'lucide-react';
import { useCarrito } from '../../contextos/ContextoCarrito.jsx';
import { useNavigate } from 'react-router-dom';
import { formatearPrecio } from './TarjetaProducto.jsx';

export function ResumenCarrito({ mesaCodigoQr }) {
  const { totalArticulos, subtotal, carritoVacio } = useCarrito();
  const navegar = useNavigate();

  if (carritoVacio) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      maxWidth: '480px',
      margin: '0 auto',
      zIndex: 500,
      animation: 'slideInAbajo 0.3s ease both',
    }}>
      <button
        type="button"
        onClick={() => navegar(`/mesa/${mesaCodigoQr}/confirmar`)}
        style={{
          width: '100%',
          background: '#e5a93c',
          border: 'none',
          borderRadius: '16px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#121214',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(229, 169, 60, 0.35)',
          fontFamily: 'var(--fuente-principal, sans-serif)',
          transition: 'transform 0.15s ease',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {/* Izquierda: Icono carrito y Badge contador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={22} color="#121214" strokeWidth={2.4} />
          <span style={{
            background: '#121214',
            color: '#e5a93c',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 800,
          }}>
            {totalArticulos}
          </span>
        </div>

        {/* Centro: Texto principal */}
        <div style={{
          fontWeight: 800,
          fontSize: '1.08rem',
          letterSpacing: '0.02em',
          color: '#121214',
        }}>
          Ver Carrito
        </div>

        {/* Derecha: Total */}
        <div style={{
          fontWeight: 800,
          fontSize: '1.1rem',
          fontFamily: 'var(--fuente-titular, sans-serif)',
          color: '#121214',
        }}>
          {formatearPrecio(subtotal)}
        </div>
      </button>
    </div>
  );
}
