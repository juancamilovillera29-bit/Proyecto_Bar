import { Link } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';

export function DespedidaCliente({ codigoQr, mesaNombre, children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#121214', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, color: '#ffffff' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, width: '100%', animation: 'fadeIn 400ms ease both' }}>
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
          letterSpacing: '0.05em',
        }}>
          <Lock size={13} />
          Sesión finalizada
        </div>

        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(229, 169, 60, 0.15)', border: '2px solid #e5a93c',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 0 24px rgba(229, 169, 60, 0.35)',
        }}>
          <CheckCircle2 size={40} color="#e5a93c" />
        </div>

        <h2 style={{ fontFamily: 'var(--fuente-titular, sans-serif)', fontSize: '1.8rem', color: '#ffffff', marginBottom: 10 }}>
          ¡Gracias por visitarnos!
        </h2>
        <p style={{ color: '#a1a1aa', marginBottom: 20, lineHeight: 1.6, fontSize: '0.95rem' }}>
          La cuenta de <strong>{mesaNombre || 'esta mesa'}</strong> ya fue solicitada y no se pueden enviar más pedidos. Un mesero se acercará para recibir tu pago.
        </p>

        {children}

        <div style={{ marginTop: 20 }}>
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
