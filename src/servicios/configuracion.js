// ============================================
// Servicio: Configuración del sistema
// ============================================
import { supabase, supabaseConfigurado } from '../config/supabase.js';

const configuracionPredeterminada = {
  nombre: 'BORONDO Bar POS',
  version: '1.0.0',
  moneda: 'MXN (Peso mexicano)',
  idioma: 'Español',
  zona_horaria: 'America/Mexico_City',
};

let configuracionLocal = { ...configuracionPredeterminada };

function mapearConfiguracion(datos) {
  return {
    nombre: datos.nombre_sistema,
    version: datos.version,
    moneda: datos.moneda,
    idioma: datos.idioma,
    zona_horaria: datos.zona_horaria,
  };
}

function prepararConfiguracion(datos) {
  return {
    nombre_sistema: datos.nombre.trim(),
    version: datos.version.trim(),
    moneda: datos.moneda.trim(),
    idioma: datos.idioma.trim(),
    zona_horaria: datos.zona_horaria.trim(),
  };
}

export async function obtenerConfiguracionSistema() {
  if (!supabaseConfigurado) return { ...configuracionLocal };

  const { data, error } = await supabase
    .from('configuracion_sistema')
    .select('nombre_sistema, version, moneda, idioma, zona_horaria')
    .eq('id', true)
    .single();

  if (error) throw error;
  return mapearConfiguracion(data);
}

export async function guardarConfiguracionSistema(configuracion) {
  const datos = prepararConfiguracion(configuracion);

  if (!Object.values(datos).every(Boolean)) {
    throw new Error('Todos los campos de configuración son obligatorios.');
  }

  if (!supabaseConfigurado) {
    configuracionLocal = {
      nombre: datos.nombre_sistema,
      version: datos.version,
      moneda: datos.moneda,
      idioma: datos.idioma,
      zona_horaria: datos.zona_horaria,
    };
    return { ...configuracionLocal };
  }

  const { data, error } = await supabase
    .from('configuracion_sistema')
    .update(datos)
    .eq('id', true)
    .select('nombre_sistema, version, moneda, idioma, zona_horaria')
    .single();

  if (error) throw error;
  return mapearConfiguracion(data);
}
