// ============================================
// Servicio: Cuentas (vista acumulada de mesa)
// ============================================
import { supabase, supabaseConfigurado } from '../config/supabase.js';
import { cuentasMock } from '../datos/datosMock.js';

export async function obtenerCuentaActivaDeMesa(mesaId) {
  if (!supabaseConfigurado) {
    return cuentasMock.find(c => c.mesa_id === mesaId && (c.estado === 'abierta' || c.estado === 'pendiente_pago')) || null;
  }
  const { data, error } = await supabase
    .from('cuentas')
    .select('*')
    .eq('mesa_id', mesaId)
    .in('estado', ['abierta', 'pendiente_pago'])
    .order('abierta_en', { ascending: false })
    .maybeSingle();

  if (error) {
    console.error('Error al obtener cuenta activa:', error);
    return null;
  }
  return data || null;
}

export async function abrirCuenta(mesaId) {
  if (!supabaseConfigurado) {
    const nueva = { id: `cta-${Date.now()}`, mesa_id: mesaId, estado: 'abierta', total: 0, abierta_en: new Date().toISOString(), cerrada_en: null };
    cuentasMock.push(nueva);
    return nueva;
  }
  const { data, error } = await supabase.from('cuentas').insert({ mesa_id: mesaId, estado: 'abierta', total: 0 }).select().single();
  if (error) throw error;
  return data;
}

export async function actualizarTotalCuenta(id, total) {
  if (!supabaseConfigurado) {
    const cuenta = cuentasMock.find(c => c.id === id);
    if (cuenta) cuenta.total = total;
    return cuenta;
  }
  const { data, error } = await supabase.from('cuentas').update({ total }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function marcarCuentaPendientePago(id) {
  if (!supabaseConfigurado) {
    const cuenta = cuentasMock.find(c => c.id === id);
    if (cuenta) cuenta.estado = 'pendiente_pago';
    return cuenta;
  }
  const { data, error } = await supabase.from('cuentas').update({ estado: 'pendiente_pago' }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function cerrarCuenta(id) {
  if (!supabaseConfigurado) {
    const cuenta = cuentasMock.find(c => c.id === id);
    if (cuenta) { cuenta.estado = 'cerrada'; cuenta.cerrada_en = new Date().toISOString(); }
    return cuenta;
  }
  const { data, error } = await supabase.from('cuentas').update({ estado: 'cerrada', cerrada_en: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function obtenerCuentasConPedidos(mesaId) {
  if (!supabaseConfigurado) {
    const { pedidosMock } = await import('../datos/datosMock.js');
    return cuentasMock
      .filter(c => c.mesa_id === mesaId)
      .map(c => ({ ...c, pedidos: pedidosMock.filter(p => p.cuenta_id === c.id) }));
  }
  const { data, error } = await supabase
    .from('cuentas')
    .select(`*, pedidos:pedidos(*, detalles:detalles_pedido(*, producto:productos(nombre, precio_venta)))`)
    .eq('mesa_id', mesaId)
    .order('abierta_en', { ascending: false });
  if (error) throw error;
  return data;
}
