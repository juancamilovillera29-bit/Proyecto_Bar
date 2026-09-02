// ============================================
// Contexto: Pedidos en tiempo real
// Usado por KDS y panel admin
// ============================================
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, supabaseConfigurado } from '../config/supabase.js';
import { obtenerPedidos, actualizarEstadoPedido } from '../servicios/pedidos.js';
import { pedidosMock } from '../datos/datosMock.js';

const ContextoPedidos = createContext(null);

export function ProveedorPedidos({ children }) {
  const [pedidos, setPedidos]         = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState(null);

  const cargarPedidos = useCallback(async () => {
    try {
      setCargando(true);
      const datos = await obtenerPedidos();
      setPedidos(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();

    if (!supabaseConfigurado) return;

    // Suscripción Realtime a cambios en pedidos
    const canal = supabase
      .channel('pedidos_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        cargarPedidos();
      })
      .subscribe();

    return () => supabase.removeChannel(canal);
  }, [cargarPedidos]);

  async function cambiarEstadoPedido(pedidoId, nuevoEstado) {
    // Actualización optimista
    setPedidos(prev => prev.map(p =>
      p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
    ));
    try {
      await actualizarEstadoPedido(pedidoId, nuevoEstado);
    } catch (err) {
      // Revertir en caso de error
      await cargarPedidos();
      throw err;
    }
  }

  // Filtros de conveniencia
  const pedidosPendientes   = pedidos.filter(p => p.estado === 'recibido');
  const pedidosEnCocina     = pedidos.filter(p => p.estado === 'en_preparacion');
  const pedidosListos       = pedidos.filter(p => p.estado === 'listo');
  const pedidosActivos      = pedidos.filter(p => !['entregado', 'cancelado'].includes(p.estado));

  const valor = {
    pedidos,
    pedidosPendientes,
    pedidosEnCocina,
    pedidosListos,
    pedidosActivos,
    cargando,
    error,
    cargarPedidos,
    cambiarEstadoPedido,
  };

  return (
    <ContextoPedidos.Provider value={valor}>
      {children}
    </ContextoPedidos.Provider>
  );
}

export function usePedidos() {
  const contexto = useContext(ContextoPedidos);
  if (!contexto) throw new Error('usePedidos debe usarse dentro de ProveedorPedidos');
  return contexto;
}

export default ContextoPedidos;
