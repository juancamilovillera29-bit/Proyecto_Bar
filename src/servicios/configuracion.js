// ============================================
// Servicio: Configuración del sistema
// ============================================
import { supabase, supabaseConfigurado } from '../config/supabase.js';

const configuracionPredeterminada = {
  nombre: 'BORONDO Bar POS',
  version: '1.0.0',
  moneda: 'MXN',
  idioma: 'es',
  zona_horaria: 'America/Mexico_City',
};

let configuracionLocal = { ...configuracionPredeterminada };
let configuracionActiva = { ...configuracionPredeterminada };

export function establecerConfiguracionActiva(configuracion) {
  configuracionActiva = { ...configuracionPredeterminada, ...configuracion };
}

export function obtenerConfiguracionActiva() {
  return { ...configuracionActiva };
}

function mapearConfiguracion(datos) {
  return {
    nombre: datos.nombre_sistema,
    version: datos.version,
    moneda: normalizarMoneda(datos.moneda),
    idioma: normalizarIdioma(datos.idioma),
    zona_horaria: normalizarZonaHoraria(datos.zona_horaria),
  };
}

function normalizarMoneda(moneda) {
  const codigo = String(moneda || '').match(/\b[A-Z]{3}\b/)?.[0];
  return codigo || configuracionPredeterminada.moneda;
}

function normalizarIdioma(idioma) {
  const valor = String(idioma || '').trim().toLowerCase();
  return ['en', 'english', 'inglés', 'ingles'].includes(valor) ? 'en' : 'es';
}

function normalizarZonaHoraria(zonaHoraria) {
  const zona = String(zonaHoraria || '').trim();
  const alias = zona === 'America/Colombia' ? 'America/Bogota' : zona;
  try {
    new Intl.DateTimeFormat('en', { timeZone: alias });
    return alias;
  } catch {
    return configuracionPredeterminada.zona_horaria;
  }
}

function prepararConfiguracion(datos) {
  return {
    nombre_sistema: datos.nombre.trim(),
    version: datos.version.trim(),
    moneda: normalizarMoneda(datos.moneda),
    idioma: normalizarIdioma(datos.idioma),
    zona_horaria: normalizarZonaHoraria(datos.zona_horaria),
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
  const configuracion = mapearConfiguracion(data);
  configuracionLocal = configuracion;
  return configuracion;
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
    establecerConfiguracionActiva(configuracionLocal);
    return { ...configuracionLocal };
  }

  const { data, error } = await supabase
    .from('configuracion_sistema')
    .update(datos)
    .eq('id', true)
    .select('nombre_sistema, version, moneda, idioma, zona_horaria')
    .single();

  if (error) throw error;
  const configuracionGuardada = mapearConfiguracion(data);
  configuracionLocal = configuracionGuardada;
  establecerConfiguracionActiva(configuracionGuardada);
  return configuracionGuardada;
}
