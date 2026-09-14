// ============================================
// Servicio: Inventario
// ============================================
import { supabase, supabaseConfigurado } from '../config/supabase.js';
import { inventarioMock, movimientosInventarioMock, productosMock } from '../datos/datosMock.js';

export async function obtenerInventario() {
  if (!supabaseConfigurado) return [...inventarioMock];
  const { data, error } = await supabase
    .from('inventario')
    .select('*, producto:productos(nombre, precio_venta, imagen_url, activo)')
    .order('actualizado_en', { ascending: false });
  if (error) throw error;
  return data;
}

export async function obtenerMovimientos(limite = 50) {
  if (!supabaseConfigurado) return movimientosInventarioMock.slice(0, limite);
  const { data, error } = await supabase
    .from('movimientos_inventario')
    .select('*, producto:productos(nombre)')
    .order('creado_en', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data;
}

export async function registrarMovimiento(datos) {
  if (!supabaseConfigurado) {
    const nuevo = { ...datos, id: `mov-${Date.now()}`, creado_en: new Date().toISOString() };
    movimientosInventarioMock.unshift(nuevo);
    // Actualizar stock en mock
    const inv = inventarioMock.find(i => i.producto_id === datos.producto_id);
    const prod = productosMock.find(p => p.id === datos.producto_id);
    if (inv) {
      if (datos.tipo === 'entrada') inv.stock_actual += datos.cantidad;
      else if (datos.tipo === 'salida') inv.stock_actual = Math.max(0, inv.stock_actual - datos.cantidad);
      else if (datos.tipo === 'ajuste') inv.stock_actual = datos.cantidad;
      inv.actualizado_en = new Date().toISOString();
    }
    if (prod) {
      if (datos.tipo === 'entrada') prod.stock = (prod.stock || 0) + datos.cantidad;
      else if (datos.tipo === 'salida') prod.stock = Math.max(0, (prod.stock || 0) - datos.cantidad);
      else if (datos.tipo === 'ajuste') prod.stock = datos.cantidad;
    }
    return nuevo;
  }

  // 1. Insertar movimiento
  const { data, error } = await supabase.from('movimientos_inventario').insert(datos).select().single();
  if (error) throw error;

  // 2. Sincronizar explícitamente tabla productos por si los triggers de BD no están activos
  try {
    const { data: prodActual } = await supabase
      .from('productos')
      .select('stock')
      .eq('id', datos.producto_id)
      .single();
    
    if (prodActual) {
      const stockPrev = typeof prodActual.stock === 'number' ? prodActual.stock : parseInt(prodActual.stock ?? '0', 10);
      let nuevoStock = stockPrev;
      if (datos.tipo === 'entrada') nuevoStock = stockPrev + datos.cantidad;
      else if (datos.tipo === 'salida') nuevoStock = Math.max(0, stockPrev - datos.cantidad);
      else if (datos.tipo === 'ajuste') nuevoStock = datos.cantidad;

      await supabase.from('productos').update({ stock: nuevoStock }).eq('id', datos.producto_id);
      await supabase.from('inventario').update({ stock_actual: nuevoStock, actualizado_en: new Date().toISOString() }).eq('producto_id', datos.producto_id);
    }
  } catch (e) {
    console.warn('Error al sincronizar stock de producto tras movimiento:', e);
  }

  return data;
}

export async function obtenerAlertasStockBajo() {
  const inventario = await obtenerInventario();
  return inventario.filter(i => i.stock_actual <= i.stock_minimo);
}

/**
 * Descuenta del inventario todos los productos consumidos en una lista de pedidos.
 * @param {Array} pedidos - Lista de pedidos con sus detalles (detalles_pedido con producto_id y cantidad)
 * @param {string} motivo - Descripción del motivo (ej. "Venta mesa-2")
 */
export async function descontarStockPorPedidos(pedidos, motivo = 'Venta consumida') {
  // Agrupa las cantidades por producto_id para hacer un solo movimiento por producto
  const consumoPorProducto = {};

  for (const pedido of pedidos) {
    for (const detalle of (pedido.detalles || [])) {
      const pid = detalle.producto_id;
      if (!pid) continue;
      consumoPorProducto[pid] = (consumoPorProducto[pid] || 0) + (Number(detalle.cantidad) || 1);
    }
  }

  const entradas = Object.entries(consumoPorProducto);
  if (entradas.length === 0) return;

  if (!supabaseConfigurado) {
    // En modo mock, descontar del inventario y productos simulados
    for (const [producto_id, cantidad] of entradas) {
      const inv = inventarioMock.find(i => i.producto_id === producto_id);
      const prod = productosMock.find(p => p.id === producto_id);
      if (inv) inv.stock_actual = Math.max(0, inv.stock_actual - cantidad);
      if (prod) prod.stock = Math.max(0, (prod.stock || 0) - cantidad);
    }
    return;
  }

  for (const [producto_id, cantidad] of entradas) {
    try {
      const { data: prodActual } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', producto_id)
        .single();
      
      const stockPrev = prodActual ? (typeof prodActual.stock === 'number' ? prodActual.stock : parseInt(prodActual.stock ?? '0', 10)) : 0;
      const nuevoStock = Math.max(0, stockPrev - cantidad);

      await supabase.from('productos').update({ stock: nuevoStock }).eq('id', producto_id);
      await supabase.from('inventario').update({ stock_actual: nuevoStock, actualizado_en: new Date().toISOString() }).eq('producto_id', producto_id);
      
      await supabase.from('movimientos_inventario').insert({
        producto_id,
        tipo: 'salida',
        cantidad,
        motivo,
      });
    } catch (e) {
      console.warn('Error al descontar stock por producto:', e);
    }
  }
}

