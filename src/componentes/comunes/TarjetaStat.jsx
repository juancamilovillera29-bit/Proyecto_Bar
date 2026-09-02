// ============================================
// Componente: TarjetaStat — Estadística del dashboard
// ============================================
export function TarjetaStat({ titulo, valor, icono: Icono, color = 'dorado', tendencia, sufijo = '' }) {
  const colores = {
    dorado: { bg: 'var(--dorado-muy-suave)', color: 'var(--dorado-puro)' },
    verde:  { bg: 'var(--verde-bg)',         color: 'var(--verde-exito-claro)' },
    rojo:   { bg: 'var(--rojo-bg)',          color: 'var(--rojo-claro)' },
    azul:   { bg: 'var(--azul-bg)',          color: 'var(--azul-info)' },
  };

  const paleta = colores[color] || colores.dorado;

  return (
    <div className="tarjeta" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--texto-terciario)', fontWeight: 'var(--peso-medio)' }}>
          {titulo}
        </span>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radio-md)',
          background: paleta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icono size={20} color={paleta.color} />
        </div>
      </div>
      <div>
        <div style={{
          fontFamily: 'var(--fuente-titular)',
          fontSize: 'var(--texto-3xl)',
          fontWeight: 'var(--peso-bold)',
          color: 'var(--texto-primario)',
          lineHeight: 1,
        }}>
          {valor}{sufijo}
        </div>
        {tendencia && (
          <div style={{ marginTop: 6, fontSize: 'var(--texto-xs)', color: 'var(--texto-terciario)' }}>
            {tendencia}
          </div>
        )}
      </div>
    </div>
  );
}
