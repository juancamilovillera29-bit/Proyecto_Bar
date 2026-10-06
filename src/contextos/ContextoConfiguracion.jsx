import { createContext, Fragment, useContext, useEffect, useMemo, useState } from 'react';
import {
  obtenerConfiguracionSistema,
  guardarConfiguracionSistema,
  establecerConfiguracionActiva,
  obtenerConfiguracionActiva,
} from '../servicios/configuracion.js';
import datosColombia from '../datos/municipios-colombia.json';

const ContextoConfiguracion = createContext(null);

const textos = {
  Dashboard: 'Dashboard',
  Productos: 'Products',
  Inventario: 'Inventory',
  Mesas: 'Tables',
  Ventas: 'Sales',
  Cierres: 'Cash closures',
  Configuración: 'Settings',
  'Menú principal': 'Main menu',
  'Sesión activa': 'Active session',
  'Cerrar sesión': 'Sign out',
  'Cargando dashboard...': 'Loading dashboard...',
  'Ventas del día': 'Today’s sales',
  'Hoy hasta ahora': 'So far today',
  'Mesas activas': 'Active tables',
  'Ocupadas / Total': 'Occupied / Total',
  'Pedidos en curso': 'Orders in progress',
  'Pendientes y en cocina': 'Pending and in kitchen',
  'Alertas de stock': 'Low-stock alerts',
  'Productos bajo mínimo': 'Products below minimum',
  'Pedidos recientes': 'Recent orders',
  'No hay pedidos recientes': 'No recent orders',
  'Cargando inventario...': 'Loading inventory...',
  'Stock en niveles óptimos': 'Stock levels are optimal',
  'productos con stock bajo': 'products are low in stock',
  'Registrar movimiento': 'Record stock movement',
  'Productos con stock bajo': 'Low-stock products',
  'Stock actual': 'Current stock',
  'Stock mínimo': 'Minimum stock',
  Estado: 'Status',
  'Stock bajo': 'Low stock',
  'Movimientos recientes': 'Recent movements',
  Producto: 'Product',
  'Entrada (compra)': 'Stock in (purchase)',
  'Salida (uso)': 'Stock out (usage)',
  'Ajuste manual': 'Manual adjustment',
  'Cargando ventas...': 'Loading sales...',
  'Total hoy': 'Today’s total',
  'Efectivo hoy': 'Cash today',
  'Transferencias hoy': 'Transfers today',
  ventas: 'sales',
  'Última semana': 'Last 7 days',
  'Este mes': 'This month',
  Hoy: 'Today',
  'Fecha y hora': 'Date and time',
  Mesa: 'Table',
  'Método de pago': 'Payment method',
  Total: 'Total',
  'No hay ventas en este período': 'No sales in this period',
  'Cargando cierres...': 'Loading cash closures...',
  'Cierres de caja': 'Cash closures',
  'Historial de cierres diarios': 'Daily closure history',
  'Realizar cierre del día': 'Close today’s register',
  'Cerrando...': 'Closing...',
  'Cierre de hoy ya realizado': 'Today’s register is already closed',
  'Cerrado a las': 'Closed at',
  Efectivo: 'Cash',
  Transferencias: 'Transfers',
  'Total del día': 'Daily total',
  'No hay cierres registrados': 'No cash closures found',
  'Realiza el primer cierre del día cuando termines la jornada': 'Close the register at the end of the day',
  'Conectado a Supabase': 'Connected to Supabase',
  'Almacenamiento Local': 'Local storage',
  'Base de datos': 'Database',
  'Sistema': 'System',
  'Cargando configuración...': 'Loading settings...',
  'Nombre del sistema': 'System name',
  Versión: 'Version',
  Moneda: 'Currency',
  Idioma: 'Language',
  'Zona horaria': 'Time zone',
  Editar: 'Edit',
  Cancelar: 'Cancel',
  'Guardar cambios': 'Save changes',
  Guardando: 'Saving...',
  'Configuración guardada para todos los administradores.': 'Settings saved for all administrators.',
  'Todos los campos de configuración son obligatorios.': 'All settings fields are required.',
  'No se pudieron guardar los cambios.': 'Could not save changes.',
  'Nombre': 'Name',
  'Precio de venta': 'Sale price',
  Costo: 'Cost',
  Stock: 'Stock',
  Acciones: 'Actions',
  'Nuevo producto': 'New product',
  'Buscar productos...': 'Search products...',
  Activo: 'Active',
  Inactivo: 'Inactive',
  Agotado: 'Out of stock',
  'Sin stock': 'Out of stock',
  'Crear producto': 'Create product',
  'Cargando productos...': 'Loading products...',
  'Productos registrados': 'Products registered',
  'No se encontraron productos': 'No products found',
  'Agrega tu primer producto con el botón "Nuevo producto"': 'Add your first product with the “New product” button',
  Descripción: 'Description',
  'Stock inicial': 'Starting stock',
  'URL de imagen': 'Image URL',
  'Nombre del producto': 'Product name',
  'Descripción breve del producto': 'Short product description',
  'Cargando mesas...': 'Loading tables...',
  'mesas configuradas con código QR único': 'tables configured with unique QR codes',
  Actualizar: 'Refresh',
  'Nueva mesa': 'New table',
  'Agregar nueva mesa': 'Add new table',
  'Nombre de la mesa': 'Table name',
  'Crear mesa': 'Create table',
  'Borrar mesa': 'Delete table',
  'Estado actual': 'Current status',
  'TOTAL ACUMULADO': 'ACCUMULATED TOTAL',
  'Detalle de pedidos': 'Order details',
  'Método de pago elegido:': 'Payment method selected:',
  'No seleccionado': 'Not selected',
  'Método de pago recibido': 'Payment method received',
  'Registrar pago y liberar mesa': 'Record payment and free table',
  'Mesa disponible. Puedes abrirla para registrar pedidos o eliminarla si ya no la necesitas.': 'Table available. You can open it to place orders or delete it.',
  'Todos tus pedidos fueron entregados. Ya puedes solicitar la cuenta.': 'All your orders have been delivered. You can request the bill now.',
  'Esperando entrega de productos': 'Waiting for order delivery',
  'Solicitar cuenta': 'Request bill',
  'No puedes solicitar la cuenta todavía: espera a que te entreguen todos tus productos': 'You cannot request the bill yet. Wait until all your items have been delivered',
  'Pagar Cuenta': 'Pay bill',
  'DETALLE DE CONSUMO': 'ORDER SUMMARY',
  'MÉTODO DE PAGO': 'PAYMENT METHOD',
  'Pedir la cuenta al mesero': 'Request the bill',
  'Aún hay productos pendientes de entrega. Podrás solicitar la cuenta cuando todos tus pedidos estén entregados.': 'Some items are still awaiting delivery. You can request the bill once all orders have been delivered.',
  'No se encontró una cuenta activa para verificar tus pedidos.': 'No active bill was found to verify your orders.',
  'No se pudo verificar la entrega de tus pedidos. Inténtalo nuevamente.': 'Could not verify order delivery. Please try again.',
  'Cuenta en proceso de pago': 'Bill payment in progress',
  'Sesión Cerrada': 'Session closed',
  'Ver detalle de la cuenta': 'View bill details',
  'Verifica el código QR de tu mesa': 'Check your table’s QR code',
  'Mesa no encontrada': 'Table not found',
  'Error al cargar el menú': 'Error loading menu',
  'Cargando menú...': 'Loading menu...',
  'Cargando estado del pedido...': 'Loading order status...',
  'Tu pedido fue recibido en la barra/cocina': 'Your order was received at the bar/kitchen',
  'Estamos preparando tus bebidas o platos': 'We are preparing your drinks or food',
  '¡Tu pedido está listo para ser servido!': 'Your order is ready to be served!',
  '¡Disfruta tu pedido!': 'Enjoy your order!',
  Disponible: 'Available',
  Ocupada: 'Occupied',
  Pendiente: 'Pending',
  Cerrada: 'Closed',
  Recibido: 'Received',
  'En preparación': 'Preparing',
  Listo: 'Ready',
  Entregado: 'Delivered',
  Cancelado: 'Cancelled',
  Abierta: 'Open',
  Pagada: 'Paid',
  'Acceso al sistema': 'System login',
  'Ingresa tus credenciales de administrador': 'Enter your administrator credentials',
  'Correo electrónico': 'Email address',
  Contraseña: 'Password',
  'Correo o contraseña incorrectos. Verifica tus datos.': 'Incorrect email or password. Check your credentials.',
  'Ingresando...': 'Signing in...',
  'Ingresar al sistema': 'Sign in',
  'Código QR:': 'QR code:',
  'Cargando...': 'Loading...',
  'Total a pagar': 'Total due',
  'Pedido': 'Order',
  'items': 'items',
  'disponibles': 'available',
  'Regresar al menú': 'Back to menu',
  'Enviar pedido': 'Place order',
  'Agregar al carrito': 'Add to cart',
  'No hay productos disponibles': 'No products available',
  'El carrito está vacío': 'Your cart is empty',
  'Continuar': 'Continue',
  'Volver': 'Back',
  'Cocina': 'Kitchen',
  'Iniciar preparación': 'Start preparing',
  'Marcar como listo': 'Mark as ready',
  'Marcar entregado': 'Mark as delivered',
};

