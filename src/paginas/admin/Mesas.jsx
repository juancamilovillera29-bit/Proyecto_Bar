// ============================================
// Página: Mesas — Gestión limpia de mesas y QR reales
// ============================================
import { useState, useEffect, useRef } from 'react';
import { RefreshCw, QrCode, Plus, Download, Printer, ExternalLink, Trash2, AlertTriangle, Copy, Check, Globe } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TarjetaMesa } from '../../componentes/admin/TarjetaMesa.jsx';
import { Modal } from '../../componentes/comunes/Modal.jsx';
import { EstadoBadge } from '../../componentes/comunes/EstadoBadge.jsx';
import { CargandoSpinner } from '../../componentes/comunes/CargandoSpinner.jsx';
import { obtenerMesas, actualizarEstadoMesa, crearMesa, eliminarMesa } from '../../servicios/mesas.js';
import { obtenerCuentaActivaDeMesa, abrirCuenta, cerrarCuenta } from '../../servicios/cuentas.js';
import { registrarVenta } from '../../servicios/ventas.js';

export default function Mesas() {
  const [mesas, setMesas]           = useState([]);
  const [cuentas, setCuentas]       = useState({});
  const [cargando, setCargando]     = useState(true);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [modalDetalle, setModalDetalle]   = useState(false);
  const [modalQR, setModalQR]             = useState(false);
  const [modalNuevaMesa, setModalNuevaMesa] = useState(false);
  const [modalEliminar, setModalEliminar]   = useState(false);
  const [mesaAEliminar, setMesaAEliminar]   = useState(null);
  const [errorEliminar, setErrorEliminar]   = useState(null);
  const [nombreNuevaMesa, setNombreNuevaMesa] = useState('');
  const [metodoPago, setMetodoPago]       = useState('efectivo');
  const [procesando, setProcesando]       = useState(false);
  const [copiado, setCopiado]             = useState(false);
  
  // Detectar IP / URL base correcta (si es localhost, usar la IP de la red WiFi 10.77.159.97 para teléfonos)
  const defaultBaseUrl = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://10.77.159.97:${window.location.port || 5173}`
        : window.location.origin)
    : 'http://localhost:5173';

  const [baseUrl, setBaseUrl]             = useState(defaultBaseUrl);
  const [editandoBaseUrl, setEditandoBaseUrl] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setCargando(true);
    const mesasDatos = await obtenerMesas();
    setMesas(mesasDatos);
    const cuentasMap = {};
    for (const mesa of mesasDatos) {
      const cuenta = await obtenerCuentaActivaDeMesa(mesa.id);
      if (cuenta) cuentasMap[mesa.id] = cuenta;
    }
    setCuentas(cuentasMap);
    setCargando(false);
  }

  async function manejarAbrirMesa(mesa) {
    setProcesando(true);
    await abrirCuenta(mesa.id);
    await actualizarEstadoMesa(mesa.id, 'ocupada');
    await cargarDatos();
    setProcesando(false);
  }

  function manejarVerDetalles(mesa) {
    setMesaSeleccionada(mesa);
    setModalDetalle(true);
  }

  function manejarVerQR(mesa) {
    setMesaSeleccionada(mesa);
    setCopiado(false);
    setModalQR(true);
  }

  function solicitarEliminarMesa(mesa) {
    setMesaAEliminar(mesa);
    setErrorEliminar(null);
    setModalEliminar(true);
  }

  async function confirmarEliminarMesa() {
    if (!mesaAEliminar) return;
    setProcesando(true);
    setErrorEliminar(null);
    try {
      await eliminarMesa(mesaAEliminar.id);
      setModalEliminar(false);
      setMesaAEliminar(null);
      await cargarDatos();
    } catch (err) {
      console.error('Error al eliminar mesa:', err);
      setErrorEliminar(err?.message || 'No se pudo eliminar la mesa. Asegúrate de que no tenga pedidos o ventas vinculadas.');
    } finally {
      setProcesando(false);
    }
  }

  async function manejarCrearMesa(e) {
    e.preventDefault();
    if (!nombreNuevaMesa.trim()) return;
    setProcesando(true);
    try {
      const slug = nombreNuevaMesa.toLowerCase().replace(/\s+/g, '-');
      await crearMesa({
        nombre: nombreNuevaMesa.trim(),
        codigo_qr: slug,
        estado: 'disponible',
      });
      setNombreNuevaMesa('');
      setModalNuevaMesa(false);
      await cargarDatos();
    } finally {
      setProcesando(false);
    }
  }

  async function manejarRegistrarPago() {
    if (!mesaSeleccionada) return;
    const cuenta = cuentas[mesaSeleccionada.id];
    if (!cuenta) return;
    setProcesando(true);
    try {
      await registrarVenta({ cuenta_id: cuenta.id, mesa_id: mesaSeleccionada.id, total: cuenta.total, metodo_pago: metodoPago });
      await cerrarCuenta(cuenta.id);
      await actualizarEstadoMesa(mesaSeleccionada.id, 'disponible');
      await cargarDatos();
      setModalDetalle(false);
    } finally {
      setProcesando(false);
    }
  }

  const urlMesaActual = mesaSeleccionada ? `${baseUrl.replace(/\/$/, '')}/mesa/${mesaSeleccionada.codigo_qr}` : '';

  function copiarEnlace() {
    if (!urlMesaActual) return;
    navigator.clipboard.writeText(urlMesaActual);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function imprimirQR() {
    const ventanaImpresion = window.open('', '', 'width=600,height=700');
    const qrSvg = qrRef.current ? qrRef.current.outerHTML : '';
    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>QR ${mesaSeleccionada?.nombre} — BORONDO</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; background: #fff; color: #111; }
            .tarjeta-impresion { border: 2px solid #c9a84c; border-radius: 16px; padding: 30px; max-width: 380px; margin: 0 auto; }
            h1 { font-size: 28px; margin: 0 0 4px; color: #111; letter-spacing: 2px; }
            h2 { font-size: 22px; margin: 12px 0 20px; color: #c9a84c; }
            p { font-size: 14px; color: #666; margin-top: 16px; }
            .url-txt { font-size: 11px; color: #888; margin-top: 8px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="tarjeta-impresion">
            <h1>BORONDO</h1>
            <h2>${mesaSeleccionada?.nombre}</h2>
            <div style="display:flex; justify-content:center; margin: 20px 0;">${qrSvg}</div>
            <p>Escanea con tu celular para ver el menú y pedir</p>
            <div class="url-txt">${urlMesaActual}</div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  }

  if (cargando) return <CargandoSpinner mensaje="Cargando mesas..." tamano="grande" />;

  return (
    <div style={{ padding: 'var(--espacio-8)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-6)', animation: 'fadeIn 300ms ease both' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-3xl)', color: 'var(--texto-primario)' }}>
            Mesas
          </h1>
          <p style={{ color: 'var(--texto-terciario)', fontSize: 'var(--texto-sm)', marginTop: 4 }}>
            {mesas.length} mesas configuradas con código QR único
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-fantasma btn-sm" onClick={cargarDatos} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Actualizar
          </button>
          <button className="btn btn-primario btn-sm" onClick={() => setModalNuevaMesa(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Nueva mesa
          </button>
        </div>
      </div>

      {/* Grid de mesas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--espacio-4)' }}>
        {mesas.map(mesa => (
          <TarjetaMesa
            key={mesa.id}
            mesa={mesa}
            cuenta={cuentas[mesa.id]}
            alAbrir={manejarAbrirMesa}
            alVerDetalles={manejarVerDetalles}
            alVerQR={manejarVerQR}
            alEliminar={solicitarEliminarMesa}
          />
        ))}
      </div>

      {/* Modal Nueva Mesa */}
      <Modal abierto={modalNuevaMesa} alCerrar={() => setModalNuevaMesa(false)} titulo="Agregar nueva mesa">
        <form onSubmit={manejarCrearMesa} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="campo">
            <label>Nombre de la mesa <span className="requerido">*</span></label>
            <input
              type="text"
              required
              placeholder="Ej: Mesa 6, Barra 1, Terraza A..."
              value={nombreNuevaMesa}
              onChange={e => setNombreNuevaMesa(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-fantasma" onClick={() => setModalNuevaMesa(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={procesando}>
              {procesando ? 'Creando...' : 'Crear mesa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminar Mesa */}
      <Modal abierto={modalEliminar} alCerrar={() => { if (!procesando) setModalEliminar(false); }} titulo="Borrar mesa" ancho="440px">
        {mesaAEliminar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--rojo-error, #ef4444)',
                padding: 10,
                borderRadius: 'var(--radio-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <p style={{ fontSize: 'var(--texto-base)', color: 'var(--texto-primario)', fontWeight: 600 }}>
                  ¿Estás seguro de que deseas borrar &quot;{mesaAEliminar.nombre}&quot;?
                </p>
                <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--texto-terciario)', marginTop: 4 }}>
                  Esta acción eliminará la mesa y su código QR ({mesaAEliminar.codigo_qr}).
                </p>
              </div>
            </div>

            {mesaAEliminar.estado === 'ocupada' && (
              <div style={{
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: 'var(--radio-md)',
                padding: '10px 14px',
                fontSize: 'var(--texto-sm)',
                color: 'var(--amarillo-advertencia, #eab308)',
              }}>
                ⚠️ Esta mesa está actualmente ocupada. Debes cobrar o cerrar su cuenta antes de borrarla.
              </div>
            )}

            {errorEliminar && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radio-md)',
                padding: '10px 14px',
                fontSize: 'var(--texto-sm)',
                color: 'var(--rojo-claro, #f87171)',
              }}>
                {errorEliminar}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-fantasma"
                onClick={() => setModalEliminar(false)}
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-peligro"
                onClick={confirmarEliminarMesa}
                disabled={procesando || mesaAEliminar.estado === 'ocupada'}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={16} />
                {procesando ? 'Borrando...' : 'Sí, borrar mesa'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Detalle / Cobro de Cuenta */}
      <Modal abierto={modalDetalle} alCerrar={() => setModalDetalle(false)} titulo={`${mesaSeleccionada?.nombre} — Consumo y cobro`}>
        {mesaSeleccionada && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--texto-terciario)' }}>Estado actual</span>
              <EstadoBadge estado={mesaSeleccionada.estado} />
            </div>

            {cuentas[mesaSeleccionada.id] ? (
              <>
                <div style={{ background: 'var(--superficie-2)', borderRadius: 'var(--radio-md)', padding: 18, border: '1px solid var(--borde-normal)' }}>
                  <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-terciario)', marginBottom: 6 }}>TOTAL ACUMULADO</div>
                  <div style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-4xl)', fontWeight: 800, color: 'var(--dorado-puro)' }}>
                    ${Number(cuentas[mesaSeleccionada.id]?.total || 0).toFixed(2)}
                  </div>
                </div>
                <div className="campo">
                  <label>Método de pago recibido</label>
                  <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <button className="btn btn-primario btn-bloque btn-lg" onClick={manejarRegistrarPago} disabled={procesando}>
                  {procesando ? 'Registrando...' : 'Registrar pago y liberar mesa'}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ color: 'var(--texto-terciario)', textAlign: 'center', padding: '16px 0' }}>
                  Mesa disponible. Puedes abrirla para registrar pedidos o eliminarla si ya no la necesitas.
                </div>
                <button
                  className="btn btn-fantasma"
                  style={{
                    color: 'var(--rojo-claro, #f87171)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                  onClick={() => {
                    const m = mesaSeleccionada;
                    setModalDetalle(false);
                    solicitarEliminarMesa(m);
                  }}
                >
                  <Trash2 size={16} /> Borrar esta mesa
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal QR Real y Escaneable */}
      <Modal abierto={modalQR} alCerrar={() => setModalQR(false)} titulo={`Código QR — ${mesaSeleccionada?.nombre}`}>
        {mesaSeleccionada && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              display: 'inline-block',
              padding: 24,
              background: '#ffffff',
              borderRadius: 'var(--radio-xl)',
              boxShadow: 'var(--sombra-lg)',
              marginBottom: 16,
            }}>
              <QRCodeSVG
                ref={qrRef}
                value={urlMesaActual}
                size={240}
                level="H"
                includeMargin={false}
                fgColor="#0a0a0a"
                bgColor="#ffffff"
              />
            </div>

            <div style={{ fontFamily: 'var(--fuente-titular)', fontSize: 'var(--texto-2xl)', fontWeight: 800, color: 'var(--dorado-puro)', marginBottom: 4 }}>
              BORONDO
            </div>
            <div style={{ fontSize: 'var(--texto-base)', fontWeight: 600, color: 'var(--texto-primario)', marginBottom: 8 }}>
              {mesaSeleccionada.nombre}
            </div>

            {/* Selector / Visualizador de Dirección Host / IP */}
            <div style={{
              background: 'var(--superficie-2)',
              border: '1px solid var(--borde-normal)',
              borderRadius: 'var(--radio-md)',
              padding: '12px',
              fontSize: 'var(--texto-xs)',
              marginBottom: 16,
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--dorado-puro)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Globe size={14} /> Dirección del QR:
                </span>
                <button
                  type="button"
                  onClick={() => setEditandoBaseUrl(!editandoBaseUrl)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--texto-terciario)',
                    textDecoration: 'underline',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {editandoBaseUrl ? 'Guardar' : 'Cambiar IP / URL'}
                </button>
              </div>

              {editandoBaseUrl ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={e => setBaseUrl(e.target.value)}
                    placeholder="http://10.77.159.97:5173 o https://tuapp.vercel.app"
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-primario btn-sm"
                    onClick={() => setEditandoBaseUrl(false)}
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div style={{
                  fontFamily: 'monospace',
                  color: 'var(--texto-primario)',
                  wordBreak: 'break-all',
                  background: 'var(--superficie-1)',
                  padding: '6px 8px',
                  borderRadius: 'var(--radio-sm)',
                }}>
                  {urlMesaActual}
                </div>
              )}

              <div style={{ color: 'var(--texto-terciario)', fontSize: '11px' }}>
                📱 Tu celular debe estar conectado a la misma red WiFi para abrir la IP local.
              </div>
            </div>

            {/* Acciones de Copiar, Probar e Imprimir */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-fantasma btn-sm"
                onClick={copiarEnlace}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {copiado ? <Check size={14} color="var(--verde-exito-claro)" /> : <Copy size={14} />}
                {copiado ? '¡Copiado!' : 'Copiar enlace'}
              </button>
              <a
                href={urlMesaActual}
                target="_blank"
                rel="noreferrer"
                className="btn btn-fantasma btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
              >
                <ExternalLink size={14} /> Abrir menú
              </a>
              <button
                className="btn btn-primario btn-sm"
                onClick={imprimirQR}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={14} /> Imprimir QR
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


