// ============================================
// Contexto: Carrito del cliente
// Gestiona el carrito de compras por mesa con persistencia
// ============================================
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

const ContextoCarrito = createContext(null);

const STORAGE_KEY = 'borondo_carrito_datos';

function obtenerEstadoInicial() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      const parsed = JSON.parse(guardado);
      return {
        articulos: Array.isArray(parsed.articulos) ? parsed.articulos : [],
        mesaId: parsed.mesaId || null,
        cuentaId: parsed.cuentaId || null,
      };
    }
  } catch (e) {
    console.warn('No se pudo leer el carrito de localStorage:', e);
  }
  return {
    articulos: [],
    mesaId: null,
    cuentaId: null,
  };
}

function reductorCarrito(estado, accion) {
  let nuevoEstado = estado;
  switch (accion.tipo) {
    case 'AGREGAR_ARTICULO': {
      const existe = estado.articulos.find(a => a.producto.id === accion.producto.id);
      if (existe) {
        nuevoEstado = {
          ...estado,
          articulos: estado.articulos.map(a =>
            a.producto.id === accion.producto.id
              ? { ...a, cantidad: a.cantidad + 1 }
              : a
          ),
        };
      } else {
        nuevoEstado = { ...estado, articulos: [...estado.articulos, { producto: accion.producto, cantidad: 1 }] };
      }
      break;
    }
    case 'QUITAR_ARTICULO': {
      const existe = estado.articulos.find(a => a.producto.id === accion.productoId);
      if (existe && existe.cantidad > 1) {
        nuevoEstado = {
          ...estado,
          articulos: estado.articulos.map(a =>
            a.producto.id === accion.productoId
              ? { ...a, cantidad: a.cantidad - 1 }
              : a
          ),
        };
      } else {
        nuevoEstado = { ...estado, articulos: estado.articulos.filter(a => a.producto.id !== accion.productoId) };
      }
      break;
    }
    case 'ELIMINAR_ARTICULO':
      nuevoEstado = { ...estado, articulos: estado.articulos.filter(a => a.producto.id !== accion.productoId) };
      break;
    case 'VACIAR_CARRITO':
      nuevoEstado = { ...estado, articulos: [] };
      break;
    case 'ESTABLECER_MESA':
      nuevoEstado = { ...estado, mesaId: accion.mesaId, cuentaId: accion.cuentaId };
      break;
    default:
      return estado;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevoEstado));
  } catch (e) {
    console.warn('No se pudo guardar el carrito:', e);
  }
  return nuevoEstado;
}

export function ProveedorCarrito({ children }) {
  const [estado, despachar] = useReducer(reductorCarrito, undefined, obtenerEstadoInicial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch (e) {}
  }, [estado]);

  const agregarArticulo = useCallback((producto) => {
    despachar({ tipo: 'AGREGAR_ARTICULO', producto });
  }, []);

  const quitarArticulo = useCallback((productoId) => {
    despachar({ tipo: 'QUITAR_ARTICULO', productoId });
  }, []);

  const eliminarArticulo = useCallback((productoId) => {
    despachar({ tipo: 'ELIMINAR_ARTICULO', productoId });
  }, []);

  const vaciarCarrito = useCallback(() => {
    despachar({ tipo: 'VACIAR_CARRITO' });
  }, []);

  const establecerMesa = useCallback((mesaId, cuentaId = null) => {
    despachar({ tipo: 'ESTABLECER_MESA', mesaId, cuentaId });
  }, []);

  const totalArticulos = estado.articulos.reduce((s, a) => s + a.cantidad, 0);
  const subtotal = estado.articulos.reduce((s, a) => s + a.producto.precio_venta * a.cantidad, 0);

  const valor = {
    articulos: estado.articulos,
    mesaId: estado.mesaId,
    cuentaId: estado.cuentaId,
    totalArticulos,
    subtotal,
    carritoVacio: estado.articulos.length === 0,
    agregarArticulo,
    quitarArticulo,
    eliminarArticulo,
    vaciarCarrito,
    establecerMesa,
  };

  return (
    <ContextoCarrito.Provider value={valor}>
      {children}
    </ContextoCarrito.Provider>
  );
}

export function useCarrito() {
  const contexto = useContext(ContextoCarrito);
  if (!contexto) throw new Error('useCarrito debe usarse dentro de ProveedorCarrito');
  return contexto;
}

export default ContextoCarrito;

