// ============================================
// Componente: Modal — Contenedor modal reutilizable
// ============================================
import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ abierto, alCerrar, titulo, children, ancho = '540px' }) {
  // Bloquear scroll del body al abrir
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) alCerrar(); }}>
      <div className="modal-contenido" style={{ maxWidth: ancho }}>
        <div className="modal-encabezado">
          <h3 className="modal-titulo">{titulo}</h3>
          <button className="modal-cerrar" onClick={alCerrar} aria-label="Cerrar modal">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
