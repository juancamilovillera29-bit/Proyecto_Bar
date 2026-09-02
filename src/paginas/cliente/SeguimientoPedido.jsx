// ============================================
// Página: SeguimientoPedido — Estado del pedido en tiempo real
// ============================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, ChefHat, Truck, Wine, Receipt, PlusCircle } from 'lucide-react';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { obtenerPedidos } from '../../servicios/pedidos.js';
import { obtenerMesaPorCodigo } from '../../servicios/mesas.js';
import { obtenerCuentaActivaDeMesa } from '../../servicios/cuentas.js';
import { supabase, supabaseConfigurado } from '../../config/supabase.js';
import { formatearPrecio } from '../../componentes/cliente/TarjetaProducto.jsx';

const PASOS_ESTADO = [
  { estado: 'recibido',       etiqueta: 'Recibido',       icono: Clock,        descripcion: 'Tu pedido fue recibido en la barra/cocina' },
  { estado: 'en_preparacion', etiqueta: 'En preparación', icono: ChefHat,      descripcion: 'Estamos preparando tus bebidas o platos' },
  { estado: 'listo',          etiqueta: 'Listo',          icono: CheckCircle,  descripcion: '¡Tu pedido está listo para ser servido!' },
  { estado: 'entregado',      etiqueta: 'Entregado',      icono: Truck,        descripcion: '¡Disfruta tu pedido!' },
];

const ORDEN_ESTADO = { recibido: 0, en_preparacion: 1, listo: 2, entregado: 3 };

