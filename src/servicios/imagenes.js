import { supabase, supabaseConfigurado } from '../config/supabase.js';

const BUCKET_IMAGENES_PRODUCTOS = 'imagenes-productos';
const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;
const TIPOS_IMAGEN_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);

function validarImagen(file) {
  if (!TIPOS_IMAGEN_PERMITIDOS.has(file.type)) {
    throw new Error('Elige una imagen JPG, PNG o WebP.');
  }
  if (file.size > TAMANO_MAXIMO_IMAGEN) {
    throw new Error('La imagen no puede superar los 5 MB.');
  }
}

function convertirImagenADatosUrl(file) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      if (typeof lector.result === 'string') {
        resolve(lector.result);
      } else {
        reject(new Error('No se pudo leer el archivo de imagen.'));
      }
    };
    lector.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    lector.readAsDataURL(file);
  });
}

export async function subirImagenProducto(file) {
  validarImagen(file);

  if (!supabaseConfigurado) {
    return convertirImagenADatosUrl(file);
  }

  const extensiones = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ruta = `${crypto.randomUUID()}.${extensiones[file.type]}`;
  const { error } = await supabase.storage
    .from(BUCKET_IMAGENES_PRODUCTOS)
    .upload(ruta, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_IMAGENES_PRODUCTOS).getPublicUrl(ruta);
  return data.publicUrl;
}
