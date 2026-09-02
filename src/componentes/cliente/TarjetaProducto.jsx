// ============================================
// Componente: TarjetaProducto — Menú del cliente
// ============================================
import { Plus, Minus } from 'lucide-react';
import { useCarrito } from '../../contextos/ContextoCarrito.jsx';

export function TarjetaProducto({ producto }) {
  const { articulos, agregarArticulo, quitarArticulo } = useCarrito();
  const enCarrito = articulos.find(a => a.producto.id === producto.id);
  const cantidad = enCarrito?.cantidad || 0;

  return (
    <div style={{
      background: 'var(--superficie-1)',
      border: `1px solid ${cantidad > 0 ? 'var(--dorado-opaco)' : 'var(--borde-sutil)'}`,
      borderRadius: 'var(--radio-xl)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all var(--transicion-normal)',
      boxShadow: cantidad > 0 ? 'var(--sombra-dorada)' : 'none',
    }}>
      {/* Imagen */}
      <div style={{ position: 'relative', paddingTop: '60%', background: 'var(--carbon-medio)', flexShrink: 0 }}>
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
            🍹
          </div>
        )}
        {cantidad > 0 && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'var(--dorado-puro)', color: 'var(--negro-profundo)',
            borderRadius: '50%', width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 'var(--texto-xs)',
            fontFamily: 'var(--fuente-titular)',
          }}>
            {cantidad}
          </div>
        )}
      </div>

      {/* Información */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 700, fontSize: 'var(--texto-base)', color: 'var(--texto-primario)', lineHeight: 1.2 }}>
            {producto.nombre}
          </div>
          {producto.descripcion && (
            <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-terciario)', marginTop: 4, lineHeight: 1.4 }}>
              {producto.descripcion}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <div style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: 'var(--texto-xl)', color: 'var(--dorado-puro)' }}>
            ${producto.precio_venta.toFixed(2)}
          </div>

          {/* Control de cantidad */}
          {cantidad === 0 ? (
            <button
              className="btn btn-primario btn-sm"
              onClick={() => agregarArticulo(producto)}
              style={{ borderRadius: 'var(--radio-full)', minWidth: 36, height: 36, padding: 0 }}
            >
              <Plus size={18} />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => quitarArticulo(producto.id)}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--superficie-3)', border: '1px solid var(--borde-normal)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--texto-secundario)', cursor: 'pointer',
                  transition: 'all var(--transicion-rapida)',
                }}
              >
                <Minus size={14} />
              </button>
              <span style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: 'var(--texto-lg)', color: 'var(--dorado-puro)', minWidth: 24, textAlign: 'center' }}>
                {cantidad}
              </span>
              <button
                onClick={() => agregarArticulo(producto)}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--dorado-puro), var(--dorado-suave))',
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--negro-profundo)', cursor: 'pointer',
                  transition: 'all var(--transicion-rapida)',
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
