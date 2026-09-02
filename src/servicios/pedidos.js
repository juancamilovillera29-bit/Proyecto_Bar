// ============================================
// Servicio: Pedidos
// ============================================
import { supabase, supabaseConfigurado } from '../config/supabase.js';
import { pedidosMock } from '../datos/datosMock.js';

export async function obtenerPedidos(filtros = {}) {
  if (!supabaseConfigurado) {
    let resultado = [...pedidosMock];
    if (filtros.estado) resultado = resultado.filter(p => p.estado === filtros.estado);
    if (filtros.mesa_id) resultado = resultado.filter(p => p.mesa_id === filtros.mesa_id);
    return resultado;
  }
  let consulta = supabase
    .from('pedidos')
    .select(`
      *,
      mesa:mesas(nombre),
      detalles:detalles_pedido(*, producto:productos(nombre, imagen_url))
    `)
    .order('creado_en', { ascending: false });

  if (filtros.estado) consulta = consulta.eq('estado', filtros.estado);
  if (filtros.mesa_id) consulta = consulta.eq('mesa_id', filtros.mesa_id);
  if (filtros.cuenta_id) consulta = consulta.eq('cuenta_id', filtros.cuenta_id);

  const { data, error } = await consulta;
  if (error) throw error;
  return data;
}

export async function crearPedido(datos) {
  const { detalles, ...datosPedido } = datos;

  if (!supabaseConfigurado) {
    const nuevoPedido = {
      ...datosPedido,
      id: `ped-${Date.now()}`,
      estado: 'recibido',
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
      detalles: detalles.map((d, i) => ({ ...d, id: `det-${Date.now()}-${i}` })),
      mesa: { numero: parseInt(datosPedido.mesa_id.split('-')[1]) || 1 },
    };
    pedidosMock.unshift(nuevoPedido);
    return nuevoPedido;
  }

  // Crear pedido
  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .insert(datosPedido)
    .select()
    .single();
  if (errorPedido) throw errorPedido;

  // Crear detalles
  const detallesConId = detalles.map(d => ({ ...d, pedido_id: pedido.id }));
  const { error: errorDetalles } = await supabase.from('detalles_pedido').insert(detallesConId);
  if (errorDetalles) throw errorDetalles;

  // Actualizar total de cuenta
  const totalPedido = detalles.reduce((s, d) => s + d.precio_unitario * d.cantidad, 0);
  if (datosPedido.cuenta_id) {
    await supabase.rpc('incrementar_total_cuenta', {
      p_cuenta_id: datosPedido.cuenta_id,
      p_monto: totalPedido,
    }).catch(() => null); // Fallback: ignorar si el RPC no existe
  }

  return pedido;
}

export async function actualizarEstadoPedido(id, estado) {
  if (!supabaseConfigurado) {
    const pedido = pedidosMock.find(p => p.id === id);
    if (pedido) {
      pedido.estado = estado;
      pedido.actualizado_en = new Date().toISOString();
    }
    return pedido;
  }
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado, actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
