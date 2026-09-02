// ============================================
// Servicio: Mesas
// ============================================
import { supabase, supabaseConfigurado } from '../config/supabase.js';
import { mesasMock } from '../datos/datosMock.js';

export async function obtenerMesas() {
  if (!supabaseConfigurado) return [...mesasMock];
  const { data, error } = await supabase.from('mesas').select('*').order('nombre');
  if (error) throw error;
  return data;
}

export async function obtenerMesaPorCodigo(codigoQr) {
  if (!supabaseConfigurado) return mesasMock.find(m => m.codigo_qr?.toLowerCase() === codigoQr?.toLowerCase()) || null;
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .ilike('codigo_qr', codigoQr)
    .maybeSingle();

  if (error) {
    console.error('Error al obtener mesa por código:', error);
    return null;
  }
  return data || null;
}

export async function actualizarEstadoMesa(id, estado) {
  if (!supabaseConfigurado) {
    const mesa = mesasMock.find(m => m.id === id);
    if (mesa) mesa.estado = estado;
    return mesa;
  }
  const { data, error } = await supabase.from('mesas').update({ estado }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function crearMesa(datos) {
  if (!supabaseConfigurado) {
    const nueva = { ...datos, id: `mesa-${Date.now()}`, creada_en: new Date().toISOString() };
    mesasMock.push(nueva);
    return nueva;
  }
  const { data, error } = await supabase.from('mesas').insert(datos).select().single();
  if (error) throw error;
  return data;
}

export async function eliminarMesa(id) {
  if (!supabaseConfigurado) {
    const idx = mesasMock.findIndex(m => m.id === id);
    if (idx !== -1) mesasMock.splice(idx, 1);
    return true;
  }

  // 1. Obtener los pedidos vinculados a esta mesa
  const { data: pedidosMesa } = await supabase
    .from('pedidos')
    .select('id')
    .eq('mesa_id', id);

  if (pedidosMesa && pedidosMesa.length > 0) {
    const idsPedidos = pedidosMesa.map(p => p.id);
    // Eliminar los detalles de los pedidos
    await supabase
      .from('detalles_pedido')
      .delete()
      .in('pedido_id', idsPedidos);

    // Eliminar los pedidos de la mesa
    await supabase
      .from('pedidos')
      .delete()
      .eq('mesa_id', id);
  }

  // 2. Eliminar ventas asociadas a la mesa
  await supabase
    .from('ventas')
    .delete()
    .eq('mesa_id', id);

  // 3. Eliminar cuentas vinculadas a la mesa
  await supabase
    .from('cuentas')
    .delete()
    .eq('mesa_id', id);

  // 4. Eliminar la mesa
  const { error } = await supabase
    .from('mesas')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}


