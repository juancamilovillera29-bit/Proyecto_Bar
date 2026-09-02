// ============================================
// Página: MenuCliente — Catálogo con carrito (Mockup UI)
// ============================================
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Clock } from 'lucide-react';
import { TarjetaProducto } from '../../componentes/cliente/TarjetaProducto.jsx';
import { ResumenCarrito } from '../../componentes/cliente/ResumenCarrito.jsx';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { useCarrito } from '../../contextos/ContextoCarrito.jsx';
import { obtenerProductos } from '../../servicios/productos.js';
import { obtenerMesaPorCodigo } from '../../servicios/mesas.js';
import { obtenerCuentaActivaDeMesa, abrirCuenta } from '../../servicios/cuentas.js';

export default function MenuCliente() {
  const { codigoQr } = useParams();
  const { establecerMesa } = useCarrito();
  const [mesa, setMesa]           = useState(null);
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [busqueda, setBusqueda]   = useState('');
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    async function inicializar() {
      try {
        const [mesaDatos, productosDatos] = await Promise.all([
          obtenerMesaPorCodigo(codigoQr),
          obtenerProductos(true),
        ]);
        if (!mesaDatos) { setError('Mesa no encontrada'); setCargando(false); return; }
        setMesa(mesaDatos);
        setProductos(productosDatos || []);

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

  // Obtener lista única de categorías
  const categorias = useMemo(() => {
    const set = new Set();
    productos.forEach(p => {
      if (p.categoria) set.add(p.categoria.trim());
    });
    return ['todos', ...Array.from(set)];
  }, [productos]);

  if (cargando) return <CargandoSpinner mensaje="Cargando menú..." tamano="grande" />;

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#121214', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
        <div style={{ fontFamily: 'var(--fuente-titular, sans-serif)', fontSize: '1.5rem', color: '#ffffff', marginBottom: 8 }}>{error}</div>
        <div style={{ color: '#8f9098', fontSize: '0.9rem' }}>Verifica el código QR de tu mesa</div>
      </div>
    </div>
  );

  const productosFiltrados = productos.filter(p => {
    const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaActiva === 'todos' || (p.categoria && p.categoria.toLowerCase() === categoriaActiva.toLowerCase());
    return coincideTexto && coincideCategoria;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#121214', paddingBottom: 110, color: '#ffffff' }}>
      {/* Encabezado superior */}
      <div style={{
        padding: '18px 20px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: '#121214',
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          fontFamily: 'var(--fuente-titular, sans-serif)',
          fontWeight: 800,
          fontSize: '1.25rem',
          letterSpacing: '0.06em',
          color: '#e5a93c',
        }}>
          BORONDO
        </div>

        <div style={{
          background: '#202025',
          border: '1px solid #2d2d37',
          padding: '6px 16px',
          borderRadius: '24px',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#d4d4d8',
        }}>
          {mesa?.nombre || 'Mesa'}
        </div>
      </div>

      {/* Selector de Categorías (Pills) */}
      <div style={{
        padding: '14px 20px 10px',
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {categorias.map(cat => {
          const activa = categoriaActiva.toLowerCase() === cat.toLowerCase();
          const nombreFormateado = cat === 'todos' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaActiva(cat)}
              style={{
                background: activa ? '#e5a93c' : '#202025',
                color: activa ? '#121214' : '#8f9098',
                border: activa ? 'none' : '1px solid #2c2c36',
                borderRadius: '20px',
                padding: '8px 18px',
                fontSize: '0.88rem',
                fontWeight: activa ? 800 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              {nombreFormateado}
            </button>
          );
        })}
      </div>

      {/* Buscador opcional */}
      <div style={{ padding: '4px 20px 16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#8f9098" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="search"
            placeholder="Buscar bebida o plato..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              background: '#19191d',
              border: '1px solid #282830',
              borderRadius: '14px',
              color: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Lista de productos */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {productosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8f9098' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
            <div>No se encontraron productos disponibles</div>
          </div>
        ) : (
          productosFiltrados.map(producto => (
            <TarjetaProducto key={producto.id} producto={producto} />
          ))
        )}
      </div>

      {/* Botón ver mis pedidos anteriores */}
      <div style={{ padding: '24px 20px 10px' }}>
        <Link
          to={`/mesa/${codigoQr}/seguimiento`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            background: '#1a1a1f',
            border: '1px solid #282832',
            borderRadius: '14px',
            color: '#d49a37',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <Clock size={16} />
          Ver pedidos anteriores de esta mesa
        </Link>
      </div>

      {/* Barra dorada inferior fija de Carrito */}
      <ResumenCarrito mesaCodigoQr={codigoQr} />
    </div>
  );
}


