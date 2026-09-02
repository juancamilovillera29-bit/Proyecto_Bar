# BORONDO Bar POS

**Sistema de gestión integral para bares modernos y premium.**

Una aplicación web full-stack construida 100% en español con identidad visual negro + dorado, base de datos Supabase y tres interfaces diferenciadas: panel administrativo, KDS (Kitchen Display System) y menú digital para el cliente.

---

## Capturas de pantalla

| Panel Admin | KDS Cocina | Menú Cliente |
|---|---|---|
| Dashboard con estadísticas del día | Pedidos en tiempo real | Catálogo por código QR |

---

## Tecnologías utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.x | Framework de UI |
| Vite | 6.x | Bundler y servidor de desarrollo |
| React Router | 6.x | Enrutamiento SPA |
| Supabase | 2.x | Base de datos, Auth y Realtime |
| Lucide React | Latest | Iconografía |
| Vanilla CSS | — | Sistema de diseño negro + dorado |
| Google Fonts | — | Outfit + Inter |

---

## Arquitectura y estructura de carpetas

```
Proyecto_bar/
├── public/
├── src/
│   ├── main.jsx                    # Punto de entrada React
│   ├── App.jsx                     # Router (3 interfaces)
│   ├── index.css                   # Sistema de diseño global
│   │
│   ├── config/
│   │   └── supabase.js             # Cliente Supabase (auto-detecta modo demo)
│   │
│   ├── contextos/                  # Estado global (Context API)
│   │   ├── ContextoAuth.jsx        # Autenticación admin
│   │   ├── ContextoPedidos.jsx     # Pedidos en tiempo real
│   │   └── ContextoCarrito.jsx     # Carrito del cliente
│   │
│   ├── servicios/                  # Lógica de datos (queries Supabase)
│   │   ├── productos.js
│   │   ├── mesas.js
│   │   ├── pedidos.js
│   │   ├── cuentas.js
│   │   ├── ventas.js
│   │   ├── inventario.js
│   │   └── cierres.js
│   │
│   ├── componentes/                # UI reutilizable
│   │   ├── comunes/                # EstadoBadge, Modal, Spinner, TarjetaStat
│   │   ├── admin/                  # BarraLateral, TarjetaMesa
│   │   ├── kds/                    # TarjetaPedidoKDS
│   │   └── cliente/                # TarjetaProducto, ResumenCarrito
│   │
│   ├── paginas/
│   │   ├── Login.jsx
│   │   ├── admin/                  # Dashboard, Productos, Inventario,
│   │   │                           # Mesas, KDS, Ventas, Cierres, Configuracion
│   │   ├── kds/                    # PantallaKDS (standalone)
│   │   └── cliente/                # MenuCliente, SeguimientoPedido, ConfirmarPedido
│   │
│   └── datos/
│       └── datosMock.js            # Datos demo (sin Supabase)
│
├── supabase/
│   └── schema.sql                  # Schema completo en español
├── .env.example
└── README.md
```

---

## Configuración de Supabase

### 1. Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia la **URL del proyecto** y la **clave anon**

### 2. Ejecutar el schema SQL

En el **Editor SQL** de Supabase, ejecuta el contenido de `supabase/schema.sql`. Esto creará:
- Todas las tablas con sus relaciones
- Tipos enumerados (enums)
- Triggers automáticos
- Políticas RLS
- Datos de prueba (10 productos, 10 mesas)

### 3. Configurar variables de entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env con tus credenciales reales
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

> **Sin configurar Supabase:** La app funciona en **modo demo** con datos mock precargados. Ideal para explorar la interfaz antes de conectar la base de datos.

---

## Estructura completa de la base de datos

### Tablas

| Tabla | Descripción |
|---|---|
| `productos` | Catálogo con precio, costo, stock e imagen |
| `mesas` | Mesas con estado y código QR único |
| `cuentas` | Vista acumulada del consumo por mesa |
| `pedidos` | Transacciones individuales (preservadas para KDS) |
| `detalles_pedido` | Ítems de cada pedido con precio capturado |
| `ventas` | Registro de pagos con método de pago |
| `inventario` | Stock actual por producto (una fila por producto) |
| `movimientos_inventario` | Historial de entradas, salidas y ajustes |
| `cierres` | Resúmenes de cierre diario de caja |

