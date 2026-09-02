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

  // 1. Verificar o crear una cuenta activa (abierta) para la mesa
  let idCuentaValida = datosPedido.cuenta_id;
  try {
    if (idCuentaValida) {
      const { data: cExistente } = await supabase
        .from('cuentas')
        .select('id, estado')
        .eq('id', idCuentaValida)
        .maybeSingle();

      if (!cExistente || cExistente.estado === 'cerrada') {
        idCuentaValida = null;
      }
    }

    if (!idCuentaValida && datosPedido.mesa_id) {
      // Buscar si ya hay una cuenta abierta para esta mesa
      const { data: cActiva } = await supabase
        .from('cuentas')
        .select('id')
        .eq('mesa_id', datosPedido.mesa_id)
        .in('estado', ['abierta', 'pendiente_pago'])
        .order('abierta_en', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cActiva) {
        idCuentaValida = cActiva.id;
      } else {
        // Crear una cuenta nueva abierta
        const { data: cNueva } = await supabase
          .from('cuentas')
          .insert({ mesa_id: datosPedido.mesa_id, estado: 'abierta', total: 0 })
          .select()
          .single();
        if (cNueva) idCuentaValida = cNueva.id;
      }
    }
  } catch (e) {
    console.warn('Error al verificar cuenta de mesa en crearPedido:', e);
  }

  const payloadPedido = {
    ...datosPedido,
    cuenta_id: idCuentaValida || null,
  };

  // 2. Crear pedido
  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .insert(payloadPedido)
    .select()
    .single();
  if (errorPedido) throw errorPedido;

  // 3. Crear detalles
  const detallesConId = detalles.map(d => ({ ...d, pedido_id: pedido.id }));
  const { error: errorDetalles } = await supabase.from('detalles_pedido').insert(detallesConId);
  if (errorDetalles) {
    console.error('Error al insertar detalles de pedido:', errorDetalles);
    throw errorDetalles;
  }

  // 4. Actualizar mesa a ocupada automáticamente
  if (datosPedido.mesa_id) {
    try {
      await supabase
        .from('mesas')
        .update({ estado: 'ocupada' })
        .eq('id', datosPedido.mesa_id);
    } catch (e) {
      console.warn('No se pudo actualizar estado de la mesa:', e);
    }
  }

  // 5. Actualizar el total acumulado en la tabla cuentas (columna 'total')
  const totalPedido = detalles.reduce((s, d) => s + (Number(d.precio_unitario) || 0) * (Number(d.cantidad) || 1), 0);
  if (idCuentaValida) {
    try {
      const { data: cData } = await supabase
        .from('cuentas')
        .select('total')
        .eq('id', idCuentaValida)
        .single();
      const totalPrevio = Number(cData?.total) || 0;
      const nuevoTotal = totalPrevio + totalPedido;
      await supabase
        .from('cuentas')
        .update({ total: nuevoTotal })
        .eq('id', idCuentaValida);
    } catch (e) {
      console.warn('No se pudo actualizar total de cuenta:', e);
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
