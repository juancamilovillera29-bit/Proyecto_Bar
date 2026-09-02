// ============================================
// Página: Inventario — Control de stock
// ============================================
import { useState, useEffect } from 'react';
import { Plus, Minus, RotateCcw, AlertTriangle, Archive } from 'lucide-react';
import { Modal } from '../../componentes/comunes/Modal.jsx';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { obtenerInventario, obtenerMovimientos, registrarMovimiento } from '../../servicios/inventario.js';
import { obtenerProductos } from '../../servicios/productos.js';

const tiposMovimiento = [
  { valor: 'entrada', etiqueta: 'Entrada (compra)', icono: Plus },
  { valor: 'salida',  etiqueta: 'Salida (uso)',     icono: Minus },
  { valor: 'ajuste',  etiqueta: 'Ajuste manual',    icono: RotateCcw },
];

export default function Inventario() {
  const [inventario, setInventario]   = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos]     = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [formulario, setFormulario]   = useState({ producto_id: '', tipo: 'entrada', cantidad: '', motivo: '' });

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setCargando(true);
    const [inv, mov, prods] = await Promise.all([obtenerInventario(), obtenerMovimientos(), obtenerProductos()]);
    setInventario(inv);
    setMovimientos(mov);
    setProductos(prods);
    setCargando(false);
  }

  async function guardarMovimiento(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await registrarMovimiento({ ...formulario, cantidad: parseInt(formulario.cantidad) });
      await cargarDatos();
      setModalAbierto(false);
      setFormulario({ producto_id: '', tipo: 'entrada', cantidad: '', motivo: '' });
    } finally {
      setGuardando(false);
    }
  }

  const alertas = inventario.filter(i => i.stock_actual <= i.stock_minimo);

  if (cargando) return <CargandoSpinner mensaje="Cargando inventario..." tamano="grande" />;

  return (
    <div style={{ padding: 'var(--espacio-8)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-6)', animation: 'fadeIn 300ms ease both' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-3xl)', color: 'var(--texto-primario)' }}>Inventario</h1>
          <p style={{ color: 'var(--texto-terciario)', fontSize: 'var(--texto-sm)', marginTop: 4 }}>
            {alertas.length > 0 ? `⚠ ${alertas.length} productos con stock bajo` : '✅ Stock en niveles óptimos'}
          </p>
        </div>
        <button className="btn btn-primario" onClick={() => setModalAbierto(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Registrar movimiento
        </button>
      </div>

      {/* Alertas de stock */}
      {alertas.length > 0 && (
        <div style={{ background: 'var(--rojo-bg)', border: '1px solid var(--rojo-error)', borderRadius: 'var(--radio-lg)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--rojo-claro)', fontWeight: 600, fontSize: 'var(--texto-sm)' }}>
            <AlertTriangle size={16} /> Productos con stock bajo
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {alertas.map(a => (
              <span key={a.id} style={{ background: 'var(--rojo-error)', color: 'white', borderRadius: 'var(--radio-full)', padding: '3px 10px', fontSize: 'var(--texto-xs)', fontWeight: 600 }}>
                {a.producto?.nombre}: {a.stock_actual} uds.
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'var(--espacio-6)' }}>
        {/* Tabla de inventario */}
        <div>
          <h2 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-xl)', marginBottom: 16, color: 'var(--dorado-puro)' }}>Stock actual</h2>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock actual</th>
                  <th>Stock mínimo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {inventario.map(item => {
                  const bajo = item.stock_actual <= item.stock_minimo;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: 'var(--texto-primario)' }}>{item.producto?.nombre}</td>
                      <td style={{ fontWeight: 700, color: bajo ? 'var(--rojo-claro)' : 'var(--verde-exito-claro)', fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-lg)' }}>
                        {item.stock_actual}
                      </td>
                      <td style={{ color: 'var(--texto-terciario)' }}>{item.stock_minimo}</td>
                      <td>
                        <span style={{
                          padding: '2px 10px', borderRadius: 'var(--radio-full)', fontSize: 'var(--texto-xs)', fontWeight: 600,
                          background: bajo ? 'var(--rojo-bg)' : 'var(--verde-bg)',
                          color: bajo ? 'var(--rojo-claro)' : 'var(--verde-exito-claro)',
                          border: `1px solid ${bajo ? 'var(--rojo-error)' : 'var(--verde-exito)'}`,
                        }}>
                          {bajo ? 'Stock bajo' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Movimientos recientes */}
        <div>
          <h2 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-xl)', marginBottom: 16, color: 'var(--dorado-puro)' }}>Movimientos recientes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {movimientos.slice(0, 8).map(mov => {
              const colores = { entrada: 'var(--verde-exito-claro)', salida: 'var(--rojo-claro)', ajuste: 'var(--dorado-puro)' };
              const iconos  = { entrada: '↑', salida: '↓', ajuste: '↔' };
              return (
                <div key={mov.id} style={{
                  background: 'var(--superficie-1)', border: '1px solid var(--borde-sutil)',
                  borderRadius: 'var(--radio-md)', padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: colores[mov.tipo], fontWeight: 700 }}>{iconos[mov.tipo]}</span>
                      <span style={{ fontWeight: 600, fontSize: 'var(--texto-sm)', color: 'var(--texto-primario)' }}>
                        {mov.producto?.nombre || 'Producto'}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)', marginTop: 2 }}>
                      {mov.motivo || mov.tipo}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: 'var(--texto-lg)', color: colores[mov.tipo] }}>
                    {mov.tipo === 'salida' ? '-' : '+'}{mov.cantidad}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal registrar movimiento */}
      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo="Registrar movimiento de inventario">
        <form onSubmit={guardarMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="campo">
            <label>Producto <span className="requerido">*</span></label>
            <select required value={formulario.producto_id} onChange={e => setFormulario(f => ({ ...f, producto_id: e.target.value }))}>
              <option value="">Seleccionar producto...</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Tipo de movimiento <span className="requerido">*</span></label>
            <select value={formulario.tipo} onChange={e => setFormulario(f => ({ ...f, tipo: e.target.value }))}>
              {tiposMovimiento.map(t => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Cantidad <span className="requerido">*</span></label>
            <input type="number" required min="1" value={formulario.cantidad} onChange={e => setFormulario(f => ({ ...f, cantidad: e.target.value }))} placeholder="0" />
          </div>
          <div className="campo">
            <label>Motivo</label>
            <input type="text" value={formulario.motivo} onChange={e => setFormulario(f => ({ ...f, motivo: e.target.value }))} placeholder="Ej: Compra semanal, Merma..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-fantasma" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={guardando}>
              {guardando ? 'Registrando...' : 'Registrar movimiento'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
