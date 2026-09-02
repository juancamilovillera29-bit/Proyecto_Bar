// ============================================
// Página: Cierres — Cierres diarios de caja
// ============================================
import { useState, useEffect } from 'react';
import { BookLock, DollarSign, Banknote, CreditCard, ShoppingBag } from 'lucide-react';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { obtenerCierres, realizarCierre } from '../../servicios/cierres.js';

export default function Cierres() {
  const [cierres, setCierres]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cerrando, setCerrando] = useState(false);

  useEffect(() => { cargarCierres(); }, []);

  async function cargarCierres() {
    setCargando(true);
    const datos = await obtenerCierres();
    setCierres(datos);
    setCargando(false);
  }

  async function manejarCierre() {
    if (!window.confirm('¿Confirmas el cierre de caja del día de hoy? Esta acción consolidará todas las ventas del día.')) return;
    setCerrando(true);
    try {
      await realizarCierre();
      await cargarCierres();
    } finally {
      setCerrando(false);
    }
  }

  function formatearMoneda(v) { return `$${Number(v || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`; }

  if (cargando) return <CargandoSpinner mensaje="Cargando cierres..." tamano="grande" />;

  const hoy = new Date().toISOString().split('T')[0];
  const yaHayCierreHoy = cierres.some(c => c.fecha === hoy);

  return (
    <div style={{ padding: 'var(--espacio-8)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-6)', animation: 'fadeIn 300ms ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-3xl)', color: 'var(--texto-primario)' }}>Cierres de caja</h1>
          <p style={{ color: 'var(--texto-terciario)', fontSize: 'var(--texto-sm)', marginTop: 4 }}>
            Historial de cierres diarios
          </p>
        </div>
        {!yaHayCierreHoy && (
          <button
            className="btn btn-primario"
            onClick={manejarCierre}
            disabled={cerrando}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <BookLock size={18} />
            {cerrando ? 'Cerrando...' : 'Realizar cierre del día'}
          </button>
        )}
        {yaHayCierreHoy && (
          <div style={{
            background: 'var(--verde-bg)', border: '1px solid var(--verde-exito)',
            borderRadius: 'var(--radio-md)', padding: '10px 16px',
            color: 'var(--verde-exito-claro)', fontSize: 'var(--texto-sm)', fontWeight: 600,
          }}>
            ✅ Cierre de hoy ya realizado
          </div>
        )}
      </div>

      {/* Historial de cierres */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cierres.map(cierre => (
          <div key={cierre.id} className="tarjeta" style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, auto)', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 700, fontSize: 'var(--texto-xl)', color: 'var(--texto-primario)' }}>
                {new Date(cierre.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)', marginTop: 2 }}>
                Cerrado a las {new Date(cierre.cerrado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-terciario)' }}>Ventas</div>
              <div style={{ fontWeight: 700, color: 'var(--texto-primario)' }}>{cierre.cantidad_ventas}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-terciario)' }}>Efectivo</div>
              <div style={{ fontWeight: 700, color: 'var(--verde-exito-claro)', fontFamily: 'var(--fuente-titular)' }}>
                {formatearMoneda(cierre.total_efectivo)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-terciario)' }}>Transferencias</div>
              <div style={{ fontWeight: 700, color: 'var(--azul-info)', fontFamily: 'var(--fuente-titular)' }}>
                {formatearMoneda(cierre.total_transferencias)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-terciario)' }}>Total del día</div>
              <div style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: 'var(--texto-2xl)', color: 'var(--dorado-puro)' }}>
                {formatearMoneda(cierre.total_ventas)}
              </div>
            </div>
          </div>
        ))}
        {cierres.length === 0 && (
          <div className="estado-vacio">
            <BookLock size={40} className="estado-vacio-icono" />
            <div className="estado-vacio-titulo">No hay cierres registrados</div>
            <div className="estado-vacio-descripcion">Realiza el primer cierre del día cuando termines la jornada</div>
          </div>
        )}
      </div>
    </div>
  );
}
