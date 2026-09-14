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

  if (!detalles || detalles.length === 0) {
    throw new Error('El pedido debe contener al menos un producto.');
  }

  if (!supabaseConfigurado) {
    // Validar stock en mock
    for (const d of detalles) {
      const prod = productosMock.find(p => p.id === d.producto_id);
      const stockDisponible = prod ? (typeof prod.stock === 'number' ? prod.stock : parseInt(prod.stock ?? '0', 10)) : 0;
      if (!prod || stockDisponible < d.cantidad) {
        throw new Error(`Stock insuficiente para "${prod?.nombre || 'Producto'}". Disponibles: ${stockDisponible}, solicitados: ${d.cantidad}`);
      }
    }

    // Descontar stock en mock
    for (const d of detalles) {
      const prod = productosMock.find(p => p.id === d.producto_id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - d.cantidad);
      }
    }

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

  // 1. Validar stock en Supabase antes de crear el pedido
  const idsProductos = detalles.map(d => d.producto_id);
  const { data: prodsBD, error: errorProds } = await supabase
    .from('productos')
    .select('id, nombre, stock')
    .in('id', idsProductos);

  if (errorProds) throw errorProds;

  for (const d of detalles) {
    const p = prodsBD?.find(item => item.id === d.producto_id);
    const stockActual = p ? (typeof p.stock === 'number' ? p.stock : parseInt(p.stock ?? '0', 10)) : 0;
    if (!p || stockActual < d.cantidad) {
      throw new Error(`Stock insuficiente para "${p?.nombre || 'Producto'}". Disponibles: ${stockActual}, solicitados: ${d.cantidad}`);
    }
  }

  // 2. Verificar o crear una cuenta activa (abierta) para la mesa
  let idCuentaValida = datosPedido.cuenta_id;
  try {
    if (idCuentaValida) {
      const { data: cExistente } = await supabase
        .from('cuentas')
        .select('id, estado')
        .eq('id', idCuentaValida)
        .maybeSingle();

      if (!cExistente || cExistente.estado !== 'abierta') {
        idCuentaValida = null;
      }
    }

    if (!idCuentaValida && datosPedido.mesa_id) {
      // Buscar si ya hay una cuenta abierta para esta mesa
      const { data: cActiva } = await supabase
        .from('cuentas')
        .select('id')
        .eq('mesa_id', datosPedido.mesa_id)
        .eq('estado', 'abierta')
        .order('abierta_en', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cActiva) {
        idCuentaValida = cActiva.id;
      } else {
        // Cerrar cuentas viejas y crear una cuenta nueva abierta
        await supabase
          .from('cuentas')
          .update({ estado: 'cerrada', cerrada_en: new Date().toISOString() })
          .eq('mesa_id', datosPedido.mesa_id)
          .in('estado', ['abierta', 'pendiente_pago']);

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

  // 3. Crear pedido
  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .insert(payloadPedido)
    .select()
    .single();
  if (errorPedido) throw errorPedido;

  // 4. Crear detalles
  const detallesConId = detalles.map(d => ({ ...d, pedido_id: pedido.id }));
  const { error: errorDetalles } = await supabase.from('detalles_pedido').insert(detallesConId);
  if (errorDetalles) {
    console.error('Error al insertar detalles de pedido:', errorDetalles);
    throw errorDetalles;
  }

  // 5. Descontar stock en la tabla productos y registrar movimientos de inventario
  try {
    for (const d of detalles) {
      const p = prodsBD?.find(item => item.id === d.producto_id);
      const stockActual = p ? (typeof p.stock === 'number' ? p.stock : parseInt(p.stock ?? '0', 10)) : 0;
      const nuevoStock = Math.max(0, stockActual - d.cantidad);
      
      // Actualizar tabla productos
      await supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', d.producto_id);

      // Registrar movimiento de inventario (actualiza inventario por trigger o update)
      await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: d.producto_id,
          tipo: 'salida',
          cantidad: d.cantidad,
          motivo: `Pedido mesa (ID: ${pedido.id.slice(0, 8)})`,
        });
    }
  } catch (errStock) {
    console.warn('Advertencia al descontar stock en base de datos:', errStock);
  }

  // 6. Actualizar mesa a ocupada automáticamente
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

  // 7. Actualizar el total acumulado en la tabla cuentas (columna 'total')
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
      const estadoAnterior = pedido.estado;
      pedido.estado = estado;
      pedido.actualizado_en = new Date().toISOString();

      // Si se cancela, devolver stock
      if (estado === 'cancelado' && estadoAnterior !== 'cancelado' && pedido.detalles) {
        for (const d of pedido.detalles) {
          const prod = productosMock.find(p => p.id === d.producto_id);
          if (prod) {
            prod.stock = (prod.stock || 0) + (d.cantidad || 1);
          }
        }
      }
    }
    return pedido;
  }

  // Obtener estado anterior y detalles si se va a cancelar
  let pedidoPrevio = null;
  if (estado === 'cancelado') {
    const { data: pData } = await supabase
      .from('pedidos')
      .select('estado, detalles:detalles_pedido(*)')
      .eq('id', id)
      .single();
    pedidoPrevio = pData;
  }

  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado, actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // Si se canceló el pedido, reponer stock
  if (estado === 'cancelado' && pedidoPrevio && pedidoPrevio.estado !== 'cancelado' && pedidoPrevio.detalles) {
    try {
      for (const d of pedidoPrevio.detalles) {
        const { data: prodData } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', d.producto_id)
          .single();
        
        const stockActual = prodData ? (typeof prodData.stock === 'number' ? prodData.stock : parseInt(prodData.stock ?? '0', 10)) : 0;
        const nuevoStock = stockActual + (d.cantidad || 1);

        await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', d.producto_id);

        await supabase
          .from('movimientos_inventario')
          .insert({
            producto_id: d.producto_id,
            tipo: 'entrada',
            cantidad: d.cantidad || 1,
            motivo: `Cancelación pedido (ID: ${id.slice(0, 8)})`,
          });
      }
    } catch (eReponer) {
      console.warn('Error al reponer stock tras cancelar pedido:', eReponer);
    }
  }

  return data;
}