### Enums en español

```sql
estado_mesa:    disponible | ocupada | pendiente_pago | cerrada
estado_pedido:  recibido | en_preparacion | listo | entregado | cancelado
estado_cuenta:  abierta | pendiente_pago | pagada | cerrada
metodo_pago:    efectivo | transferencia
tipo_movimiento: entrada | salida | ajuste
```

### Relaciones

```
mesas → cuentas → pedidos → detalles_pedido → productos
                           ↘ ventas → cierres
productos → inventario → movimientos_inventario
```

---

## Flujos operativos

### Flujo del cliente (por QR)

```
1. Escanea QR de la mesa  →  /mesa/mesa-01
2. Explora el catálogo de productos
3. Agrega productos al carrito
4. Confirma el pedido  →  /mesa/mesa-01/confirmar
5. Monitorea el estado  →  /mesa/mesa-01/seguimiento
6. Solicita la cuenta (muestra consumo acumulado)
```

### Flujo administrativo

```
1. Login  →  /login
2. Dashboard: estadísticas, alertas, actividad
3. Gestión de productos (CRUD)
4. Control de inventario y movimientos
5. Mesas: abrir, cerrar, registrar pago
6. KDS: cambiar estados de pedidos en tiempo real
7. Ventas: historial con filtros de período
8. Cierres: resumen del día, historial
```

### Flujo KDS (pantalla cocina)

```
1. Abrir  →  /kds  (pantalla dedicada, full screen)
2. Ver pedidos activos en tarjetas
3. Cambiar estado: Recibido → En preparación → Listo → Entregado
4. Timer en vivo + indicador de urgencia (>15 min)
5. Actualización automática via Supabase Realtime
```

### Flujo de inventario

```
1. Ver stock actual de todos los productos
2. Alertas automáticas de stock bajo (≤ stock_mínimo)
3. Registrar movimiento: Entrada | Salida | Ajuste
4. Trigger automático actualiza inventario en Supabase
```

### Concepto: cuenta acumulada vs pedidos

```
Mesa 3 abre cuenta (cuentas.estado = 'abierta')
    │
    ├── Pedido #1: 2 Coronas + 1 Margarita   → pedidos + detalles_pedido
    │   (KDS procesa: recibido → entregado)
    │
    ├── Pedido #2: 1 Mojito + Nachos          → pedidos + detalles_pedido
    │   (KDS procesa: recibido → entregado)
    │
    └── Cuenta acumulada: $390.00             → cuentas.total (suma de pedidos)
        Cliente paga → venta registrada → mesa disponible
```

---

## Instrucciones para ejecutar

### Instalación

```bash
# Clonar o descargar el proyecto
cd Proyecto_bar

# Instalar dependencias
npm install

# Configurar variables (opcional para modo demo)
cp .env.example .env
# Editar .env con credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

### URLs de acceso

| URL | Descripción |
|---|---|
| `http://localhost:5173` | Redirige al login |
| `http://localhost:5173/login` | Login admin |
| `http://localhost:5173/admin/dashboard` | Panel administrativo |
| `http://localhost:5173/kds` | KDS standalone (cocina) |
| `http://localhost:5173/mesa/mesa-01` | Menú cliente Mesa 1 |
| `http://localhost:5173/mesa/mesa-01/seguimiento` | Seguimiento pedidos Mesa 1 |

### Credenciales demo

```
Email: admin@borondo.bar
Clave: borondo2024
```

### Build para producción

```bash
npm run build
npm run preview
```

---

## Guía de estilos

### Paleta de colores

| Variable CSS | Color | Uso |
|---|---|---|
| `--dorado-puro` | `#c9a84c` | Botones primarios, títulos, acentos |
| `--negro-profundo` | `#0a0a0a` | Fondo principal del login |
| `--negro-base` | `#111111` | Fondo general de la app |
| `--carbon-oscuro` | `#181818` | Superficie de tarjetas |
| `--texto-primario` | `#f5f5f5` | Texto principal |

### Tipografía

- **Títulos y números:** Outfit (Google Fonts)
- **Cuerpo y UI:** Inter (Google Fonts)

---

## Licencia

Proyecto privado — BORONDO Bar © 2024
