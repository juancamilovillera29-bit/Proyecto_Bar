// ============================================
// Servicio: Notificaciones del sistema
// Sonidos y alertas para KDS y panel admin
// ============================================

/**
 * Genera un tono de beep usando la Web Audio API del navegador.
 * No requiere ningún archivo de audio externo.
 */
function beep({ frecuencia = 440, duracion = 300, volumen = 0.4, tipo = 'sine' } = {}) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frecuencia;
    osc.type = tipo;
    gain.gain.setValueAtTime(volumen, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracion / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duracion / 1000);
    osc.onended = () => ctx.close();
  } catch (_) {
    // El navegador puede bloquear el audio hasta que haya interacción del usuario
  }
}

/** Sonido de nuevo pedido — doble beep agudo */
export function sonarNuevoPedido() {
  beep({ frecuencia: 880, duracion: 180, volumen: 0.4 });
  setTimeout(() => beep({ frecuencia: 1100, duracion: 180, volumen: 0.35 }), 220);
}

/** Sonido de alerta de cuenta — triple tono grave */
export function sonarSolicitudCuenta() {
  beep({ frecuencia: 520, duracion: 200, volumen: 0.5 });
  setTimeout(() => beep({ frecuencia: 520, duracion: 200, volumen: 0.5 }), 280);
  setTimeout(() => beep({ frecuencia: 660, duracion: 350, volumen: 0.5 }), 560);
}
