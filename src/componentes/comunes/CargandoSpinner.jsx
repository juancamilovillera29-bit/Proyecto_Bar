// ============================================
// Componente: CargandoSpinner
// ============================================
export function CargandoSpinner({ mensaje = 'Cargando...', tamano = 'normal' }) {
  return (
    <div className="cargando-pantalla">
      <div className={`spinner ${tamano === 'grande' ? 'spinner-lg' : ''}`} />
      <span style={{ color: 'var(--texto-terciario)', fontSize: 'var(--texto-sm)' }}>
        {mensaje}
      </span>
    </div>
  );
}
