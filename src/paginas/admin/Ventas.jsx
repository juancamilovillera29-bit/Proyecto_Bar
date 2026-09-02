// ============================================
// Página: Ventas — Historial y análisis
// ============================================
import { useState, useEffect } from 'react';
import { BarChart3, DollarSign, CreditCard, Banknote } from 'lucide-react';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { EstadoBadge } from '../../componentes/comunes/EstadoBadge.jsx';
import { TarjetaStat } from '../../componentes/comunes/TarjetaStat.jsx';
import { obtenerVentas, obtenerResumenVentasHoy } from '../../servicios/ventas.js';

export default function Ventas() {
  const [ventas, setVentas]         = useState([]);
  const [resumen, setResumen]       = useState(null);
  const [cargando, setCargando]     = useState(true);
  const [filtroFecha, setFiltroFecha] = useState('hoy');

  useEffect(() => { cargarDatos(); }, [filtroFecha]);

  async function cargarDatos() {
    setCargando(true);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let fechaInicio = hoy.toISOString();

    if (filtroFecha === 'semana') {
      const semana = new Date(hoy);
      semana.setDate(semana.getDate() - 7);
      fechaInicio = semana.toISOString();
    } else if (filtroFecha === 'mes') {
      const mes = new Date(hoy);
      mes.setDate(1);
      fechaInicio = mes.toISOString();
    }

    const [ventasDatos, resumenHoy] = await Promise.all([
      obtenerVentas({ fecha_inicio: fechaInicio }),
      obtenerResumenVentasHoy(),
    ]);
    setVentas(ventasDatos);
    setResumen(resumenHoy);
    setCargando(false);
  }

  function formatearMoneda(v) { return `$${Number(v || 0).toFixed(2)}`; }
  function formatearFecha(s) { return new Date(s).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }); }

  if (cargando) return <CargandoSpinner mensaje="Cargando ventas..." tamano="grande" />;

  const totalFiltrado = ventas.reduce((s, v) => s + Number(v.total), 0);

  return (
    <div style={{ padding: 'var(--espacio-8)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-6)', animation: 'fadeIn 300ms ease both' }}>
      <h1 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-3xl)', color: 'var(--texto-primario)' }}>Ventas</h1>

      {/* Stats del día */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <TarjetaStat titulo="Total hoy" valor={formatearMoneda(resumen?.total)} icono={DollarSign} color="dorado" tendencia={`${resumen?.cantidad || 0} ventas`} />
        <TarjetaStat titulo="Efectivo hoy" valor={formatearMoneda(resumen?.efectivo)} icono={Banknote} color="verde" />
        <TarjetaStat titulo="Transferencias hoy" valor={formatearMoneda(resumen?.transferencias)} icono={CreditCard} color="azul" />
      </div>

      {/* Filtros de período */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-xl)', color: 'var(--dorado-puro)' }}>
          {formatearMoneda(totalFiltrado)} — {ventas.length} ventas
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['hoy', 'semana', 'mes'].map(f => (
            <button
              key={f}
              onClick={() => setFiltroFecha(f)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radio-full)',
                border: `1px solid ${f === filtroFecha ? 'var(--dorado-puro)' : 'var(--borde-normal)'}`,
                background: f === filtroFecha ? 'var(--dorado-muy-suave)' : 'transparent',
                color: f === filtroFecha ? 'var(--dorado-puro)' : 'var(--texto-terciario)',
                fontSize: 'var(--texto-sm)', fontWeight: f === filtroFecha ? 600 : 400,
                cursor: 'pointer', transition: 'all var(--transicion-rapida)',
                textTransform: 'capitalize',
              }}
            >
              {f === 'semana' ? 'Última semana' : f === 'mes' ? 'Este mes' : 'Hoy'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Mesa</th>
              <th>Método de pago</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map(venta => (
              <tr key={venta.id}>
                <td style={{ color: 'var(--texto-terciario)', fontSize: 'var(--texto-xs)' }}>{formatearFecha(venta.vendido_en)}</td>
                <td style={{ fontWeight: 600 }}>{venta.mesa?.nombre || 'Mesa'}</td>
                <td><EstadoBadge estado={venta.metodo_pago} /></td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--fuente-titular)', fontWeight: 700, fontSize: 'var(--texto-lg)', color: 'var(--dorado-puro)' }}>
                  {formatearMoneda(venta.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ventas.length === 0 && (
          <div className="estado-vacio">
            <BarChart3 size={40} className="estado-vacio-icono" />
            <div className="estado-vacio-titulo">No hay ventas en este período</div>
          </div>
        )}
      </div>
    </div>
  );
}
