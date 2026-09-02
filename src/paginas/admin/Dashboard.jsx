// ============================================
// Página: Dashboard — Resumen del negocio
// ============================================
import { useState, useEffect } from 'react';
import { DollarSign, Grid3X3, ShoppingBag, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { TarjetaStat } from '../../componentes/comunes/TarjetaStat.jsx';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { EstadoBadge } from '../../componentes/comunes/EstadoBadge.jsx';
import { obtenerResumenVentasHoy } from '../../servicios/ventas.js';
import { obtenerAlertasStockBajo } from '../../servicios/inventario.js';
import { obtenerMesas } from '../../servicios/mesas.js';
import { obtenerPedidos } from '../../servicios/pedidos.js';
import { estadisticasMock, pedidosMock } from '../../datos/datosMock.js';
import { supabaseConfigurado } from '../../config/supabase.js';

function formatearMoneda(valor) {
  return `$${Number(valor || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatearHora(fechaStr) {
  return new Date(fechaStr).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [alertas, setAlertas]           = useState([]);
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [cargando, setCargando]         = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        if (!supabaseConfigurado) {
          // Usar datos mock
          setEstadisticas(estadisticasMock);
          const alertasMock = (await import('../../servicios/inventario.js')).obtenerAlertasStockBajo;
          setAlertas(await alertasMock());
          setPedidosRecientes(pedidosMock.slice(0, 5));
        } else {
          const [resumen, alertasStock, mesas, pedidos] = await Promise.all([
            obtenerResumenVentasHoy(),
            obtenerAlertasStockBajo(),
            obtenerMesas(),
            obtenerPedidos(),
          ]);
          setEstadisticas({
            ventasHoy: resumen.total,
            mesasOcupadas: mesas.filter(m => ['ocupada', 'pendiente_pago'].includes(m.estado)).length,
            totalMesas: mesas.length,
            pedidosPendientes: pedidos.filter(p => ['recibido', 'en_preparacion'].includes(p.estado)).length,
            alertasInventario: alertasStock.length,
          });
          setAlertas(alertasStock.slice(0, 5));
          setPedidosRecientes(pedidos.slice(0, 5));
        }
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  if (cargando) return <CargandoSpinner mensaje="Cargando dashboard..." tamano="grande" />;

  return (
    <div style={{ padding: 'var(--espacio-8)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-8)', animation: 'fadeIn 300ms ease both' }}>
      {/* Encabezado */}
      <div>
        <h1 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-3xl)', color: 'var(--texto-primario)', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--texto-terciario)', fontSize: 'var(--texto-sm)' }}>
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--espacio-4)' }}>
        <TarjetaStat
          titulo="Ventas del día"
          valor={formatearMoneda(estadisticas?.ventasHoy)}
          icono={DollarSign}
          color="dorado"
          tendencia="Hoy hasta ahora"
        />
        <TarjetaStat
          titulo="Mesas activas"
          valor={`${estadisticas?.mesasOcupadas || 0}/${estadisticas?.totalMesas || 0}`}
          icono={Grid3X3}
          color="verde"
          tendencia="Ocupadas / Total"
        />
        <TarjetaStat
          titulo="Pedidos en curso"
          valor={estadisticas?.pedidosPendientes || 0}
          icono={ShoppingBag}
          color="azul"
          tendencia="Pendientes y en cocina"
        />
        <TarjetaStat
          titulo="Alertas de stock"
          valor={estadisticas?.alertasInventario || 0}
          icono={AlertTriangle}
          color={estadisticas?.alertasInventario > 0 ? 'rojo' : 'verde'}
          tendencia="Productos bajo mínimo"
        />
      </div>

      {/* Contenido inferior */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-6)' }}>
        {/* Pedidos recientes */}
        <div className="tarjeta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Clock size={18} color="var(--dorado-puro)" />
            <h3 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-lg)', color: 'var(--texto-primario)' }}>
              Pedidos recientes
            </h3>
          </div>
          {pedidosRecientes.length === 0 ? (
            <div style={{ color: 'var(--texto-muted)', fontSize: 'var(--texto-sm)', textAlign: 'center', padding: '20px 0' }}>
              No hay pedidos recientes
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pedidosRecientes.map(pedido => (
                <div key={pedido.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'var(--superficie-2)',
                  borderRadius: 'var(--radio-md)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--texto-sm)', color: 'var(--texto-primario)' }}>
                      {pedido.mesa?.nombre || 'Mesa'}
                    </div>
                    <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-terciario)' }}>
                      {formatearHora(pedido.creado_en)}
                    </div>
                  </div>
                  <EstadoBadge estado={pedido.estado} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas de inventario */}
        <div className="tarjeta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={18} color={alertas.length > 0 ? 'var(--rojo-claro)' : 'var(--verde-exito-claro)'} />
            <h3 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-lg)', color: 'var(--texto-primario)' }}>
              Alertas de inventario
            </h3>
          </div>
          {alertas.length === 0 ? (
            <div style={{
              background: 'var(--verde-bg)', border: '1px solid var(--verde-exito)',
              borderRadius: 'var(--radio-md)', padding: '12px 16px',
              color: 'var(--verde-exito-claro)', fontSize: 'var(--texto-sm)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ✅ Todo el inventario está en niveles óptimos
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertas.map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px',
                  background: 'var(--rojo-bg)', border: '1px solid var(--rojo-error)',
                  borderRadius: 'var(--radio-md)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--texto-sm)', color: 'var(--rojo-claro)' }}>
                    {item.producto?.nombre || 'Producto'}
                  </div>
                  <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--rojo-claro)' }}>
                    {item.stock_actual} / {item.stock_minimo} mín.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
