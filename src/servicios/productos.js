// ============================================
// Servicio: Productos
// ============================================
import { supabase, supabaseConfigurado } from '../config/supabase.js';
import { productosMock, inventarioMock } from '../datos/datosMock.js';

export async function obtenerProductos(soloActivos = false) {
  if (!supabaseConfigurado) {
    return soloActivos ? productosMock.filter(p => p.activo) : productosMock;
  }
  let consulta = supabase.from('productos').select('*').order('nombre');
  if (soloActivos) consulta = consulta.eq('activo', true);
  const { data, error } = await consulta;
  if (error) throw error;
  return data;
}

export async function obtenerProductoPorId(id) {
  if (!supabaseConfigurado) return productosMock.find(p => p.id === id) || null;
  const { data, error } = await supabase.from('productos').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function crearProducto(datos) {
  if (!supabaseConfigurado) {
    const nuevo = { ...datos, id: `prod-${Date.now()}`, creado_en: new Date().toISOString() };
    productosMock.push(nuevo);
    return nuevo;
  }
  const { data, error } = await supabase.from('productos').insert(datos).select().single();
  if (error) throw error;
  // Crear registro en inventario al crear producto
  await supabase.from('inventario').insert({
    producto_id: data.id,
    stock_actual: datos.stock || 0,
    stock_minimo: datos.stock_minimo || 5,
  });
  return data;
}

export async function actualizarProducto(id, datos) {
  if (!supabaseConfigurado) {
    const idx = productosMock.findIndex(p => p.id === id);
    if (idx !== -1) {
      Object.assign(productosMock[idx], datos);
      const inv = inventarioMock.find(i => i.producto_id === id);
      if (inv) {
        if (datos.stock !== undefined) inv.stock_actual = datos.stock;
        if (datos.stock_minimo !== undefined) inv.stock_minimo = datos.stock_minimo;
      }
    }
    return productosMock[idx];
  }
  const { data, error } = await supabase.from('productos').update(datos).eq('id', id).select().single();
  if (error) throw error;

  // Si se actualizó el stock o stock_minimo, sincronizar inventario
  if (datos.stock !== undefined || datos.stock_minimo !== undefined) {
    try {
      const updateInv = {};
      if (datos.stock !== undefined) updateInv.stock_actual = datos.stock;
      if (datos.stock_minimo !== undefined) updateInv.stock_minimo = datos.stock_minimo;
      updateInv.actualizado_en = new Date().toISOString();

      await supabase.from('inventario').update(updateInv).eq('producto_id', id);
    } catch (e) {
      console.warn('Error al sincronizar inventario tras actualizar producto:', e);
    }
  }

  return data;
}

export async function eliminarProducto(id) {
  if (!supabaseConfigurado) {
    const idx = productosMock.findIndex(p => p.id === id);
    if (idx !== -1) productosMock.splice(idx, 1);
    return true;
  }
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function toggleActivoProducto(id, activo) {
  return actualizarProducto(id, { activo });
}
