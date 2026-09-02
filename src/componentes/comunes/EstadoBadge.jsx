// ============================================
// Componente: EstadoBadge — Badge de estado
// ============================================
export function EstadoBadge({ estado, tipo = 'pedido' }) {
  const etiquetas = {
    // Estados de mesa
    disponible:    'Disponible',
    ocupada:       'Ocupada',
    pendiente_pago: 'Pendiente',
    cerrada:       'Cerrada',
    // Estados de pedido
    recibido:      'Recibido',
    en_preparacion: 'En preparación',
    listo:         'Listo',
    entregado:     'Entregado',
    cancelado:     'Cancelado',
    // Estados de cuenta
    abierta:       'Abierta',
    pagada:        'Pagada',
    // Métodos de pago
    efectivo:      'Efectivo',
    transferencia: 'Transferencia',
  };

  return (
    <span className={`badge badge-${estado}`}>
      {etiquetas[estado] ?? estado}
    </span>
  );
}
