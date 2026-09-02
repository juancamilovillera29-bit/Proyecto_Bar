// ============================================
// Contexto: Carrito del cliente
// Gestiona el carrito de compras por mesa
// ============================================
import { createContext, useContext, useReducer, useCallback } from 'react';

const ContextoCarrito = createContext(null);

const estadoInicial = {
  articulos: [],   // [{ producto, cantidad }]
  mesaId: null,
  cuentaId: null,
};

function reductorCarrito(estado, accion) {
  switch (accion.tipo) {
    case 'AGREGAR_ARTICULO': {
      const existe = estado.articulos.find(a => a.producto.id === accion.producto.id);
      if (existe) {
        return {
          ...estado,
          articulos: estado.articulos.map(a =>
            a.producto.id === accion.producto.id
              ? { ...a, cantidad: a.cantidad + 1 }
              : a
          ),
        };
      }
      return { ...estado, articulos: [...estado.articulos, { producto: accion.producto, cantidad: 1 }] };
    }
    case 'QUITAR_ARTICULO': {
      const existe = estado.articulos.find(a => a.producto.id === accion.productoId);
      if (existe && existe.cantidad > 1) {
        return {
          ...estado,
          articulos: estado.articulos.map(a =>
            a.producto.id === accion.productoId
              ? { ...a, cantidad: a.cantidad - 1 }
              : a
          ),
        };
      }
      return { ...estado, articulos: estado.articulos.filter(a => a.producto.id !== accion.productoId) };
    }
    case 'ELIMINAR_ARTICULO':
      return { ...estado, articulos: estado.articulos.filter(a => a.producto.id !== accion.productoId) };
    case 'VACIAR_CARRITO':
      return { ...estado, articulos: [] };
    case 'ESTABLECER_MESA':
      return { ...estado, mesaId: accion.mesaId, cuentaId: accion.cuentaId };
    default:
      return estado;
  }
}

export function ProveedorCarrito({ children }) {
  const [estado, despachar] = useReducer(reductorCarrito, estadoInicial);

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
