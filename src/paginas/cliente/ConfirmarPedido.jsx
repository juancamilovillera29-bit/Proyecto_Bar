// ============================================
// Página: ConfirmarPedido — Checkout (Mockup UI)
// ============================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ShoppingBag, AlertCircle, Plus, Minus, Send, Wine, Lock } from 'lucide-react';
import { useCarrito } from '../../contextos/ContextoCarrito.jsx';
import { crearPedido } from '../../servicios/pedidos.js';
import { obtenerMesaPorCodigo } from '../../servicios/mesas.js';
import { obtenerCuentaActivaDeMesa, abrirCuenta } from '../../servicios/cuentas.js';
import { formatearPrecio } from '../../componentes/cliente/TarjetaProducto.jsx';

import { obtenerProductos } from '../../servicios/productos.js';

export default function ConfirmarPedido() {
  const { codigoQr } = useParams();
  const { articulos, subtotal, mesaId, cuentaId, vaciarCarrito, carritoVacio, establecerMesa, agregarArticulo, quitarArticulo } = useCarrito();
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [mesaActual, setMesaActual] = useState(null);
  const [productosFrescos, setProductosFrescos] = useState([]);

  // Asegurar que mesaId y cuentaId estén disponibles y cargar stock fresco
  useEffect(() => {
    let montado = true;

    async function asegurarMesaYCuenta() {
      try {
        const [mesaDatos, prods] = await Promise.all([
          obtenerMesaPorCodigo(codigoQr),
          obtenerProductos(),
        ]);
        if (!montado) return;
        if (prods) setProductosFrescos(prods);
        if (mesaDatos) {
          setMesaActual(mesaDatos);
          let cuenta = await obtenerCuentaActivaDeMesa(mesaDatos.id);
          if (!cuenta && mesaDatos.estado !== 'pendiente_pago') {
            cuenta = await abrirCuenta(mesaDatos.id);
          }
          if (montado) establecerMesa(mesaDatos.id, cuenta?.id || null);
        }
      } catch (e) {
        console.error('Error al resolver mesa en checkout:', e);
      }
    }
    asegurarMesaYCuenta();

    const intervalo = setInterval(async () => {
      try {
        const prods = await obtenerProductos();
        if (montado && prods) setProductosFrescos(prods);
      } catch (e) {}
    }, 4000);

    return () => {
      montado = false;
      clearInterval(intervalo);
    };
  }, [codigoQr]);

  // Verificar si algún artículo en el carrito excede el stock actual
  const itemsExcedidos = articulos.filter(item => {
    const prodFresco = productosFrescos.find(p => p.id === item.producto.id);
    const stockActual = prodFresco ? (typeof prodFresco.stock === 'number' ? prodFresco.stock : parseInt(prodFresco.stock ?? '0', 10)) : (item.producto.stock ?? 0);
    return item.cantidad > stockActual;
  });

  const hayErrorStock = itemsExcedidos.length > 0;

  async function manejarConfirmar(e) {
    if (e) e.preventDefault();
    if (carritoVacio) {
      setErrorEnvio('El carrito está vacío. Agrega productos antes de enviar.');
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);

    try {
      // 1. Validar stock en tiempo real antes de enviar
      const productosFrescos = await obtenerProductos();
      for (const item of articulos) {
        const prodFresco = productosFrescos.find(p => p.id === item.producto.id);
        const stockActual = prodFresco ? (typeof prodFresco.stock === 'number' ? prodFresco.stock : parseInt(prodFresco.stock ?? '0', 10)) : 0;
        if (!prodFresco || stockActual < item.cantidad) {
          throw new Error(
            `No hay suficiente stock para "${item.producto.nombre}". Disponible: ${stockActual} unidad(es), solicitaste: ${item.cantidad}.`
          );
        }
      }

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

  if (mesaActual?.estado === 'pendiente_pago') {
    return (
      <div style={{ minHeight: '100vh', background: '#121214', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 360, animation: 'fadeIn 400ms ease both' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Lock size={13} />
            Sesión Cerrada
          </div>

          <h2 style={{ fontFamily: 'var(--fuente-titular, sans-serif)', fontSize: '1.6rem', color: '#ffffff', marginBottom: 10 }}>
            Cuenta en proceso de pago
          </h2>
          <p style={{ color: '#8f9098', marginBottom: 24, lineHeight: 1.6, fontSize: '0.92rem' }}>
            La cuenta de la <strong>{mesaActual?.nombre}</strong> ya fue solicitada y la sesión está cerrada. El mesero se acercará a cobrar.
          </p>

          <Link
            to={`/mesa/${codigoQr}/pago`}
            style={{
              display: 'block',
              background: '#e5a93c',
              color: '#121214',
              padding: '14px',
              borderRadius: '16px',
              fontWeight: 800,
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '0.95rem',
            }}
          >
            Ver estado de la cuenta
          </Link>
        </div>
      </div>
    );
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

        {hayErrorStock && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.18)',
            border: '1px solid #ef4444',
            borderRadius: '14px',
            padding: '12px 16px',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem',
          }}>
            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>
              <strong>Stock insuficiente:</strong> Uno o más productos en tu pedido superan las existencias disponibles. Reduce la cantidad para poder enviar tu orden.
            </span>
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
                {articulos.map(({ producto, cantidad }) => {
                  const prodFresco = productosFrescos.find(p => p.id === producto.id);
                  const stockDisp = prodFresco ? (typeof prodFresco.stock === 'number' ? prodFresco.stock : parseInt(prodFresco.stock ?? '0', 10)) : (producto.stock ?? 0);
                  const sinMasStock = cantidad >= stockDisp;
                  const excedeStock = cantidad > stockDisp;

                  return (
                    <div
                      key={producto.id}
                      style={{
                        background: '#19191d',
                        borderRadius: '16px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        border: excedeStock ? '1px solid #ef4444' : '1px solid #27272e',
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
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: '2px',
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#8f9098' }}>
                            {formatearPrecio(producto.precio_venta)}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: excedeStock ? '#f87171' : '#9ca3af',
                          }}>
                            {stockDisp <= 0 ? '• Agotado' : `• Disp: ${stockDisp}`}
                          </span>
                        </div>
                        {excedeStock && (
                          <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, marginTop: 2 }}>
                            ⚠️ Solicitaste más de lo disponible ({stockDisp})
                          </div>
                        )}
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
                          color: excedeStock ? '#f87171' : '#ffffff',
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
                          disabled={sinMasStock}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: sinMasStock ? '#52525b' : '#e5a93c',
                            cursor: sinMasStock ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2px',
                            opacity: sinMasStock ? 0.4 : 1,
                          }}
                          title={sinMasStock ? 'Stock máximo alcanzado' : 'Aumentar'}
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
            disabled={enviando || hayErrorStock}
            style={{
              width: '100%',
              background: hayErrorStock ? '#3f3f46' : '#e5a93c',
              border: 'none',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: hayErrorStock ? '#a1a1aa' : '#121214',
              cursor: (enviando || hayErrorStock) ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '0.04em',
              boxShadow: hayErrorStock ? 'none' : '0 8px 24px rgba(229, 169, 60, 0.35)',
              opacity: (enviando || hayErrorStock) ? 0.75 : 1,
              transition: 'all 0.15s ease',
            }}
            onMouseDown={e => !(enviando || hayErrorStock) && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => !(enviando || hayErrorStock) && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {enviando ? (
              <span>ENVIANDO...</span>
            ) : hayErrorStock ? (
              <span>AJUSTA CANTIDADES (STOCK INSUFICIENTE)</span>
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
