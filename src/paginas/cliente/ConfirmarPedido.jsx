// ============================================
// Página: ConfirmarPedido — Confirmar y enviar
// ============================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Wine, CheckCircle, ShoppingBag, AlertCircle } from 'lucide-react';
import { useCarrito } from '../../contextos/ContextoCarrito.jsx';
import { crearPedido } from '../../servicios/pedidos.js';
import { obtenerMesaPorCodigo } from '../../servicios/mesas.js';
import { obtenerCuentaActivaDeMesa, abrirCuenta } from '../../servicios/cuentas.js';

export default function ConfirmarPedido() {
  const { codigoQr } = useParams();
  const { articulos, subtotal, mesaId, cuentaId, vaciarCarrito, carritoVacio, establecerMesa } = useCarrito();
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [mesaActual, setMesaActual] = useState(null);

  // Asegurar que mesaId y cuentaId estén disponibles
  useEffect(() => {
    async function asegurarMesaYCuenta() {
      try {
        const mesaDatos = await obtenerMesaPorCodigo(codigoQr);
        if (mesaDatos) {
          setMesaActual(mesaDatos);
          let cuenta = await obtenerCuentaActivaDeMesa(mesaDatos.id);
          if (!cuenta) {
            cuenta = await abrirCuenta(mesaDatos.id);
          }
          establecerMesa(mesaDatos.id, cuenta?.id || null);
        }
      } catch (e) {
        console.error('Error al resolver mesa en confirmación:', e);
      }
    }
    asegurarMesaYCuenta();
  }, [codigoQr]);

  async function manejarConfirmar(e) {
    e.preventDefault();
    if (carritoVacio) {
      setErrorEnvio('El carrito está vacío. Agrega productos antes de enviar.');
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);

    try {
      // Si por alguna razón mesaId no está en el estado, buscarla por código
      let idMesa = mesaId;
      let idCuenta = cuentaId;

      if (!idMesa) {
        const mesaDatos = await obtenerMesaPorCodigo(codigoQr);
        if (!mesaDatos) {
          throw new Error('No se pudo identificar la mesa. Por favor reescanea el código QR.');
        }
        idMesa = mesaDatos.id;
        let cuenta = await obtenerCuentaActivaDeMesa(idMesa);
        if (!cuenta) {
          cuenta = await abrirCuenta(idMesa);
        }
        idCuenta = cuenta?.id || null;
      }

      const detalles = articulos.map(a => ({
        producto_id: a.producto.id,
        cantidad: a.cantidad,
        precio_unitario: a.producto.precio_venta,
      }));

      await crearPedido({
        mesa_id: idMesa,
        cuenta_id: idCuenta,
        estado: 'recibido',
        observaciones: observaciones.trim() || null,
        detalles,
      });

      vaciarCarrito();
      setPedidoEnviado(true);
    } catch (err) {
      console.error('Error al enviar pedido:', err);
      setErrorEnvio(err?.message || 'Hubo un problema al enviar tu pedido. Por favor intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (pedidoEnviado) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--negro-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 340, animation: 'fadeIn 400ms ease both' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--verde-bg)', border: '2px solid var(--verde-exito-claro)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'brillar 2s ease infinite',
          }}>
            <CheckCircle size={40} color="var(--verde-exito-claro)" />
          </div>
          <h2 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-3xl)', color: 'var(--texto-primario)', marginBottom: 10 }}>
            ¡Pedido enviado!
          </h2>
          <p style={{ color: 'var(--texto-terciario)', marginBottom: 30, lineHeight: 1.6 }}>
            Tu pedido fue enviado exitosamente a la barra/cocina. Puedes seguir el estado en tiempo real.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link
              to={`/mesa/${codigoQr}/seguimiento`}
              className="btn btn-primario btn-bloque btn-lg"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Ver estado del pedido →
            </Link>
            <Link
              to={`/mesa/${codigoQr}`}
              className="btn btn-fantasma btn-bloque"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              Volver al menú
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Confirmar pedido {mesaActual ? `— ${mesaActual.nombre}` : ''}
          </span>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {errorEnvio && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: 'var(--radio-md)',
            padding: '12px 16px',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 'var(--texto-sm)',
          }}>
            <AlertCircle size={18} color="#ef4444" />
            <span>{errorEnvio}</span>
          </div>
        )}

        {carritoVacio ? (
          <div className="estado-vacio">
            <ShoppingBag size={48} className="estado-vacio-icono" />
            <div className="estado-vacio-titulo">Tu carrito está vacío</div>
            <Link to={`/mesa/${codigoQr}`} className="btn btn-primario" style={{ textDecoration: 'none', marginTop: 12 }}>
              Ir al menú
            </Link>
          </div>
        ) : (
          <form onSubmit={manejarConfirmar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Resumen de ítems */}
            <div className="tarjeta">
              <h3 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-lg)', color: 'var(--texto-primario)', marginBottom: 14 }}>
                Resumen del pedido
              </h3>
              {articulos.map(({ producto, cantidad }) => (
                <div key={producto.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--borde-sutil)' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--texto-primario)', fontSize: 'var(--texto-sm)' }}>{producto.nombre}</span>
                    <span style={{ color: 'var(--texto-muted)', fontSize: 'var(--texto-xs)', marginLeft: 6 }}>×{cantidad}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--dorado-puro)', fontFamily: 'var(--fuente-titular)' }}>
                    ${(producto.precio_venta * cantidad).toFixed(2)}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '2px solid var(--borde-normal)' }}>
                <span style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 700, fontSize: 'var(--texto-lg)', color: 'var(--texto-primario)' }}>Total</span>
                <span style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 800, fontSize: 'var(--texto-2xl)', color: 'var(--dorado-puro)' }}>
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Observaciones */}
            <div className="campo">
              <label>Comentarios o instrucciones especiales</label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Ej: Sin hielo, extra limón, servir frío..."
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primario btn-bloque btn-lg"
              disabled={enviando}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {enviando ? (
                <><div className="spinner" style={{ borderTopColor: 'var(--negro-profundo)', borderColor: 'rgba(0,0,0,0.2)' }} /> Enviando pedido...</>
              ) : (
                <>Enviar pedido a cocina ✓</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

