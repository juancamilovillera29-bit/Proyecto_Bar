// ============================================
// Componente: TarjetaMesa — Vista limpia de mesa
// ============================================
import { DollarSign, QrCode, Trash2 } from 'lucide-react';
import { EstadoBadge } from '../comunes/EstadoBadge.jsx';
import { formatearPrecio } from '../cliente/TarjetaProducto.jsx';

const coloresMesa = {
  disponible:     { borde: 'var(--borde-sutil)',    fondo: 'var(--superficie-1)', acento: 'var(--verde-exito-claro)' },
  ocupada:        { borde: 'var(--dorado-opaco)',   fondo: 'var(--superficie-1)', acento: 'var(--dorado-puro)' },
  pendiente_pago: { borde: 'var(--amarillo-advertencia)', fondo: 'var(--superficie-1)', acento: 'var(--amarillo-advertencia)' },
  cerrada:        { borde: 'var(--borde-sutil)',    fondo: 'var(--negro-profundo)', acento: 'var(--texto-muted)' },
};

export function TarjetaMesa({ mesa, cuenta, alAbrir, alCerrar, alVerDetalles, alVerQR, alEliminar }) {
  const estilo = coloresMesa[mesa.estado] || coloresMesa.disponible;
  const estaDisponible = mesa.estado === 'disponible';

  return (
    <div
      onClick={() => alVerDetalles?.(mesa)}
      style={{
        background: estilo.fondo,
        border: `1px solid ${estilo.borde}`,
        borderRadius: 'var(--radio-xl)',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all var(--transicion-normal)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = estilo.acento;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = estilo.borde;
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Indicador dorado superior para mesas ocupadas */}
      {mesa.estado === 'ocupada' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, var(--dorado-puro), var(--dorado-suave))`,
          borderRadius: 'var(--radio-xl) var(--radio-xl) 0 0',
        }} />
      )}

      {/* Encabezado: Solo Nombre de la Mesa y Estado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          fontFamily: 'var(--fuente-titular)',
          fontWeight: 800, fontSize: '1.4rem',
          color: mesa.estado === 'ocupada' ? 'var(--dorado-puro)' : 'var(--texto-primario)',
        }}>
          {mesa.nombre}
        </div>
        <EstadoBadge estado={mesa.estado} />
      </div>

      {/* Información de consumo activo */}
      {cuenta ? (
        <div style={{ borderTop: '1px solid var(--borde-sutil)', paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--texto-terciario)', fontSize: 'var(--texto-xs)' }}>
              <DollarSign size={13} />
              <span>Consumo</span>
            </div>
            <div style={{ fontFamily: 'var(--fuente-titular)', fontWeight: 700, fontSize: 'var(--texto-lg)', color: 'var(--dorado-puro)' }}>
              {formatearPrecio(cuenta.total)}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--texto-muted)' }}>
          Código QR: {mesa.codigo_qr}
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }} onClick={e => e.stopPropagation()}>
        {estaDisponible ? (
          <button
            className="btn btn-primario btn-sm"
            style={{ flex: 1 }}
            onClick={() => alAbrir?.(mesa)}
          >
            Abrir mesa
          </button>
        ) : (
          <button
            className="btn btn-fantasma btn-sm"
            style={{ flex: 1 }}
            onClick={() => alVerDetalles?.(mesa)}
          >
            Ver cuenta
          </button>
        )}
        <button
          className="btn btn-fantasma btn-sm"
          onClick={() => alVerQR?.(mesa)}
          title="Ver código QR para imprimir"
          style={{ padding: '0 10px' }}
        >
          <QrCode size={16} color="var(--dorado-puro)" />
        </button>
        <button
          className="btn btn-fantasma btn-sm"
          onClick={() => alEliminar?.(mesa)}
          title="Borrar mesa"
          style={{
            padding: '0 10px',
            color: 'var(--rojo-claro, #f87171)',
            borderColor: 'transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--rojo-error, #ef4444)';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
