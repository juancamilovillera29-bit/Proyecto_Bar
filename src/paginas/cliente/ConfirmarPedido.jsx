// ============================================
// Página: ConfirmarPedido — Checkout (Mockup UI)
// ============================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ShoppingBag, AlertCircle, Plus, Minus, Send, Wine } from 'lucide-react';
import { useCarrito } from '../../contextos/ContextoCarrito.jsx';
import { crearPedido } from '../../servicios/pedidos.js';
import { obtenerMesaPorCodigo } from '../../servicios/mesas.js';
import { obtenerCuentaActivaDeMesa, abrirCuenta } from '../../servicios/cuentas.js';
import { formatearPrecio } from '../../componentes/cliente/TarjetaProducto.jsx';

export default function ConfirmarPedido() {
  const { codigoQr } = useParams();
  const { articulos, subtotal, mesaId, cuentaId, vaciarCarrito, carritoVacio, establecerMesa, agregarArticulo, quitarArticulo } = useCarrito();
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
        console.error('Error al resolver mesa en checkout:', e);
      }
    }
    asegurarMesaYCuenta();
  }, [codigoQr]);

  async function manejarConfirmar(e) {
    if (e) e.preventDefault();
    if (carritoVacio) {
      setErrorEnvio('El carrito está vacío. Agrega productos antes de enviar.');
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);

    try {
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
      <div style={{ minHeight: '100vh', background: '#121214', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 360, animation: 'fadeIn 400ms ease both' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(34, 197, 94, 0.15)', border: '2px solid #22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <CheckCircle size={42} color="#22c55e" />
          </div>
          <h2 style={{ fontFamily: 'var(--fuente-titular, sans-serif)', fontSize: '1.8rem', color: '#ffffff', marginBottom: 10 }}>
            ¡Pedido enviado!
          </h2>
          <p style={{ color: '#8f9098', marginBottom: 30, lineHeight: 1.6, fontSize: '0.95rem' }}>
            Tu pedido fue enviado a la barra/cocina. Ya lo están preparando.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              to={`/mesa/${codigoQr}/seguimiento`}
              style={{
                background: '#e5a93c',
                color: '#121214',
                padding: '14px',
                borderRadius: '16px',
                fontWeight: 800,
                textDecoration: 'none',
                textAlign: 'center',
                fontSize: '1rem',
              }}
            >
              Ver estado del pedido →
            </Link>
            <Link
              to={`/mesa/${codigoQr}`}
              style={{
                background: '#19191d',
                color: '#8f9098',
                border: '1px solid #27272e',
                padding: '14px',
                borderRadius: '16px',
                fontWeight: 600,
                textDecoration: 'none',
                textAlign: 'center',
                fontSize: '0.95rem',
              }}
            >
              Volver al menú
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#121214', paddingBottom: 110, color: '#ffffff' }}>
      {/* Encabezado Superior Checkout */}
      <div style={{
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <Link
          to={`/mesa/${codigoQr}`}
          style={{
            position: 'absolute',
            left: '20px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'transparent',
            border: '1px dashed #d49a37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e5a93c',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={18} />
        </Link>

        <h1 style={{
          margin: 0,
          fontFamily: 'var(--fuente-titular, sans-serif)',
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#e5a93c',
          letterSpacing: '0.04em',
        }}>
          Checkout {mesaActual ? `— ${mesaActual.nombre}` : ''}
        </h1>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {errorEnvio && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '14px',
            padding: '12px 16px',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.9rem',
          }}>
            <AlertCircle size={18} color="#ef4444" />
            <span>{errorEnvio}</span>
          </div>
        )}

        {carritoVacio ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8f9098' }}>
            <ShoppingBag size={48} color="#8f9098" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>Tu carrito está vacío</div>
            <p style={{ fontSize: '0.9rem', marginBottom: 20 }}>Agrega bebidas o platos desde el menú</p>
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
              Ir al menú
            </Link>
          </div>
        ) : (
          <>
            {/* SECCIÓN 1: YOUR ORDER (TU PEDIDO) */}
            <div>
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#8f9098',
                letterSpacing: '0.08em',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}>
                YOUR ORDER
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {articulos.map(({ producto, cantidad }) => (
                  <div
                    key={producto.id}
                    style={{
                      background: '#19191d',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: '1px solid #27272e',
                    }}
                  >
                    {/* Miniatura */}
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: '#121214',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {producto.imagen_url ? (
                        <img
                          src={producto.imagen_url}
                          alt={producto.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Wine size={22} color="#d49a37" />
                      )}
                    </div>

                    {/* Nombre y Precio Unitario */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.98rem',
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {producto.nombre}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#8f9098',
                        marginTop: '2px',
                      }}>
                        {formatearPrecio(producto.precio_venta)}
                      </div>
                    </div>

                    {/* Stepper Pill [ - 1 + ] */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#24242b',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      border: '1px solid #33333d',
                    }}>
                      <button
                        type="button"
                        onClick={() => quitarArticulo(producto.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#d49a37',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px',
                        }}
                      >
                        <Minus size={14} strokeWidth={2.5} />
                      </button>
                      <span style={{
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        minWidth: '16px',
                        textAlign: 'center',
                      }}>
                        {cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => agregarArticulo(producto)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e5a93c',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px',
                        }}
                      >
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN 2: BILL SUMMARY (SOLO LISTA Y TOTAL REQUERIDO) */}
            <div>
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#8f9098',
                letterSpacing: '0.08em',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}>
                BILL SUMMARY
              </div>

              <div style={{
                background: '#19191d',
                borderRadius: '16px',
                padding: '18px 20px',
                border: '1px solid #27272e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#ffffff',
                }}>
                  Total
                </span>
                <span style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  fontFamily: 'var(--fuente-titular, sans-serif)',
                  color: '#e5a93c',
                }}>
                  {formatearPrecio(subtotal)}
                </span>
              </div>
            </div>

            {/* Instrucciones especiales opcionales */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#8f9098',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Instrucciones especiales (Opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Ej: Sin hielo, vasos fríos..."
                rows={2}
                style={{
                  width: '100%',
                  background: '#19191d',
                  border: '1px solid #27272e',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Botón inferior fijo: SEND ORDER */}
      {!carritoVacio && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
          maxWidth: '480px',
          margin: '0 auto',
          zIndex: 500,
        }}>
          <button
            type="button"
            onClick={manejarConfirmar}
            disabled={enviando}
            style={{
              width: '100%',
              background: '#e5a93c',
              border: 'none',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#121214',
              cursor: enviando ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              fontSize: '1.1rem',
              letterSpacing: '0.04em',
              boxShadow: '0 8px 24px rgba(229, 169, 60, 0.35)',
              opacity: enviando ? 0.7 : 1,
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={e => !enviando && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => !enviando && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {enviando ? (
              <span>ENVIANDO...</span>
            ) : (
              <>
                <span>SEND ORDER</span>
                <Send size={18} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}