const textosAdicionales = {
  Productos: 'Products',
  Inventario: 'Inventory',
  Mesas: 'Tables',
  Cierres: 'Closures',
  'Solicitar la cuenta': 'Request the bill',
  'Cuenta final': 'Final bill',
  'Cargando cuenta final...': 'Loading final bill...',
  'Cargando pedidos...': 'Loading orders...',
  'Cargando productos...': 'Loading products...',
  'Cargando mesas...': 'Loading tables...',
  'Cargando inventario...': 'Loading inventory...',
  'Cargando cierres...': 'Loading closures...',
  'Cargando configuración...': 'Loading settings...',
  'Cargando menú...': 'Loading menu...',
  'Cargando estado del pedido...': 'Loading order status...',
  'Cargando dashboard...': 'Loading dashboard...',
  'Verificando sesión...': 'Checking session...',
  'Pedidos recientes': 'Recent orders',
  'No hay pedidos recientes': 'No recent orders',
  'Cargando pedidos en cocina...': 'Loading kitchen orders...',
  'No hay pedidos pendientes': 'No pending orders',
  'Todos': 'All',
  Transferencia: 'Bank transfer',
  'Transferencia bancaria': 'Bank transfer',
  'Código QR': 'QR code',
  'Agregar al pedido': 'Add to order',
  'Buscar bebida o plato...': 'Search drinks or food...',
  'No se encontraron productos disponibles': 'No available products found',
  'Ver pedidos anteriores de esta mesa': 'View previous orders for this table',
  'No hay productos en esta categoría': 'No products in this category',
  'Revisa tu pedido antes de enviarlo': 'Review your order before placing it',
  '¡Pedido enviado!': 'Order placed!',
  'Pedido enviado correctamente': 'Order placed successfully',
  'Pedido recibido': 'Order received',
  'Pedido en preparación': 'Order being prepared',
  'Pedido listo': 'Order ready',
  'Pedido entregado': 'Order delivered',
  'Esperando confirmación del mesero': 'Waiting for waiter confirmation',
  'Error al cargar la información': 'Error loading information',
  'Error al cargar los productos': 'Error loading products',
  'No se pudo cargar la configuración del sistema.': 'Could not load system settings.',
  'Nombre del sistema': 'System name',
  'Conectado a Supabase': 'Connected to Supabase',
  'Almacenamiento Local': 'Local storage',
  'Base de datos PostgreSQL en la nube conectada con sincronización en tiempo real.': 'Cloud PostgreSQL database connected with real-time synchronization.',
  'Configura las credenciales en .env para conectar con tu proyecto en la nube de Supabase.': 'Configure the .env credentials to connect to your Supabase project.',
  'Actualizar': 'Refresh',
  'Cargando...': 'Loading...',
  'No disponible': 'Unavailable',
  'Stock máximo alcanzado': 'Maximum stock reached',
  'No hay más stock disponible': 'No more stock available',
  'Con cambios sin guardar': 'Unsaved changes',
  'No se pudieron guardar los cambios.': 'Could not save changes.',
  'Todos los campos de configuración son obligatorios.': 'All settings fields are required.',
  'No se pudo guardar la configuración.': 'Could not save settings.',
  '✅ Stock en niveles óptimos': '✅ Stock levels are optimal',
  'Stock actual': 'Current stock',
  'Stock mínimo': 'Minimum stock',
  'Registrar movimiento': 'Record stock movement',
  'Productos con stock bajo': 'Low-stock products',
  'Movimientos recientes': 'Recent movements',
  'Cargando detalles del pedido...': 'Loading order details...',
  'Tu pedido está vacío': 'Your order is empty',
  'Enviar pedido': 'Place order',
  'Confirmar pedido': 'Confirm order',
  'Volver al menú': 'Back to menu',
  'Inicia sesión para administrar el sistema': 'Sign in to manage the system',
  'Sesión expirada': 'Session expired',
  '¿Confirmas el cierre de caja del día de hoy? Esta acción consolidará todas las ventas del día.': 'Close today’s register? This will consolidate all sales for the day.',
  'Cerrado a las': 'Closed at',
  'No hay cierres registrados': 'No cash closures found',
  'Historial de cierres diarios': 'Daily closure history',
  'Realiza el primer cierre del día cuando termines la jornada': 'Make the first daily closure when your shift ends',
  'URGENTE': 'URGENT',
  'Actualizando...': 'Updating...',
  'Agotado': 'Out of stock',
  'Sin stock': 'Out of stock',
  'disponibles': 'available',
  'Pedido recibido en cocina': 'Order received in kitchen',
  'Cuenta pendiente de pago': 'Bill awaiting payment',
  'Pago registrado': 'Payment recorded',
  'Pedir la cuenta': 'Request the bill',
  'La cuenta fue solicitada': 'The bill has been requested',
  'Selecciona tu método de pago': 'Select your payment method',
  'Pagar en efectivo': 'Pay by cash',
  'Pagar por transferencia': 'Pay by bank transfer',
  'Método de pago seleccionado': 'Selected payment method',
  'Cancelar pedido': 'Cancel order',
  'Cancelar cuenta': 'Cancel bill',
  'Ver cuenta': 'View bill',
  'Ubicación (departamento y municipio)': 'Location (department and municipality)',
  'Toda Colombia usa la zona horaria America/Bogota.': 'All of Colombia uses the America/Bogota time zone.',
  'America/Bogota — Colombia': 'America/Bogota — Colombia',
};

