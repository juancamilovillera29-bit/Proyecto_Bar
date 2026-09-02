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
  if (errorDetalles) {
    console.error('Error al insertar detalles de pedido:', errorDetalles);
    throw errorDetalles;
  }

  // Actualizar mesa a ocupada automáticamente
  if (datosPedido.mesa_id) {
    try {
      await supabase
        .from('mesas')
        .update({ estado: 'ocupada', actualizado_en: new Date().toISOString() })
        .eq('id', datosPedido.mesa_id);
    } catch (e) {
      console.warn('No se pudo actualizar estado de la mesa:', e);
    }
  }

  // Actualizar total de cuenta
  const totalPedido = detalles.reduce((s, d) => s + (Number(d.precio_unitario) || 0) * (Number(d.cantidad) || 1), 0);
  if (datosPedido.cuenta_id) {
    try {
      const { data: cData } = await supabase
        .from('cuentas')
        .select('total_acumulado')
        .eq('id', datosPedido.cuenta_id)
        .single();
      if (cData) {
        const nuevoTotal = (Number(cData.total_acumulado) || 0) + totalPedido;
        await supabase
          .from('cuentas')
          .update({ total_acumulado: nuevoTotal, actualizado_en: new Date().toISOString() })
          .eq('id', datosPedido.cuenta_id);
      }
    } catch (e) {
      console.warn('No se pudo actualizar total_acumulado de cuenta:', e);
    }
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
