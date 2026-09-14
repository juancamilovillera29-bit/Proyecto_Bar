// ============================================
// Servicio: Productos
// ============================================
import { supabase, supabaseConfigurado } from '../config/supabase.js';
import { productosMock, inventarioMock } from '../datos/datosMock.js';

export async function obtenerProductos(soloActivos = false) {
  if (!supabaseConfigurado) {
    return soloActivos ? productosMock.filter(p => p.activo) : productosMock;
  }
  let consulta = supabase
    .from('productos')
    .select('*, inventario(stock_actual, stock_minimo)')
    .order('nombre');
  if (soloActivos) consulta = consulta.eq('activo', true);
  const { data, error } = await consulta;

  if (error) {
    // Si la relación anidada falla, fallback a productos directo
    let fallback = supabase.from('productos').select('*').order('nombre');
    if (soloActivos) fallback = fallback.eq('activo', true);
    const { data: dataFallback, error: errorFallback } = await fallback;
    if (errorFallback) throw errorFallback;
    return dataFallback;
  }

  // Mapear stock real desde la tabla inventario y corregir discrepancias
  const productosMapeados = (data || []).map(p => {
    const inv = Array.isArray(p.inventario) ? p.inventario[0] : p.inventario;
    const tieneInv = inv && typeof inv.stock_actual === 'number';
    const stockReal = tieneInv ? inv.stock_actual : p.stock;
    const stockMinimoReal = (inv && typeof inv.stock_minimo === 'number') ? inv.stock_minimo : (p.stock_minimo || 5);

    // Si hay discrepancia en la base de datos, corregir la columna stock en productos
    if (tieneInv && p.stock !== stockReal) {
      supabase.from('productos').update({ stock: stockReal }).eq('id', p.id).then(() => {});
    }

    return {
      ...p,
      stock: stockReal,
      stock_minimo: stockMinimoReal,
    };
  });

  return productosMapeados;
}

export async function obtenerProductoPorId(id) {
  if (!supabaseConfigurado) return productosMock.find(p => p.id === id) || null;
  const { data, error } = await supabase
    .from('productos')
    .select('*, inventario(stock_actual, stock_minimo)')
    .eq('id', id)
    .single();

  if (error) {
    const { data: d, error: e } = await supabase.from('productos').select('*').eq('id', id).single();
    if (e) throw e;
    return d;
  }

  const inv = Array.isArray(data.inventario) ? data.inventario[0] : data.inventario;
  const stockReal = (inv && typeof inv.stock_actual === 'number') ? inv.stock_actual : data.stock;
  const stockMinimoReal = (inv && typeof inv.stock_minimo === 'number') ? inv.stock_minimo : (data.stock_minimo || 5);

  return {
    ...data,
    stock: stockReal,
    stock_minimo: stockMinimoReal,
  };
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
  await supabase.from('inventario').upsert({
    producto_id: data.id,
    stock_actual: datos.stock || 0,
    stock_minimo: datos.stock_minimo || 5,
  }, { onConflict: 'producto_id' });
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
      const updateInv = {
        producto_id: id,
        actualizado_en: new Date().toISOString(),
      };
      if (datos.stock !== undefined) updateInv.stock_actual = datos.stock;
      if (datos.stock_minimo !== undefined) updateInv.stock_minimo = datos.stock_minimo;

      await supabase.from('inventario').upsert(updateInv, { onConflict: 'producto_id' });
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