const formatosMoneda = {
  COP: 'es-CO',
  MXN: 'es-MX',
  USD: 'en-US',
  EUR: 'es-ES',
  GBP: 'en-GB',
  BRL: 'pt-BR',
};

export function traducirTexto(texto, idioma) {
  if (idioma !== 'en' || typeof texto !== 'string') return texto;
  const recortado = texto.trim();
  const traduccion = textos[recortado] || textosAdicionales[recortado];
  if (!traduccion) return texto;
  const inicio = texto.match(/^\s*/)?.[0] || '';
  const final = texto.match(/\s*$/)?.[0] || '';
  return `${inicio}${traduccion}${final}`;
}

export function formatearImporte(valor, configuracion) {
  const preferencias = configuracion || obtenerConfiguracionActiva();
  const currency = preferencias.moneda || 'MXN';
  const locale = preferencias.idioma === 'en'
    ? (currency === 'GBP' ? 'en-GB' : 'en-US')
    : formatosMoneda[currency] || 'es-CO';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(valor) || 0);
  } catch {
    return `${currency} ${Number(valor || 0).toLocaleString(locale)}`;
  }
}

export function formatearFechaSistema(fecha, opciones = {}) {
  const configuracion = obtenerConfiguracionActiva();
  const locale = configuracion.idioma === 'en' ? 'en-US' : 'es-CO';
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'America/Bogota',
    ...opciones,
  }).format(new Date(fecha));
}

