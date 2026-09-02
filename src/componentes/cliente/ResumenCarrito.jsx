// ============================================
// Componente: ResumenCarrito — Carrito flotante
// ============================================
import { ShoppingCart, X, Minus, Plus, ArrowRight } from 'lucide-react';
import { useCarrito } from '../../contextos/ContextoCarrito.jsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ResumenCarrito({ mesaCodigoQr }) {
  const { articulos, totalArticulos, subtotal, quitarArticulo, agregarArticulo, carritoVacio } = useCarrito();
  const [abierto, setAbierto] = useState(false);
  const navegar = useNavigate();

  if (carritoVacio && !abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--gris-oscuro)', border: '1px solid var(--borde-normal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--texto-terciario)', cursor: 'pointer',
          boxShadow: 'var(--sombra-md)', zIndex: 500,
        }}
      >
        <ShoppingCart size={22} />
      </button>
    );
  }

  return (
    <>
      {/* Botón flotante con badge */}
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24,
            background: 'linear-gradient(135deg, var(--dorado-puro), var(--dorado-suave))',
            border: 'none', borderRadius: 'var(--radio-full)',
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 10,
            color: 'var(--negro-profundo)', cursor: 'pointer',
            boxShadow: 'var(--sombra-dorada-intensa)', zIndex: 500,
            fontWeight: 700, fontSize: 'var(--texto-base)',
            fontFamily: 'var(--fuente-titular)',
            animation: 'brillar 2s ease infinite',
          }}
        >
          <ShoppingCart size={20} />
          <span>{totalArticulos} ítem{totalArticulos !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>${subtotal.toFixed(2)}</span>
        </button>
      )}

      {/* Panel del carrito */}
      {abierto && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--carbon-oscuro)',
          border: '1px solid var(--borde-normal)',
          borderTopLeftRadius: 'var(--radio-2xl)',
          borderTopRightRadius: 'var(--radio-2xl)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          zIndex: 600,
          maxHeight: '75vh',
          display: 'flex', flexDirection: 'column',
          animation: 'slideInAbajo 300ms ease both',
        }}>
          {/* Encabezado del carrito */}
          <div style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--borde-sutil)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={20} color="var(--dorado-puro)" />
              <span style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 700, fontSize: 'var(--texto-lg)' }}>
                Tu pedido
              </span>
              <span style={{
                background: 'var(--dorado-muy-suave)', color: 'var(--dorado-puro)',
                borderRadius: 'var(--radio-full)', fontSize: 'var(--texto-xs)', fontWeight: 700,
                padding: '2px 8px', border: '1px solid var(--dorado-opaco)',
              }}>
                {totalArticulos}
              </span>
            </div>
            <button
              onClick={() => setAbierto(false)}
              style={{
                background: 'var(--superficie-3)', border: '1px solid var(--borde-normal)',
                borderRadius: 'var(--radio-md)', width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--texto-terciario)', cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Lista de ítems */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '12px 20px' }}>
            {articulos.map(({ producto, cantidad }) => (
              <div key={producto.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--borde-sutil)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--texto-sm)', color: 'var(--texto-primario)' }}>
                    {producto.nombre}
                  </div>
                  <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--dorado-puro)', marginTop: 2 }}>
                    ${producto.precio_venta.toFixed(2)} c/u
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => quitarArticulo(producto.id)} style={{ background: 'var(--superficie-3)', border: '1px solid var(--borde-normal)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--texto-secundario)', cursor: 'pointer' }}>
                    <Minus size={12} />
                  </button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', fontFamily: 'var(--fuente-titular)', color: 'var(--dorado-puro)' }}>{cantidad}</span>
                  <button onClick={() => agregarArticulo(producto)} style={{ background: 'var(--dorado-muy-suave)', border: '1px solid var(--dorado-opaco)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dorado-puro)', cursor: 'pointer' }}>
                    <Plus size={12} />
                  </button>
                </div>
                <div style={{ fontWeight: 700, fontSize: 'var(--texto-sm)', color: 'var(--texto-primario)', minWidth: 60, textAlign: 'right', fontFamily: 'var(--fuente-titular)' }}>
                  ${(producto.precio_venta * cantidad).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Total y confirmar */}
          <div style={{ padding: '16px 20px 24px', borderTop: '1px solid var(--borde-sutil)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontFamily: 'var(--fuente-titular)' }}>
              <span style={{ fontSize: 'var(--texto-lg)', color: 'var(--texto-secundario)' }}>Total del pedido</span>
              <span style={{ fontSize: 'var(--texto-2xl)', fontWeight: 800, color: 'var(--dorado-puro)' }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <button
              className="btn btn-primario btn-bloque btn-lg"
              onClick={() => { setAbierto(false); navegar(`/mesa/${mesaCodigoQr}/confirmar`); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Confirmar pedido
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Overlay oscuro */}
      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500 }}
        />
      )}
    </>
  );
}
