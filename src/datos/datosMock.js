// ============================================
// BORONDO — Almacenamiento local limpio
// Arreglos vacíos listos para tus propios datos
// ============================================

export const productosMock = [
  {
    id: 'prod-001',
    nombre: 'Corona Extra',
    descripcion: 'Cerveza lager mexicana 355ml',
    precio_venta: 60.00,
    costo: 25.00,
    stock: 120,
    stock_minimo: 24,
    imagen_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400',
    activo: true,
    creado_en: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod-002',
    nombre: 'Margarita Clásica',
    descripcion: 'Tequila, limón, triple sec, sal',
    precio_venta: 120.00,
    costo: 45.00,
    stock: 30,
    stock_minimo: 5,
    imagen_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
    activo: true,
    creado_en: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod-003',
    nombre: 'Nachos con Guacamole',
    descripcion: 'Totopos con guacamole fresco',
    precio_venta: 95.00,
    costo: 30.00,
    stock: 20,
    stock_minimo: 5,
    imagen_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400',
    activo: true,
    creado_en: '2024-01-01T00:00:00Z',
  },
];

export const mesasMock = [
  { id: 'mesa-001', nombre: 'Mesa 1', estado: 'disponible', codigo_qr: 'mesa-01', creada_en: '2024-01-01T00:00:00Z' },
  { id: 'mesa-002', nombre: 'Mesa 2', estado: 'disponible', codigo_qr: 'mesa-02', creada_en: '2024-01-01T00:00:00Z' },
];

export const pedidosMock = [];

export const cuentasMock = [];

export const ventasMock = [];

export const inventarioMock = [];

export const movimientosInventarioMock = [];

export const cierresMock = [];

// Estadísticas iniciales limpias
export const estadisticasMock = {
  ventasHoy: 0,
  mesasOcupadas: 0,
  pedidosPendientes: 0,
  totalMesas: 0,
  alertasInventario: 0,
};