export function obtenerOpcionesMoneda(idioma) {
  const codigos = typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('currency')
    : ['COP', 'MXN', 'USD', 'EUR', 'GBP', 'BRL'];
  if (!codigos.includes('COP')) codigos.push('COP');

  let nombres;
  try {
    nombres = new Intl.DisplayNames([idioma === 'en' ? 'en' : 'es'], { type: 'currency' });
  } catch {
    nombres = null;
  }
  return codigos.sort().map(codigo => ({
    value: codigo,
    label: `${codigo} — ${nombres?.of(codigo) || codigo}`,
  }));
}

export function ProveedorConfiguracion({ children }) {
  const [configuracion, setConfiguracion] = useState({
    nombre: 'BORONDO Bar POS',
    version: '1.0.0',
    moneda: 'MXN',
    idioma: 'es',
    zona_horaria: 'America/Bogota',
    municipio_colombia: '11001',
  });

  useEffect(() => {
    document.documentElement.lang = configuracion.idioma === 'en' ? 'en' : 'es';
    establecerConfiguracionActiva(configuracion);
  }, [configuracion]);

  useEffect(() => {
    let activo = true;
    obtenerConfiguracionSistema().then(datos => {
      if (activo) {
        establecerConfiguracionActiva(datos);
        setConfiguracion(datos);
      }
    }).catch(error => {
      console.error('No se pudo cargar la configuración global:', error);
    });
    return () => { activo = false; };
  }, []);

  const valor = useMemo(() => ({
    configuracion,
    idioma: configuracion.idioma === 'en' ? 'en' : 'es',
    texto: texto => traducirTexto(texto, configuracion.idioma),
    formatearImporte: valor => formatearImporte(valor, configuracion),
    guardar: async datos => {
      const guardada = await guardarConfiguracionSistema(datos);
      setConfiguracion(guardada);
      return guardada;
    },
  }), [configuracion]);

  return (
    <ContextoConfiguracion.Provider value={valor}>
      <Fragment key={`${configuracion.moneda}-${configuracion.idioma}-${configuracion.zona_horaria}`}>
        {children}
      </Fragment>
    </ContextoConfiguracion.Provider>
  );
}

export function useConfiguracion() {
  const contexto = useContext(ContextoConfiguracion);
  if (!contexto) throw new Error('useConfiguracion debe usarse dentro de ProveedorConfiguracion');
  return contexto;
}
