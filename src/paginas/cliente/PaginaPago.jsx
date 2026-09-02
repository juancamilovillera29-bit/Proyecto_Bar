// ============================================
// Página: PaginaPago — Solicitar cuenta y pago
// ============================================
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wine, CheckCircle2, Banknote, CreditCard, Sparkles } from 'lucide-react';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { obtenerMesaPorCodigo, actualizarEstadoMesa } from '../../servicios/mesas.js';
import { obtenerCuentaActivaDeMesa, marcarCuentaPendientePago } from '../../servicios/cuentas.js';
import { obtenerPedidos } from '../../servicios/pedidos.js';

export default function PaginaPago() {
  const { codigoQr } = useParams();
  const navegar = useNavigate();
  const [mesa, setMesa]             = useState(null);
  const [cuenta, setCuenta]         = useState(null);
  const [pedidos, setPedidos]       = useState([]);
  const [metodo, setMetodo]         = useState('efectivo');
  const [cargando, setCargando]     = useState(true);
  const [solicitado, setSolicitado] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    async function cargar() {
      const mesaDatos = await obtenerMesaPorCodigo(codigoQr);
      if (!mesaDatos) { setCargando(false); return; }
      setMesa(mesaDatos);

      const [cuentaDatos, pedidosDatos] = await Promise.all([
        obtenerCuentaActivaDeMesa(mesaDatos.id),
        obtenerPedidos({ mesa_id: mesaDatos.id }),
      ]);
      setCuenta(cuentaDatos);
      setPedidos(pedidosDatos.filter(p => p.estado !== 'cancelado'));
      setCargando(false);
    }
    cargar();
  }, [codigoQr]);

  async function manejarSolicitarCuenta() {
    if (!cuenta || !mesa) return;
    setProcesando(true);
    try {
      await marcarCuentaPendientePago(cuenta.id);
      await actualizarEstadoMesa(mesa.id, 'pendiente_pago');
      setSolicitado(true);
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) return <CargandoSpinner mensaje="Cargando cuenta..." />;

  if (solicitado) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--negro-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 360, animation: 'fadeIn 400ms ease both' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--dorado-muy-suave)', border: '2px solid var(--dorado-puro)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'brillar 2s ease infinite',
          }}>
            <Sparkles size={40} color="var(--dorado-puro)" />
          </div>
          <h2 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-3xl)', color: 'var(--texto-primario)', marginBottom: 10 }}>
            ¡Cuenta solicitada!
          </h2>
          <p style={{ color: 'var(--texto-terciario)', marginBottom: 20, lineHeight: 1.6 }}>
            Un mesero se acercará a la <strong>Mesa {mesa?.numero}</strong> con el cobro en <strong>{metodo === 'efectivo' ? 'Efectivo' : 'Transferencia'}</strong>.
          </p>
          {metodo === 'transferencia' && (
            <div style={{ background: 'var(--superficie-2)', border: '1px solid var(--borde-normal)', borderRadius: 'var(--radio-lg)', padding: 16, marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--dorado-puro)', fontWeight: 700, marginBottom: 4 }}>DATOS DE TRANSFERENCIA</div>
              <div style={{ fontSize: 'var(--texto-sm)', color: 'var(--texto-primario)' }}>Banco: <strong>BBVA</strong></div>
              <div style={{ fontSize: 'var(--texto-sm)', color: 'var(--texto-primario)' }}>CLABE: <strong>012180012345678901</strong></div>
              <div style={{ fontSize: 'var(--texto-sm)', color: 'var(--texto-primario)' }}>Beneficiario: <strong>BORONDO Bar S.A.</strong></div>
            </div>
          )}
          <Link
            to={`/mesa/${codigoQr}`}
            className="btn btn-primario btn-bloque"
            style={{ textDecoration: 'none' }}
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--negro-base)', paddingBottom: 40 }}>
      {/* Encabezado */}
      <div style={{ background: 'var(--negro-profundo)', borderBottom: '1px solid var(--borde-sutil)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to={`/mesa/${codigoQr}/seguimiento`} style={{ color: 'var(--texto-terciario)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wine size={18} color="var(--dorado-puro)" />
          <span style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 700, color: 'var(--dorado-puro)' }}>
            Cuenta final — Mesa {mesa?.numero}
          </span>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Resumen de consumo acumulado */}
        <div className="tarjeta">
          <h3 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-lg)', color: 'var(--dorado-puro)', marginBottom: 14 }}>
            Detalle de consumo
          </h3>
          {pedidos.map((ped, idx) => (
            <div key={ped.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--borde-sutil)' }}>
              <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)', marginBottom: 6 }}>
                Pedido #{idx + 1}
              </div>
              {(ped.detalles || []).map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--texto-sm)', padding: '3px 0' }}>
                  <span>{d.producto?.nombre || 'Producto'} ×{d.cantidad}</span>
                  <span style={{ color: 'var(--texto-primario)', fontWeight: 600 }}>${(d.precio_unitario * d.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '2px solid var(--borde-normal)' }}>
            <span style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 700, fontSize: 'var(--texto-xl)' }}>Total a pagar</span>
            <span style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: 'var(--texto-3xl)', color: 'var(--dorado-puro)' }}>
              ${Number(cuenta?.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Selección de método de pago */}
        <div className="tarjeta">
          <h3 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-base)', color: 'var(--texto-primario)', marginBottom: 14 }}>
            ¿Cómo deseas pagar?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              onClick={() => setMetodo('efectivo')}
              style={{
                padding: '16px 12px',
                borderRadius: 'var(--radio-lg)',
                border: `2px solid ${metodo === 'efectivo' ? 'var(--dorado-puro)' : 'var(--borde-normal)'}`,
                background: metodo === 'efectivo' ? 'var(--dorado-muy-suave)' : 'var(--superficie-2)',
                color: metodo === 'efectivo' ? 'var(--dorado-puro)' : 'var(--texto-secundario)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                cursor: 'pointer', fontWeight: 600, fontSize: 'var(--texto-sm)',
              }}
            >
              <Banknote size={24} />
              <span>Efectivo</span>
            </button>
            <button
              type="button"
              onClick={() => setMetodo('transferencia')}
              style={{
                padding: '16px 12px',
                borderRadius: 'var(--radio-lg)',
                border: `2px solid ${metodo === 'transferencia' ? 'var(--dorado-puro)' : 'var(--borde-normal)'}`,
                background: metodo === 'transferencia' ? 'var(--dorado-muy-suave)' : 'var(--superficie-2)',
                color: metodo === 'transferencia' ? 'var(--dorado-puro)' : 'var(--texto-secundario)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                cursor: 'pointer', fontWeight: 600, fontSize: 'var(--texto-sm)',
              }}
            >
              <CreditCard size={24} />
              <span>Transferencia</span>
            </button>
          </div>
        </div>

        <button
          className="btn btn-primario btn-bloque btn-lg"
          onClick={manejarSolicitarCuenta}
          disabled={procesando}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {procesando ? 'Solicitando...' : 'Pedir la cuenta al mesero'}
        </button>
      </div>
    </div>
  );
}
