// ============================================
// Página: PaginaPago — Solicitar cuenta y pago (Mockup UI)
// ============================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Banknote, CreditCard } from 'lucide-react';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { obtenerMesaPorCodigo, actualizarEstadoMesa } from '../../servicios/mesas.js';
import { obtenerCuentaActivaDeMesa, marcarCuentaPendientePago } from '../../servicios/cuentas.js';
import { obtenerPedidos } from '../../servicios/pedidos.js';
import { formatearPrecio } from '../../componentes/cliente/TarjetaProducto.jsx';

export default function PaginaPago() {
  const { codigoQr } = useParams();
  const [mesa, setMesa]             = useState(null);
  const [cuenta, setCuenta]         = useState(null);
  const [pedidos, setPedidos]       = useState([]);
  const [metodo, setMetodo]         = useState('efectivo');
  const [cargando, setCargando]     = useState(true);
  const [solicitado, setSolicitado] = useState(false);
  const [procesando, setProcesando] = useState(false);

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

      const filtros = cuentaDatos ? { cuenta_id: cuentaDatos.id } : { mesa_id: mesaDatos.id };
      const pedidosDatos = await obtenerPedidos(filtros);
      setPedidos((pedidosDatos || []).filter(p => p.estado !== 'cancelado'));
    } catch (e) {
      console.warn('Error al cargar datos de pago:', e);
    } finally {
      if (!esRecarga) setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(() => {
      cargarDatos(true);
    }, 2500);
    return () => clearInterval(intervalo);
  }, [codigoQr]);

  async function manejarSolicitarCuenta() {
    if (!mesa) return;
    setProcesando(true);
    try {
      if (cuenta?.id) {
        await marcarCuentaPendientePago(cuenta.id);
      }
      await actualizarEstadoMesa(mesa.id, 'pendiente_pago');
      setSolicitado(true);
    } catch (e) {
      console.error('Error al solicitar cuenta:', e);
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) return <CargandoSpinner mensaje="Cargando cuenta final..." tamano="grande" />;

  // Calcular total sumando todos los pedidos
  const totalCalculado = pedidos.reduce((acc, p) => {
    const sub = (p.detalles || []).reduce((s, d) => s + (Number(d.precio_unitario) || 0) * (Number(d.cantidad) || 1), 0);
    return acc + sub;
  }, 0);
  const totalAPagar = Math.max(Number(cuenta?.total || 0), totalCalculado);

  if (solicitado) {
    return (
      <div style={{ minHeight: '100vh', background: '#121214', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, color: '#ffffff' }}>
        <div style={{ textAlign: 'center', maxWidth: 360, animation: 'fadeIn 400ms ease both' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(229, 169, 60, 0.15)', border: '2px solid #e5a93c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'brillar 2s ease infinite',
          }}>
            <Sparkles size={40} color="#e5a93c" />
          </div>
          <h2 style={{ fontFamily: 'var(--fuente-titular, sans-serif)', fontSize: '1.8rem', color: '#ffffff', marginBottom: 10 }}>
            ¡Cuenta solicitada!
          </h2>
          <p style={{ color: '#8f9098', marginBottom: 20, lineHeight: 1.6, fontSize: '0.95rem' }}>
            Un mesero se acercará a la <strong>{mesa?.nombre}</strong> con tu cuenta para cobrar en <strong>{metodo === 'efectivo' ? 'Efectivo' : 'Transferencia'}</strong>.
          </p>

          <div style={{
            background: '#19191d',
            border: '1px solid #27272e',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.8rem', color: '#8f9098', textTransform: 'uppercase', fontWeight: 700 }}>TOTAL A PAGAR</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e5a93c', marginTop: '4px', fontFamily: 'var(--fuente-titular, sans-serif)' }}>
              {formatearPrecio(totalAPagar)}
            </div>
          </div>

          <Link
            to={`/mesa/${codigoQr}`}
            style={{
              display: 'block',
              background: '#e5a93c',
              color: '#121214',
              padding: '14px',
              borderRadius: '16px',
              fontWeight: 800,
              textDecoration: 'none',
              fontSize: '1rem',
            }}
          >
            Volver al menú
          </Link>
        </div>
      </div>
    );
  }

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
            to={`/mesa/${codigoQr}/seguimiento`}
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
              Pagar Cuenta
            </div>
            <div style={{ fontSize: '0.78rem', color: '#8f9098' }}>{mesa?.nombre || 'Mesa'}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Resumen de consumo */}
        <div style={{
          background: '#19191d',
          borderRadius: '18px',
          padding: '20px',
          border: '1px solid #27272e',
        }}>
          <h3 style={{
            margin: '0 0 16px',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: '#8f9098',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            DETALLE DE CONSUMO
          </h3>

          {pedidos.map((ped, idx) => (
            <div key={ped.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #282832' }}>
              <div style={{ fontSize: '0.78rem', color: '#8f9098', marginBottom: 6, fontWeight: 700 }}>
                Pedido #{pedidos.length - idx}
              </div>
              {(ped.detalles || []).map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '3px 0' }}>
                  <span>{d.producto?.nombre || 'Producto'} ×{d.cantidad}</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{formatearPrecio((Number(d.precio_unitario) || 0) * (Number(d.cantidad) || 1))}</span>
                </div>
              ))}
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '2px solid #2c2c36' }}>
            <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>Total a pagar</span>
            <span style={{ fontFamily: 'var(--fuente-titular, sans-serif)', fontWeight: 800, fontSize: '1.6rem', color: '#e5a93c' }}>
              {formatearPrecio(totalAPagar)}
            </span>
          </div>
        </div>

        {/* Método de pago */}
        <div style={{
          background: '#19191d',
          borderRadius: '18px',
          padding: '20px',
          border: '1px solid #27272e',
        }}>
          <h3 style={{
            margin: '0 0 14px',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: '#8f9098',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            MÉTODO DE PAGO
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setMetodo('efectivo')}
              style={{
                padding: '16px 12px',
                borderRadius: '14px',
                border: metodo === 'efectivo' ? '2px solid #e5a93c' : '1px solid #2c2c36',
                background: metodo === 'efectivo' ? 'rgba(229, 169, 60, 0.15)' : '#151518',
                color: metodo === 'efectivo' ? '#e5a93c' : '#8f9098',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
              }}
            >
              <Banknote size={26} strokeWidth={2.2} />
              <span>Efectivo</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodo('transferencia')}
              style={{
                padding: '16px 12px',
                borderRadius: '14px',
                border: metodo === 'transferencia' ? '2px solid #e5a93c' : '1px solid #2c2c36',
                background: metodo === 'transferencia' ? 'rgba(229, 169, 60, 0.15)' : '#151518',
                color: metodo === 'transferencia' ? '#e5a93c' : '#8f9098',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
              }}
            >
              <CreditCard size={26} strokeWidth={2.2} />
              <span>Transferencia</span>
            </button>
          </div>
        </div>

        {/* Botón pedir la cuenta */}
        <button
          type="button"
          onClick={manejarSolicitarCuenta}
          disabled={procesando || totalAPagar === 0}
          style={{
            background: '#e5a93c',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 20px',
            color: '#121214',
            fontWeight: 800,
            fontSize: '1.08rem',
            cursor: procesando ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(229, 169, 60, 0.35)',
            opacity: procesando ? 0.7 : 1,
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={e => !procesando && (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={e => !procesando && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {procesando ? 'Solicitando...' : 'Pedir la cuenta al mesero'}
        </button>
      </div>
    </div>
  );
}

