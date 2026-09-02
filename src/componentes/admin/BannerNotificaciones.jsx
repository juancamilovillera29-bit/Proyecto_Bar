// ============================================
// Componente: BannerNotificaciones
// Muestra alertas en tiempo real en el panel admin:
//  - Mesas que pidieron la cuenta
//  - Nuevos pedidos recibidos
// ============================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Receipt, ShoppingBag, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';
import { obtenerMesas } from '../../servicios/mesas.js';
import { obtenerPedidos } from '../../servicios/pedidos.js';
import { sonarSolicitudCuenta, sonarNuevoPedido } from '../../servicios/notificaciones.js';

function ToastNotif({ notif, alCerrar }) {
  const [visible, setVisible] = useState(true);

  function cerrar() {
    setVisible(false);
    setTimeout(alCerrar, 300);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: '14px',
        border: `1px solid ${notif.tipo === 'cuenta' ? '#e5a93c40' : '#4ade8040'}`,
        background: notif.tipo === 'cuenta' ? 'rgba(229,169,60,0.1)' : 'rgba(74,222,128,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
        animation: visible ? 'slideInRight 0.3s ease' : 'fadeOut 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        minWidth: 260,
        maxWidth: 320,
      }}
      onClick={cerrar}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: notif.tipo === 'cuenta' ? 'rgba(229,169,60,0.2)' : 'rgba(74,222,128,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {notif.tipo === 'cuenta'
          ? <Receipt size={18} color="#e5a93c" />
          : <ShoppingBag size={18} color="#4ade80" />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff', marginBottom: 2 }}>
          {notif.titulo}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#8f9098', lineHeight: 1.4 }}>
          {notif.mensaje}
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); cerrar(); }}
        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0, flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function BannerNotificaciones() {
  const [toasts, setToasts] = useState([]);
  const [silencio, setSilencio] = useState(false);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [alertasActivas, setAlertasActivas] = useState([]);
  const mesasPendientesRef = useRef(new Set());
  const pedidosRecibidosRef = useRef(new Set());
  const idNotifRef = useRef(0);

  function agregarToast(notif) {
    const id = ++idNotifRef.current;
    setToasts(prev => [{ ...notif, id }, ...prev].slice(0, 5));
    setAlertasActivas(prev => [{ ...notif, id, hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) }, ...prev].slice(0, 20));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  }

  const verificar = useCallback(async () => {
    try {
      // 1. Verificar mesas en pendiente_pago
      const mesas = await obtenerMesas();
      const pendientes = mesas.filter(m => m.estado === 'pendiente_pago');
      for (const mesa of pendientes) {
        if (!mesasPendientesRef.current.has(mesa.id)) {
          mesasPendientesRef.current.add(mesa.id);
          if (!silencio) sonarSolicitudCuenta();
          agregarToast({
            tipo: 'cuenta',
            titulo: '💳 Solicitud de cuenta',
            mensaje: `${mesa.nombre} está pidiendo la factura`,
          });
        }
      }
      // Limpiar mesas que ya no están pendientes
      for (const id of mesasPendientesRef.current) {
        if (!pendientes.find(m => m.id === id)) {
          mesasPendientesRef.current.delete(id);
        }
      }

      // 2. Verificar nuevos pedidos en estado 'recibido'
      const pedidos = await obtenerPedidos({ estado: 'recibido' });
      for (const ped of pedidos) {
        if (!pedidosRecibidosRef.current.has(ped.id)) {
          pedidosRecibidosRef.current.add(ped.id);
          if (!silencio) sonarNuevoPedido();
          const nombreMesa = ped.mesa?.nombre || 'Mesa desconocida';
          const nItems = (ped.detalles || []).reduce((s, d) => s + (Number(d.cantidad) || 1), 0);
          agregarToast({
            tipo: 'pedido',
            titulo: '🆕 Nuevo pedido',
            mensaje: `${nombreMesa} — ${nItems} ítem${nItems !== 1 ? 's' : ''}`,
          });
        }
      }
      // Limpiar pedidos que ya no están en 'recibido' (avanzaron de estado)
      for (const id of pedidosRecibidosRef.current) {
        if (!pedidos.find(p => p.id === id)) {
          pedidosRecibidosRef.current.delete(id);
        }
      }
    } catch (e) {
      // silencioso
    }
  }, [silencio]);

  useEffect(() => {
    verificar();
    const intervalo = setInterval(verificar, 4000);
    return () => clearInterval(intervalo);
  }, [verificar]);

  const totalAlertas = alertasActivas.length;

  return (
    <>
      {/* ── CSS de animaciones ── */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-8px); }
        }
        @keyframes pulse-bell {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-18deg); }
          30% { transform: rotate(18deg); }
          45% { transform: rotate(-12deg); }
          60% { transform: rotate(12deg); }
          75% { transform: rotate(-6deg); }
          90% { transform: rotate(6deg); }
        }
      `}</style>

      {/* ── Campana flotante en la esquina superior derecha ── */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        {/* Botón campana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setSilencio(s => !s)}
            title={silencio ? 'Activar sonidos' : 'Silenciar'}
            style={{
              background: '#19191d',
              border: '1px solid #282832',
              borderRadius: '50%',
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: silencio ? '#6b7280' : '#e5a93c',
              cursor: 'pointer',
            }}
          >
            {silencio ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            onClick={() => setPanelAbierto(p => !p)}
            style={{
              background: '#19191d',
              border: `1px solid ${totalAlertas > 0 ? '#e5a93c60' : '#282832'}`,
              borderRadius: '20px',
              padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#ffffff',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Bell
              size={18}
              color={totalAlertas > 0 ? '#e5a93c' : '#8f9098'}
              style={{ animation: totalAlertas > 0 ? 'pulse-bell 0.8s ease' : 'none' }}
            />
            {totalAlertas > 0 && (
              <span style={{
                background: '#e5a93c',
                color: '#121214',
                borderRadius: '50%',
                width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 800,
                position: 'absolute',
                top: -6, right: -6,
              }}>
                {totalAlertas > 9 ? '9+' : totalAlertas}
              </span>
            )}
            {panelAbierto ? <ChevronUp size={14} color="#8f9098" /> : <ChevronDown size={14} color="#8f9098" />}
          </button>
        </div>

        {/* Panel de historial de alertas */}
        {panelAbierto && (
          <div style={{
            background: '#19191d',
            border: '1px solid #282832',
            borderRadius: '16px',
            padding: '16px',
            width: 310,
            maxHeight: 380,
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>
                Notificaciones
              </span>
              {alertasActivas.length > 0 && (
                <button
                  onClick={() => { setAlertasActivas([]); pedidosRecibidosRef.current.clear(); mesasPendientesRef.current.clear(); }}
                  style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.78rem' }}
                >
                  Limpiar todas
                </button>
              )}
            </div>
            {alertasActivas.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px 0', fontSize: '0.85rem' }}>
                Sin notificaciones recientes
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {alertasActivas.map(a => (
                  <div key={a.id} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: a.tipo === 'cuenta' ? 'rgba(229,169,60,0.08)' : 'rgba(74,222,128,0.07)',
                    border: `1px solid ${a.tipo === 'cuenta' ? '#e5a93c25' : '#4ade8025'}`,
                  }}>
                    <div style={{ marginTop: 2 }}>
                      {a.tipo === 'cuenta'
                        ? <Receipt size={14} color="#e5a93c" />
                        : <ShoppingBag size={14} color="#4ade80" />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#d4d4d8' }}>{a.titulo}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{a.mensaje}</div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#4b5563', flexShrink: 0 }}>{a.hora}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Toast popups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map(t => (
            <ToastNotif
              key={t.id}
              notif={t}
              alCerrar={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            />
          ))}
        </div>
      </div>
    </>
  );
}
