// ============================================
// Servicio: Ventas
// ============================================
import { supabase, supabaseConfigurado } from '../config/supabase.js';
import { ventasMock } from '../datos/datosMock.js';

export async function obtenerVentas(filtros = {}) {
  if (!supabaseConfigurado) {
    let resultado = [...ventasMock];
    if (filtros.fecha_inicio) resultado = resultado.filter(v => v.vendido_en >= filtros.fecha_inicio);
    if (filtros.fecha_fin) resultado = resultado.filter(v => v.vendido_en <= filtros.fecha_fin);
    return resultado.sort((a, b) => new Date(b.vendido_en) - new Date(a.vendido_en));
  }
  let consulta = supabase
    .from('ventas')
    .select('*, mesa:mesas(nombre), cuenta:cuentas(total, abierta_en)')
    .order('vendido_en', { ascending: false });
  if (filtros.fecha_inicio) consulta = consulta.gte('vendido_en', filtros.fecha_inicio);
  if (filtros.fecha_fin) consulta = consulta.lte('vendido_en', filtros.fecha_fin);
  if (filtros.metodo_pago) consulta = consulta.eq('metodo_pago', filtros.metodo_pago);
  const { data, error } = await consulta;
  if (error) throw error;
  return data;
}

export async function registrarVenta(datos) {
  if (!supabaseConfigurado) {
    const nueva = { ...datos, id: `vta-${Date.now()}`, vendido_en: new Date().toISOString() };
    ventasMock.unshift(nueva);
    return nueva;
  }
  const { data, error } = await supabase.from('ventas').insert(datos).select().single();
  if (error) throw error;
  return data;
}

export async function obtenerResumenVentasHoy() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ventas = await obtenerVentas({ fecha_inicio: hoy.toISOString() });
  return {
    total: ventas.reduce((s, v) => s + Number(v.total), 0),
    efectivo: ventas.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + Number(v.total), 0),
    transferencias: ventas.filter(v => v.metodo_pago === 'transferencia').reduce((s, v) => s + Number(v.total), 0),
    cantidad: ventas.length,
    ventas,
  };
}
