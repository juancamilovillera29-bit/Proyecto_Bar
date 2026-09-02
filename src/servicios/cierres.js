// ============================================
// Servicio: Cierres de caja
// ============================================
import { supabase, supabaseConfigurado } from '../config/supabase.js';
import { cierresMock } from '../datos/datosMock.js';

export async function obtenerCierres() {
  if (!supabaseConfigurado) return [...cierresMock];
  const { data, error } = await supabase
    .from('cierres')
    .select('*')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data;
}

export async function realizarCierre() {
  const hoy = new Date().toISOString().split('T')[0];

  if (!supabaseConfigurado) {
    const { ventasMock } = await import('../datos/datosMock.js');
    const ventasHoy = ventasMock.filter(v => v.vendido_en.startsWith(hoy));
    const nuevo = {
      id: `cierre-${Date.now()}`,
      fecha: hoy,
      total_ventas: ventasHoy.reduce((s, v) => s + v.total, 0),
      total_efectivo: ventasHoy.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + v.total, 0),
      total_transferencias: ventasHoy.filter(v => v.metodo_pago === 'transferencia').reduce((s, v) => s + v.total, 0),
      cantidad_ventas: ventasHoy.length,
      cerrado_en: new Date().toISOString(),
    };
    cierresMock.unshift(nuevo);
    return nuevo;
  }

  // Calcular totales del día desde ventas
  const { data: ventas, error: errorVentas } = await supabase
    .from('ventas')
    .select('total, metodo_pago')
    .gte('vendido_en', `${hoy}T00:00:00`)
    .lte('vendido_en', `${hoy}T23:59:59`);
  if (errorVentas) throw errorVentas;

  const datosCierre = {
    fecha: hoy,
    total_ventas: ventas.reduce((s, v) => s + Number(v.total), 0),
    total_efectivo: ventas.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + Number(v.total), 0),
    total_transferencias: ventas.filter(v => v.metodo_pago === 'transferencia').reduce((s, v) => s + Number(v.total), 0),
    cantidad_ventas: ventas.length,
  };

  const { data, error } = await supabase.from('cierres').insert(datosCierre).select().single();
  if (error) throw error;
  return data;
}
