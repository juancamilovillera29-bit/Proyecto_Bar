// ============================================
// Servicio: Productos
// ============================================
import { supabase, supabaseConfigurado } from '../config/supabase.js';
import { productosMock } from '../datos/datosMock.js';

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
    if (idx !== -1) Object.assign(productosMock[idx], datos);
    return productosMock[idx];
  }
  const { data, error } = await supabase.from('productos').update(datos).eq('id', id).select().single();
  if (error) throw error;
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
