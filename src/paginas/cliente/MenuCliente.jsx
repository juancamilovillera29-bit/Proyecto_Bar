// ============================================
// Página: MenuCliente — Catálogo con carrito
// Acceso por código QR de la mesa
// ============================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Wine, ArrowLeft } from 'lucide-react';
import { TarjetaProducto } from '../../componentes/cliente/TarjetaProducto.jsx';
import { ResumenCarrito } from '../../componentes/cliente/ResumenCarrito.jsx';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { ProveedorCarrito, useCarrito } from '../../contextos/ContextoCarrito.jsx';
import { obtenerProductos } from '../../servicios/productos.js';
import { obtenerMesaPorCodigo } from '../../servicios/mesas.js';
import { obtenerCuentaActivaDeMesa, abrirCuenta } from '../../servicios/cuentas.js';

export default function MenuCliente() {
  const { codigoQr } = useParams();
  const { establecerMesa } = useCarrito();
  const [mesa, setMesa]         = useState(null);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    async function inicializar() {
      try {
        const [mesaDatos, productosDatos] = await Promise.all([
          obtenerMesaPorCodigo(codigoQr),
          obtenerProductos(true),
        ]);
        if (!mesaDatos) { setError('Mesa no encontrada'); setCargando(false); return; }
        setMesa(mesaDatos);
        setProductos(productosDatos);

        // Obtener o crear cuenta de la mesa
        let cuenta = await obtenerCuentaActivaDeMesa(mesaDatos.id);
        if (!cuenta) cuenta = await abrirCuenta(mesaDatos.id);
        establecerMesa(mesaDatos.id, cuenta?.id || null);
      } catch (e) {
        setError('Error al cargar el menú');
      } finally {
        setCargando(false);
      }
    }
    inicializar();
  }, [codigoQr]);

  if (cargando) return <CargandoSpinner mensaje="Cargando menú..." tamano="grande" />;

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--negro-profundo)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
        <div style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-2xl)', color: 'var(--texto-primario)', marginBottom: 8 }}>{error}</div>
        <div style={{ color: 'var(--texto-terciario)', fontSize: 'var(--texto-sm)' }}>Verifica el código QR de tu mesa</div>
      </div>
    </div>
  );

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--negro-base)', paddingBottom: 120 }}>
      {/* Encabezado */}
      <div style={{
        background: 'var(--negro-profundo)',
        borderBottom: '1px solid var(--borde-sutil)',
        padding: '20px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--dorado-puro), var(--dorado-suave))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wine size={20} color="var(--negro-profundo)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--dorado-puro)' }}>
              BORONDO
            </div>
            <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)' }}>{mesa?.nombre}</div>
          </div>
        </div>

        {/* Buscador */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-muted)' }} />
          <input
            type="search"
            placeholder="Buscar en el menú..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ paddingLeft: 40, background: 'var(--superficie-2)' }}
          />
        </div>
      </div>

      {/* Catálogo de productos */}
      <div style={{ padding: '20px' }}>
        <h2 style={{
          fontFamily: 'var(--fuente-titular)', fontWeight: 700,
          fontSize: 'var(--texto-xl)', color: 'var(--dorado-puro)',
          marginBottom: 16, letterSpacing: '0.05em',
        }}>
          Nuestro menú
        </h2>

        {productosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--texto-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
            <div>No se encontraron productos para "{busqueda}"</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {productosFiltrados.map(producto => (
              <TarjetaProducto key={producto.id} producto={producto} />
            ))}
          </div>
        )}
      </div>

      {/* Ver mis pedidos */}
      <div style={{ padding: '0 20px' }}>
        <hr className="separador-dorado" />
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`/mesa/${codigoQr}/seguimiento`}
            style={{
              flex: 1, padding: '12px', borderRadius: 'var(--radio-lg)',
              background: 'var(--superficie-2)', border: '1px solid var(--borde-normal)',
              color: 'var(--texto-secundario)', textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 'var(--texto-sm)', fontWeight: 500,
            }}
          >
            Ver mis pedidos →
          </a>
        </div>
      </div>

      {/* Carrito flotante */}
      <ResumenCarrito mesaCodigoQr={codigoQr} />
    </div>
  );
}