export default function SeguimientoPedido() {
  const { codigoQr } = useParams();
  const [pedidos, setPedidos]   = useState([]);
  const [cuenta, setCuenta]     = useState(null);
  const [mesa, setMesa]         = useState(null);
  const [cargando, setCargando] = useState(true);

  async function cargarDatos(esRecarga = false) {
    try {
      if (!esRecarga) setCargando(true);
      const mesaDatos = await obtenerMesaPorCodigo(codigoQr);
      if (!mesaDatos) {
        if (!esRecarga) setCargando(false);
        return;
      }
      setMesa(mesaDatos);

      const cuentaDatos = await obtenerCuentaActivaDeMesa(mesaDatos.id);
      setCuenta(cuentaDatos);

      // Si hay cuenta activa, traer los pedidos de esa cuenta, sino los pedidos de la mesa
      const filtros = cuentaDatos ? { cuenta_id: cuentaDatos.id } : { mesa_id: mesaDatos.id };
      const pedidosDatos = await obtenerPedidos(filtros);
      setPedidos((pedidosDatos || []).filter(p => p.estado !== 'cancelado'));
    } catch (e) {
      console.warn('Error al cargar datos de seguimiento:', e);
    } finally {
      if (!esRecarga) setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();

    // Polling automático cada 2.5 segundos para reflejar cambios en tiempo real
    const intervalo = setInterval(() => {
      cargarDatos(true);
    }, 2500);

    // Suscripción Realtime
    let canal = null;
    if (supabaseConfigurado) {
      canal = supabase
        .channel('seguimiento_realtime_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
          cargarDatos(true);
        })
        .subscribe();
    }

    return () => {
      clearInterval(intervalo);
      if (canal) supabase.removeChannel(canal);
    };
  }, [codigoQr]);

  if (cargando) return <CargandoSpinner mensaje="Cargando estado del pedido..." tamano="grande" />;

  const ultimoPedido = pedidos[0];
  const estadoActual = ultimoPedido?.estado || 'recibido';
  const pasoActual   = ORDEN_ESTADO[estadoActual] ?? 0;

  // Calcular total exacto a partir de los pedidos de la cuenta
  const totalCalculado = pedidos.reduce((acc, p) => {
    const sub = (p.detalles || []).reduce((s, d) => s + (Number(d.precio_unitario) || 0) * (Number(d.cantidad) || 1), 0);
    return acc + sub;
  }, 0);
  const totalMostrar = Math.max(Number(cuenta?.total || 0), totalCalculado);

  return (
    <div style={{ minHeight: '100vh', background: '#121214', paddingBottom: 60, color: '#ffffff' }}>
      {/* Encabezado */}
      <div style={{
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky',
        top: 0,
        background: '#121214',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to={`/mesa/${codigoQr}`}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#19191d',
              border: '1px solid #282830',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d49a37',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ fontFamily: 'var(--fuente-titular, sans-serif)', fontWeight: 800, fontSize: '1.1rem', color: '#e5a93c' }}>
              BORONDO
            </div>
            <div style={{ fontSize: '0.78rem', color: '#8f9098' }}>{mesa?.nombre || 'Mesa'}</div>
          </div>
        </div>

        <Link
          to={`/mesa/${codigoQr}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#202025',
            border: '1px solid #2c2c36',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            color: '#e5a93c',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          <PlusCircle size={14} />
          Pedir más
        </Link>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Timeline del último pedido */}
        {ultimoPedido ? (
          <div style={{
            background: '#19191d',
            borderRadius: '18px',
            padding: '20px',
            border: '1px solid #27272e',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{
                fontFamily: 'var(--fuente-titular, sans-serif)',
                margin: 0,
                color: '#e5a93c',
                fontSize: '1.15rem',
                fontWeight: 700,
              }}>
                Estado de tu pedido
              </h2>
              <span style={{
                fontSize: '0.75rem',
                background: '#24242b',
                padding: '4px 10px',
                borderRadius: '12px',
                color: '#8f9098',
              }}>
                En tiempo real
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {PASOS_ESTADO.map((paso, idx) => {
                const completado = idx <= pasoActual;
                const actual = idx === pasoActual;
                const Icono = paso.icono;
                return (
                  <div key={paso.estado} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', paddingBottom: idx < PASOS_ESTADO.length - 1 ? '18px' : '0' }}>
                    {/* Línea de tiempo y círculo */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px', flexShrink: 0 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: completado ? '#e5a93c' : '#24242b',
                        border: actual ? '2px solid #ffffff' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: actual ? '0 0 14px rgba(229, 169, 60, 0.6)' : 'none',
                        transition: 'all 0.3s ease',
                      }}>
                        <Icono size={16} color={completado ? '#121214' : '#8f9098'} strokeWidth={2.4} />
                      </div>
                      {idx < PASOS_ESTADO.length - 1 && (
                        <div style={{
                          width: '2px',
                          height: '24px',
                          background: completado ? '#d49a37' : '#2c2c36',
                          margin: '4px 0',
                          transition: 'all 0.3s ease',
                        }} />
                      )}
                    </div>

                    {/* Texto */}
                    <div style={{ paddingTop: '4px' }}>
                      <div style={{
                        fontWeight: actual ? 800 : (completado ? 700 : 500),
                        color: actual ? '#ffffff' : (completado ? '#d4d4d8' : '#6b7280'),
                        fontSize: '0.92rem',
                      }}>
                        {paso.etiqueta}
                      </div>
                      {actual && (
                        <div style={{ fontSize: '0.8rem', color: '#e5a93c', marginTop: '3px', lineHeight: 1.4 }}>
                          {paso.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Tarjeta de Cuenta Acumulada */}
        <div style={{
          background: '#19191d',
          borderRadius: '18px',
          padding: '20px',
          border: '1px solid #27272e',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#8f9098', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                TOTAL A PAGAR
              </div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '2px' }}>
                {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} activo{pedidos.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div style={{
              fontFamily: 'var(--fuente-titular, sans-serif)',
              fontWeight: 800,
              fontSize: '1.6rem',
              color: '#e5a93c',
            }}>
              {formatearPrecio(totalMostrar)}
            </div>
          </div>

          {/* Desglose resumido de pedidos */}
          {pedidos.length > 0 && (
            <div style={{ borderTop: '1px solid #282832', paddingTop: '12px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pedidos.map((ped, i) => (
                <div key={ped.id} style={{ fontSize: '0.84rem', color: '#d1d1d6' }}>
                  <div style={{ color: '#8f9098', fontSize: '0.78rem', marginBottom: '4px', fontWeight: 700 }}>
                    Pedido #{pedidos.length - i} ({ped.estado})
                  </div>
                  {(ped.detalles || []).map(d => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span>{d.producto?.nombre || 'Producto'} ×{d.cantidad}</span>
                      <span style={{ color: '#e5a93c', fontWeight: 600 }}>{formatearPrecio((Number(d.precio_unitario) || 0) * (Number(d.cantidad) || 1))}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {totalMostrar > 0 && (
            <Link
              to={`/mesa/${codigoQr}/pago`}
              style={{
                marginTop: '16px',
                background: '#e5a93c',
                color: '#121214',
                padding: '14px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(229, 169, 60, 0.3)',
              }}
            >
              <Receipt size={18} strokeWidth={2.4} />
              Solicitar la cuenta
            </Link>
          )}
        </div>

        {pedidos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8f9098' }}>
            <ChefHat size={44} color="#8f9098" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>Sin pedidos todavía</div>
            <p style={{ fontSize: '0.88rem', marginBottom: '16px' }}>Puedes agregar bebidas y platos desde el menú</p>
            <Link
              to={`/mesa/${codigoQr}`}
              style={{
                background: '#e5a93c',
                color: '#121214',
                padding: '12px 24px',
                borderRadius: '20px',
                textDecoration: 'none',
                fontWeight: 700,
                display: 'inline-block',
              }}
            >
              Ver el menú
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

