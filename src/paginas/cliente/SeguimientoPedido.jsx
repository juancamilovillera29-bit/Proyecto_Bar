// ============================================
// Página: SeguimientoPedido — Estado del pedido
// y cuenta acumulada de la mesa
// ============================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, ChefHat, Truck, Wine } from 'lucide-react';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { obtenerPedidos } from '../../servicios/pedidos.js';
import { obtenerMesaPorCodigo } from '../../servicios/mesas.js';
import { obtenerCuentaActivaDeMesa } from '../../servicios/cuentas.js';
import { supabase, supabaseConfigurado } from '../../config/supabase.js';

const PASOS_ESTADO = [
  { estado: 'recibido',       etiqueta: 'Recibido',       icono: Clock,        descripcion: 'Tu pedido fue recibido' },
  { estado: 'en_preparacion', etiqueta: 'En preparación', icono: ChefHat,      descripcion: 'La cocina está preparando tu pedido' },
  { estado: 'listo',          etiqueta: 'Listo',          icono: CheckCircle,  descripcion: '¡Tu pedido está listo!' },
  { estado: 'entregado',      etiqueta: 'Entregado',      icono: Truck,        descripcion: '¡Disfruta tu pedido!' },
];

const ORDEN_ESTADO = { recibido: 0, en_preparacion: 1, listo: 2, entregado: 3 };

export default function SeguimientoPedido() {
  const { codigoQr } = useParams();
  const [pedidos, setPedidos]   = useState([]);
  const [cuenta, setCuenta]     = useState(null);
  const [mesa, setMesa]         = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      const mesaDatos = await obtenerMesaPorCodigo(codigoQr);
      if (!mesaDatos) { setCargando(false); return; }
      setMesa(mesaDatos);

      const [pedidosDatos, cuentaDatos] = await Promise.all([
        obtenerPedidos({ mesa_id: mesaDatos.id }),
        obtenerCuentaActivaDeMesa(mesaDatos.id),
      ]);
      setPedidos(pedidosDatos.filter(p => p.estado !== 'cancelado'));
      setCuenta(cuentaDatos);
      setCargando(false);
    }
    cargarDatos();

    // Suscripción realtime para actualización automática
    if (!supabaseConfigurado) return;
    const canal = supabase
      .channel('seguimiento_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, () => {
        cargarDatos();
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [codigoQr]);

  if (cargando) return <CargandoSpinner mensaje="Cargando seguimiento..." />;

  const ultimoPedido = pedidos[0];
  const estadoActual = ultimoPedido?.estado || 'recibido';
  const pasoActual   = ORDEN_ESTADO[estadoActual] || 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--negro-base)', paddingBottom: 40 }}>
      {/* Encabezado */}
      <div style={{ background: 'var(--negro-profundo)', borderBottom: '1px solid var(--borde-sutil)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to={`/mesa/${codigoQr}`} style={{ color: 'var(--texto-terciario)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wine size={18} color="var(--dorado-puro)" />
          <span style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 700, color: 'var(--dorado-puro)' }}>
            BORONDO — {mesa?.nombre}
          </span>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h1 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-2xl)', color: 'var(--texto-primario)' }}>
          Mis pedidos
        </h1>

        {/* Timeline del último pedido */}
        {ultimoPedido && (
          <div className="tarjeta">
            <h3 style={{ fontFamily: 'var(--fuente-titular)', marginBottom: 20, color: 'var(--dorado-puro)', fontSize: 'var(--texto-lg)' }}>
              Estado del pedido
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {PASOS_ESTADO.map((paso, idx) => {
                const completado = idx <= pasoActual;
                const actual = idx === pasoActual;
                const Icono = paso.icono;
                return (
                  <div key={paso.estado} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingBottom: idx < PASOS_ESTADO.length - 1 ? 20 : 0 }}>
                    {/* Línea de tiempo */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: completado ? 'linear-gradient(135deg, var(--dorado-puro), var(--dorado-suave))' : 'var(--superficie-3)',
                        border: actual ? '2px solid var(--dorado-puro)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: actual ? 'var(--sombra-dorada)' : 'none',
                        animation: actual ? 'brillar 2s ease infinite' : 'none',
                      }}>
                        <Icono size={16} color={completado ? 'var(--negro-profundo)' : 'var(--texto-muted)'} />
                      </div>
                      {idx < PASOS_ESTADO.length - 1 && (
                        <div style={{ width: 2, height: 20, background: completado ? 'var(--dorado-opaco)' : 'var(--borde-sutil)', margin: '4px 0' }} />
                      )}
                    </div>
                    {/* Texto */}
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ fontWeight: actual ? 700 : 500, color: completado ? 'var(--texto-primario)' : 'var(--texto-muted)', fontSize: 'var(--texto-sm)' }}>
                        {paso.etiqueta}
                      </div>
                      {actual && (
                        <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--dorado-puro)', marginTop: 2 }}>
                          {paso.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cuenta acumulada */}
        {cuenta && (
          <div className="tarjeta-dorada">
            <h3 style={{ fontFamily: 'var(--fuente-titular)', marginBottom: 16, color: 'var(--dorado-puro)', fontSize: 'var(--texto-lg)' }}>
              Cuenta acumulada
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 'var(--texto-sm)', color: 'var(--texto-terciario)' }}>
                  Total consumido hasta ahora
                </div>
                <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)', marginTop: 2 }}>
                  {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} realizados
                </div>
              </div>
              <div style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: 'var(--texto-4xl)', color: 'var(--dorado-puro)' }}>
                ${Number(cuenta.total || 0).toFixed(2)}
              </div>
            </div>
            <hr className="separador-dorado" />
            <Link
              to={`/mesa/${codigoQr}/pago`}
              className="btn btn-primario btn-bloque"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
            >
              Solicitar la cuenta →
            </Link>
          </div>
        )}

        {pedidos.length === 0 && (
          <div className="estado-vacio">
            <ChefHat size={48} className="estado-vacio-icono" />
            <div className="estado-vacio-titulo">Sin pedidos todavía</div>
            <div className="estado-vacio-descripcion">
              <Link to={`/mesa/${codigoQr}`} style={{ color: 'var(--dorado-puro)' }}>Vuelve al menú</Link> para hacer tu primer pedido
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
