// ============================================
// Página: Productos — CRUD de productos
// ============================================
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import { Modal } from '../../componentes/comunes/Modal.jsx';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto, toggleActivoProducto } from '../../servicios/productos.js';
import { subirImagenProducto } from '../../servicios/imagenes.js';

const productoVacio = { nombre: '', descripcion: '', precio_venta: '', costo: '', stock: '', stock_minimo: 5, imagen_url: '', activo: true };

export default function Productos() {
  const [productos, setProductos]   = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [busqueda, setBusqueda]     = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [formulario, setFormulario] = useState(productoVacio);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [vistaPreviaArchivo, setVistaPreviaArchivo] = useState('');
  const [guardando, setGuardando]   = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');

  useEffect(() => {
    if (!imagenArchivo) {
      setVistaPreviaArchivo('');
      return undefined;
    }
    const vistaPrevia = URL.createObjectURL(imagenArchivo);
    setVistaPreviaArchivo(vistaPrevia);
    return () => URL.revokeObjectURL(vistaPrevia);
  }, [imagenArchivo]);

  useEffect(() => {
    cargarProductos();
    const intervalo = setInterval(() => {
      cargarProductos(true);
    }, 4000);
    return () => clearInterval(intervalo);
  }, []);

  async function cargarProductos(esRecarga = false) {
    if (!esRecarga) setCargando(true);
    try {
      const datos = await obtenerProductos();
      setProductos(datos || []);
    } finally {
      if (!esRecarga) setCargando(false);
    }
  }

  function abrirModal(producto = null) {
    setProductoEditando(producto);
    setImagenArchivo(null);
    setFormulario(producto ? {
      nombre: producto.nombre ?? '',
      descripcion: producto.descripcion ?? '',
      precio_venta: producto.precio_venta ?? '',
      costo: producto.costo ?? '',
      stock: producto.stock ?? 0,
      stock_minimo: producto.stock_minimo ?? 5,
      imagen_url: producto.imagen_url ?? '',
      activo: producto.activo ?? true,
    } : productoVacio);
    setErrorGuardado('');
    setModalAbierto(true);
  }

  function manejarSeleccionImagen(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setImagenArchivo(archivo);
    setFormulario(f => ({ ...f, imagen_url: '' }));
    setErrorGuardado('');
  }

  async function guardarProducto(e) {
    e.preventDefault();
    setGuardando(true);
    setErrorGuardado('');
    try {
      const datos = {
        ...formulario,
        precio_venta: parseFloat(formulario.precio_venta || 0),
        costo: parseFloat(formulario.costo || 0),
        stock: parseInt(formulario.stock || 0, 10),
        stock_minimo: parseInt(formulario.stock_minimo || 5, 10),
      };
      if (imagenArchivo) {
        datos.imagen_url = await subirImagenProducto(imagenArchivo);
      }
      if (productoEditando) {
        await actualizarProducto(productoEditando.id, datos);
      } else {
        await crearProducto(datos);
      }
      await cargarProductos();
      setImagenArchivo(null);
      setModalAbierto(false);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setErrorGuardado(error?.message || 'No se pudieron guardar los cambios del producto.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(id) {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    await eliminarProducto(id);
    await cargarProductos();
  }

  async function manejarToggle(producto) {
    await toggleActivoProducto(producto.id, !producto.activo);
    await cargarProductos();
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return <CargandoSpinner mensaje="Cargando productos..." tamano="grande" />;

  return (
    <div style={{ padding: 'var(--espacio-8)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-6)', animation: 'fadeIn 300ms ease both' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-3xl)', color: 'var(--texto-primario)' }}>
            Productos
          </h1>
          <p style={{ color: 'var(--texto-terciario)', fontSize: 'var(--texto-sm)', marginTop: 4 }}>
            {productos.length} productos registrados
          </p>
        </div>
        <button className="btn btn-primario" onClick={() => abrirModal()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Nuevo producto
        </button>
      </div>

      {/* Búsqueda */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-muted)' }} />
        <input
          type="search"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* Tabla de productos */}
      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio venta</th>
              <th>Costo</th>
              <th>Stock</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map(producto => (
              <tr key={producto.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radio-md)',
                      background: 'var(--superficie-2)', overflow: 'hidden', flexShrink: 0,
                    }}>
                      {producto.imagen_url ? (
                        <img src={producto.imagen_url} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🍹</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--texto-primario)', fontSize: 'var(--texto-sm)' }}>{producto.nombre}</div>
                      {producto.descripcion && (
                        <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {producto.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--dorado-puro)', fontWeight: 700, fontFamily: 'var(--fuente-titular)' }}>
                  ${Number(producto.precio_venta).toFixed(2)}
                </td>
                <td>${Number(producto.costo).toFixed(2)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontWeight: 700,
                      color: producto.stock <= 0 ? 'var(--rojo-error)' : producto.stock <= producto.stock_minimo ? 'var(--amarillo-advertencia)' : 'var(--texto-primario)',
                    }}>
                      {producto.stock}
                    </span>
                    <span style={{ color: 'var(--texto-muted)', fontSize: 'var(--texto-xs)' }}> / {producto.stock_minimo} mín.</span>
                    {producto.stock <= 0 && (
                      <span style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '6px',
                      }}>
                        Agotado
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => manejarToggle(producto)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: producto.activo ? 'var(--verde-exito-claro)' : 'var(--texto-muted)', fontSize: 'var(--texto-xs)', fontWeight: 600 }}
                  >
                    {producto.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-fantasma btn-sm"
                      onClick={() => abrirModal(producto)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-peligro btn-sm"
                      onClick={() => manejarEliminar(producto.id)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productosFiltrados.length === 0 && (
          <div className="estado-vacio">
            <Package size={40} className="estado-vacio-icono" />
            <div className="estado-vacio-titulo">No se encontraron productos</div>
            <div className="estado-vacio-descripcion">Agrega tu primer producto con el botón "Nuevo producto"</div>
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={productoEditando ? 'Editar producto' : 'Nuevo producto'}>
        <form onSubmit={guardarProducto} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {errorGuardado && (
            <div role="alert" style={{ color: 'var(--rojo-claro)', background: 'var(--rojo-bg)', border: '1px solid var(--rojo-error)', borderRadius: 'var(--radio-md)', padding: '10px 12px', fontSize: 'var(--texto-sm)' }}>
              {errorGuardado}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="campo" style={{ gridColumn: '1 / -1' }}>
              <label>Nombre <span className="requerido">*</span></label>
              <input type="text" required value={formulario.nombre} onChange={e => setFormulario(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del producto" />
            </div>
            <div className="campo" style={{ gridColumn: '1 / -1' }}>
              <label>Descripción</label>
              <textarea value={formulario.descripcion || ''} onChange={e => setFormulario(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción breve del producto" rows={2} />
            </div>
            <div className="campo">
              <label>Precio de venta <span className="requerido">*</span></label>
              <input type="number" required min="0" step="0.01" value={formulario.precio_venta} onChange={e => setFormulario(f => ({ ...f, precio_venta: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="campo">
              <label>Costo <span className="requerido">*</span></label>
              <input type="number" required min="0" step="0.01" value={formulario.costo} onChange={e => setFormulario(f => ({ ...f, costo: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="campo">
              <label>Stock inicial</label>
              <input type="number" min="0" value={formulario.stock} onChange={e => setFormulario(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
            </div>
            <div className="campo">
              <label>Stock mínimo</label>
              <input type="number" min="0" value={formulario.stock_minimo} onChange={e => setFormulario(f => ({ ...f, stock_minimo: e.target.value }))} placeholder="5" />
            </div>
            <div className="campo" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="imagen-producto">Imagen del producto</label>
              <input
                id="imagen-producto"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={manejarSeleccionImagen}
                disabled={guardando}
              />
              <small style={{ color: 'var(--texto-terciario)' }}>JPG, PNG o WebP, máximo 5 MB.</small>
              {(vistaPreviaArchivo || formulario.imagen_url) && (
                <img
                  src={vistaPreviaArchivo || formulario.imagen_url}
                  alt="Vista previa del producto"
                  style={{ display: 'block', width: 120, height: 120, objectFit: 'cover', borderRadius: 'var(--radio-md)', marginTop: 10 }}
                />
              )}
              <label htmlFor="url-imagen-producto" style={{ marginTop: 12 }}>O pega una URL de imagen</label>
              <input
                id="url-imagen-producto"
                type="url"
                value={formulario.imagen_url || ''}
                onChange={e => {
                  setImagenArchivo(null);
                  setFormulario(f => ({ ...f, imagen_url: e.target.value }));
                }}
                placeholder="https://..."
                disabled={guardando}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-fantasma" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : productoEditando ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
