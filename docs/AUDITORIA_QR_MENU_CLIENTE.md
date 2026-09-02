# Auditoría de Código: Flujo QR y Acceso al Menú del Cliente

**Proyecto:** BORONDO Bar POS  
**Fecha:** 2026-09-02  
**Versión analizada:** Commit actual  
**Alcance:** Flujo completo desde generación de QR en admin → Escaneo por cliente → Acceso a `MenuCliente.jsx` → Inicialización de mesa/cuenta → Render de catálogo

---

## 📋 Resumen Ejecutivo

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| **🔴 ALTA** | 6 | Problemas que impiden el acceso al menú en producción o red local |
| **🟡 MEDIA** | 8 | Casos borde, UX degradada, riesgos de consistencia de datos |
| **🟢 BAJA** | 5 | Mejoras de robustez, accesibilidad, mantenibilidad |

---

## 🔴 HALLAZGOS DE SEVERIDAD ALTA

### A1. **URL del QR hardcodeada a IP local fija (10.77.159.97)**
**Archivo:** `src/paginas/admin/Mesas.jsx:32-36`  
**Problema:** La URL base se resuelve como `http://10.77.159.97:5173` solo si `hostname === 'localhost'`. Esto **rompe completamente** el flujo en:
- Producción (dominio HTTPS real)
- Cualquier otra red local (IP distinta)
- Acceso desde túneles (ngrok, Cloudflare Tunnel)
- Dispositivos en otra subred

**Impacto:** Clientes escanean QR → obtienen `ERR_CONNECTION_REFUSED` o `DNS_PROBE_FINISHED_NXDOMAIN`.

**Evidencia:**
```javascript
const defaultBaseUrl = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://10.77.159.97:${window.location.port || 5173}`  // ❌ HARDCODED
      : window.location.origin)
  : 'http://localhost:5173';
```

---

### A2. **Ruta `/mesa/:codigoQr` sensible a mayúsculas/minúsculas en el parámetro pero `ilike` en BD**
**Archivos:** `src/App.jsx:56`, `src/servicios/mesas.js:19`  
**Problema:** React Router captura `:codigoQr` tal cual (case-sensitive). El servicio usa `.ilike('codigo_qr', codigoQr)` que **SÍ es case-insensitive en PostgreSQL**, pero:
- Si el QR se generó con `slug = nombre.toLowerCase().replace(/\s+/g, '-')` (línea 104 Mesas.jsx)
- Y el usuario accede a `/mesa/MESA-1` (mayúsculas) → `ilike` encuentra la mesa ✓
- **PERO** el `codigoQr` en el context del carrito y URLs subsiguientes (`/seguimiento`, `/pago`) conserva la capitalización original → inconsistencias en logs, analytics, debugging.

**Riesgo adicional:** Si en el futuro se migra a otra BD sin `ilike`, o se usa `.eq()`, falla silenciosamente.

---

### A3. **Race Condition: `abrirCuenta` se ejecuta SIN transacción ni verificación de cuenta existente**
**Archivo:** `src/paginas/cliente/MenuCliente.jsx:36-39`  
**Problema:**
```javascript
let cuenta = await obtenerCuentaActivaDeMesa(mesaDatos.id);
if (!cuenta) cuenta = await abrirCuenta(mesaDatos.id);  // ❌ RACE CONDITION
```
Dos clientes escanean el QR simultáneamente:
1. Cliente A: `obtenerCuentaActivaDeMesa` → `null`
2. Cliente B: `obtenerCuentaActivaDeMesa` → `null` (A aún no insertó)
3. Ambos ejecutan `abrirCuenta` → **SE CREAN 2 CUENTAS** para la misma mesa

**Impacto:** Cuentas duplicadas, totales incorrectos, confusión al cobrar.

---

### A4. **Políticas RLS permiten `DELETE` público en tablas críticas**
**Archivo:** `supabase/schema.sql:253-257`  
**Problema:** Políticas públicas con `USING (TRUE)` para DELETE:
```sql
CREATE POLICY "mesas_eliminacion_publica" ON mesas FOR DELETE USING (TRUE);
CREATE POLICY "cuentas_eliminacion_publica" ON cuentas FOR DELETE USING (TRUE);
CREATE POLICY "pedidos_eliminacion_publica" ON pedidos FOR DELETE USING (TRUE);
CREATE POLICY "detalles_eliminacion_publica" ON detalles_pedido FOR DELETE USING (TRUE);
CREATE POLICY "ventas_eliminacion_publica" ON ventas FOR DELETE USING (TRUE);
```
**Cualquier usuario anónimo** puede ejecutar `DELETE FROM mesas`, `DELETE FROM cuentas`, etc. desde la consola del navegador o un script.

**Impacto:** **Pérdida total de datos** del negocio. Vulnerabilidad crítica de seguridad.

---

### A5. **`obtenerMesaPorCodigo` retorna `null` silenciosamente en error de red**
**Archivo:** `src/servicios/mesas.js:22-25`  
**Problema:**
```javascript
if (error) {
  console.error('Error al obtener mesa por código:', error);
  return null;  // ❌ MISMO VALOR QUE "NO ENCONTRADO"
}
```
El componente `MenuCliente.jsx:32` trata `null` como "mesa no existe":
```javascript
if (!mesaDatos) { setError('Mesa no encontrada'); ... }
```
**No hay forma de distinguir** entre:
- Mesa inexistente (404 legítimo)
- Error de red/timeout/RLS/BD caída (500 recuperable)

**Impacto:** Usuario ve "Mesa no encontrada" cuando en realidad hay un fallo de conectividad → no reintenta, se va.

---

### A6. **Falta validación de `codigo_qr` único al crear mesa (colisión de slugs)**
**Archivo:** `src/paginas/admin/Mesas.jsx:104-107`  
**Problema:**
```javascript
const slug = nombreNuevaMesa.toLowerCase().replace(/\s+/g, '-');
await crearMesa({ nombre: nombreNuevaMesa.trim(), codigo_qr: slug, ... });
```
Si existe "Mesa 1" → `mesa-1`. Admin crea "Mesa-1" → mismo slug.  
BD tiene `UNIQUE` en `codigo_qr` → **error 23505 (unique_violation) no capturado** → UI se rompe o muestra error críptico de Postgres.

---

## 🟡 HALLAZGOS DE SEVERIDAD MEDIA

### M1. **QR SVG sin margen (`includeMargin={false}`) — riesgo de lectura en impresiones pobres**
**Archivo:** `src/paginas/admin/Mesas.jsx:386`  
**Problema:** `includeMargin={false}` elimina la "quiet zone" (4 módulos blancos) requerida por especificación QR.  
**Consecuencia:** Impresoras térmicas baratas, papel arrugado, o escaneo en ángulo → **fallo de lectura**.  
**Recomendación:** `includeMargin={true}` (default) o mínimo `margin={4}`.

---

### M2. **Contraste QR: `fgColor="#0a0a0a"` sobre `bgColor="#ffffff"` — correcto, pero impresión en térmica lo invalida**
**Archivo:** `src/paginas/admin/Mesas.jsx:387-388`  
En pantalla OK. En impresora térmica (papel blanco brillante + negro mate) el contraste es adecuado.  
**Pero:** Si se imprime en papel normal con tinta baja, o se fotocopia, el negro `#0a0a0a` no es `#000000` puro.  
**Fix trivial:** `fgColor="#000000"`.

---

### M3. **`baseUrl` editable en modal QR pero no persistida**
**Archivo:** `src/paginas/admin/Mesas.jsx:38-39, 432-448`  
El admin puede cambiar la IP/URL en el modal, pero:
- Se guarda solo en `useState` → se pierde al recargar
- No se valida formato (debe ser URL válida con protocolo)
- No hay feedback visual de "URL guardada"

**Impacto:** Admin configura IP de red local → recarga página → QR vuelve a IP hardcodeada 10.77.159.97 → QRs impresos ya no funcionan.

---

### M4. **`obtenerCuentaActivaDeMesa` usa `.maybeSingle()` pero filtra por `estado IN ('abierta', 'pendiente_pago')`**
**Archivo:** `src/servicios/cuentas.js:11-17`  
Si hay **dos cuentas** en esos estados para la misma mesa (posible por race condition A3 o reapertura manual), `.maybeSingle()` lanza error:  
`"multiple rows returned for single object"` → `data = null` → `MenuCliente` crea **tercera cuenta**.

---

### M5. **`crearMesa` en mock no valida unicidad de `codigo_qr`**
**Archivo:** `src/servicios/mesas.js:41-44`  
```javascript
if (!supabaseConfigurado) {
  const nueva = { ...datos, id: `mesa-${Date.now()}`, creada_en: new Date().toISOString() };
  mesasMock.push(nueva);  // ❌ Sin check de duplicados
  return nueva;
}
```
En desarrollo (sin Supabase) se pueden crear mesas con `codigo_qr` duplicado → comportamiento inconsistente vs producción.

---

### M6. **`MenuCliente` no maneja mesa con `estado !== 'disponible'` ni `'ocupada'`**
**Archivo:** `src/paginas/cliente/MenuCliente.jsx:32`  
Si mesa está `'cerrada'`, `'pendiente_pago'`, o `'mantenimiento'` (estados válidos en enum), el cliente **igual ve el menú y puede pedir**.  
**Lógica de negocio:** ¿Una mesa "cerrada" o "en mantenimiento" debe permitir pedidos? Actualmente **SÍ**.

---

### M7. **`SeguimientoPedido.jsx` suscripción realtime sin filtrar por mesa**
**Archivo:** `src/paginas/cliente/SeguimientoPedido.jsx:48-54`  
```javascript
.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, () => {
  cargarDatos();  // ❌ Recarga TODOS los pedidos de TODAS las mesas
})
```
**Impacto:** Cualquier actualización en CUALQUIER pedido de CUALQUIER mesa dispara recarga completa → tráfico innecesario, parpadeo UI, posible rate limit Supabase Realtime.

---

### M8. **Falta `Error Boundary` en ruta pública `/mesa/:codigoQr`**
**Archivo:** `src/App.jsx:56`  
Si cualquier error no capturado ocurre en `MenuCliente` (ej. `productos` lanza excepción, `useCarrito` fuera de proveedor), **toda la app se rompe** (pantalla blanca) en lugar de mostrar error amigable.

---

## 🟢 HALLAZGOS DE SEVERIDAD BAJA

### B1. **`imprimirQR` usa `window.open` + `document.write` — API obsoleta y bloqueada por pop-up blockers**
**Archivo:** `src/paginas/admin/Mesas.jsx:143-172`  
`document.write` en ventana nueva está deprecado y falla en navegadores modernos con políticas estrictas.  
**Mejor:** Generar PDF con `html2canvas` + `jspdf` o usar `<iframe>` con `contentWindow.print()`.

---

### B2. **`codigo_qr` generado como slug simple sin prefijo/namespacing**
**Archivo:** `src/paginas/admin/Mesas.jsx:104`  
`slug = nombre.toLowerCase().replace(/\s+/g, '-')` → `mesa-1`, `barra-2`.  
**Riesgo:** Colisión si se integra con otro sistema, o si se usan códigos QR preimpresos.  
**Recomendación:** Prefijo `borondo-` o UUID corto: `mesa-1-a7f3`.

---

### B3. **`MenuCliente` no muestra indicador de "mesa ocupanda/cerrada" al cliente**
**Archivo:** `src/paginas/cliente/MenuCliente.jsx:87`  
Solo muestra `mesa?.nombre`. El cliente no sabe si la mesa está disponible, si ya pidieron otros, etc.  
**UX:** Confusión si mesero dice "esa mesa ya pidió" pero app deja pedir.

---

### B4. **Falta `loading` skeleton en `MenuCliente` — UX de carga percibida**
**Archivo:** `src/paginas/cliente/MenuCliente.jsx:49`  
Solo `CargandoSpinner` centrado. En móviles lentos/3G se ve "app rota" por 2-3s.  
**Mejor:** Skeleton cards de productos (shimmer).

---

### B5. **`ContextoCarrito` no persiste en `localStorage` — pérdida de carrito al recargar**
**Archivo:** `src/contextos/ContextoCarrito.jsx`  
Cliente escanea QR → agrega items → recarga accidental (pull-to-refresh, cambio de pestaña) → **carrito vacío**.  
**Impacto:** Frustración, pedidos perdidos, quejas.

---

## 🛠️ PLAN DE MEJORA PRIORIZADO

### Fase 1 — Crítico (Bloqueadores de producción) — **Esta semana**

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 1 | **Fix URL dinámica del QR**: Detectar `window.location.origin` siempre; permitir override vía `localStorage` o env var `VITE_PUBLIC_URL` | `Mesas.jsx` | 2h |
| 2 | **Eliminar políticas `DELETE` públicas** y restringir a `auth.role() = 'authenticated'` | `schema.sql` | 1h |
| 3 | **Race condition `abrirCuenta`**: Usar `upsert` con `onConflict: 'mesa_id'` + filtro `estado IN ('abierta','pendiente_pago')` o RPC atómica | `cuentas.js`, `MenuCliente.jsx` | 3h |
| 4 | **Diferenciar error de red vs mesa inexistente**: Lanzar error tipado / retornar `{ data, error: { code: 'NOT_FOUND' \| 'NETWORK' } }` | `mesas.js`, `MenuCliente.jsx` | 2h |
| 5 | **Validar unicidad `codigo_qr` antes de crear** y mostrar error amigable | `Mesas.jsx`, `mesas.js` | 1h |

### Fase 2 — Robustez y UX — **Próximo sprint**

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 6 | QR: `includeMargin={true}`, `fgColor="#000000"`, `size={300}` para impresión | `Mesas.jsx` | 30min |
| 7 | Persistir `baseUrl` en `localStorage` + validación URL | `Mesas.jsx` | 1h |
| 8 | Filtrar realtime por `mesa_id` en `SeguimientoPedido` | `SeguimientoPedido.jsx` | 1h |
| 9 | `Error Boundary` en rutas públicas `/mesa/*` | `App.jsx`, nuevo componente | 2h |
| 10 | Validar estado de mesa en `MenuCliente` (bloquear si `cerrada`/`mantenimiento`) | `MenuCliente.jsx` | 1h |
| 11 | Persistir carrito en `localStorage` + restaurar al montar | `ContextoCarrito.jsx` | 2h |
| 12 | Skeleton loading en `MenuCliente` | `MenuCliente.jsx`, nuevo componente | 1h |

### Fase 3 — Calidad y Mantenibilidad — **Backlog**

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 13 | Prefijo `borondo-` en `codigo_qr` + migración BD | `Mesas.jsx`, `schema.sql` (migración) | 2h |
| 14 | Reemplazar `imprimirQR` con generación PDF/iframe | `Mesas.jsx` | 3h |
| 15 | Normalizar `codigoQr` a lowercase en `useParams` → `useMemo(() => codigoQr.toLowerCase(), [codigoQr])` | `MenuCliente.jsx`, `SeguimientoPedido.jsx`, `ConfirmarPedido.jsx`, `PaginaPago.jsx` | 1h |
| 16 | Tests de integración: QR generation → scan → menu load → order → payment | `__tests__/` | 8h |

---

## 📐 ESQUEMA DE CORRECCIONES TÉCNICAS (Referencia rápida)

### Fix A1 — URL dinámica robusta
```javascript
// Mesas.jsx
function obtenerBaseUrl() {
  // 1. Prioridad: override guardado por admin
  const guardado = localStorage.getItem('borondo:baseUrl');
  if (guardado) return guardado;

  // 2. Producción: window.location.origin (HTTPS)
  // 3. Desarrollo: si localhost, intentar detectar IP local via WebRTC o usar env var
  if (import.meta.env.VITE_PUBLIC_URL) return import.meta.env.VITE_PUBLIC_URL;

  return window.location.origin;
}

const [baseUrl, setBaseUrl] = useState(obtenerBaseUrl);

function handleBaseUrlChange(nuevaUrl) {
  try { new URL(nuevaUrl); } catch { return false; }
  localStorage.setItem('borondo:baseUrl', nuevaUrl);
  setBaseUrl(nuevaUrl);
  return true;
}
```

### Fix A3 — `abrirCuenta` atómico (RPC Supabase)
```sql
-- Migración SQL
CREATE OR REPLACE FUNCTION abrir_o_obtener_cuenta(p_mesa_id uuid)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_cuenta_id uuid;
BEGIN
  LOOP
    -- Intentar obtener existente
    SELECT id INTO v_cuenta_id
    FROM cuentas
    WHERE mesa_id = p_mesa_id
      AND estado IN ('abierta', 'pendiente_pago')
    ORDER BY abierta_en DESC
    LIMIT 1
    FOR NO KEY UPDATE SKIP LOCKED;  -- Evita race condition

    IF v_cuenta_id IS NOT NULL THEN
      RETURN v_cuenta_id;
    END IF;

    -- Intentar insertar (única por mesa+estado activo via partial unique index)
    BEGIN
      INSERT INTO cuentas (mesa_id, estado, total)
      VALUES (p_mesa_id, 'abierta', 0)
      RETURNING id INTO v_cuenta_id;
      RETURN v_cuenta_id;
    EXCEPTION WHEN unique_violation THEN
      -- Otro proceso la creó, reintentar loop
      CONTINUE;
    END;
  END LOOP;
END $$;

-- Índice parcial para garantizar una sola cuenta activa por mesa
CREATE UNIQUE INDEX IF NOT EXISTS ux_cuentas_mesa_activa
ON cuentas (mesa_id) WHERE estado IN ('abierta', 'pendiente_pago');
```

```javascript
// cuentas.js
export async function abrirCuenta(mesaId) {
  if (!supabaseConfigurado) { ... }
  const { data, error } = await supabase.rpc('abrir_o_obtener_cuenta', { p_mesa_id: mesaId });
  if (error) throw error;
  return { id: data, mesa_id: mesaId, estado: 'abierta', total: 0, abierta_en: new Date().toISOString() };
}
```

### Fix A4 — RLS Seguro (schema.sql)
```sql
-- ELIMINAR políticas DELETE públicas (líneas 253-257)
DROP POLICY IF EXISTS "mesas_eliminacion_publica" ON mesas;
DROP POLICY IF EXISTS "cuentas_eliminacion_publica" ON cuentas;
DROP POLICY IF EXISTS "pedidos_eliminacion_publica" ON pedidos;
DROP POLICY IF EXISTS "detalles_eliminacion_publica" ON detalles_pedido;
DROP POLICY IF EXISTS "ventas_eliminacion_publica" ON ventas;

-- SOLO authenticated puede borrar (admin)
-- Las políticas "admin_*_total" (líneas 260-265) YA CUBREN esto con auth.role() = 'authenticated'
-- NO se necesitan políticas DELETE públicas.
```

### Fix A5 — Error tipado en servicio
```javascript
// mesas.js
export class MesaNoEncontradaError extends Error { constructor() { super('Mesa no encontrada'); this.name = 'MesaNoEncontradaError'; } }
export class ErrorRedMesa extends Error { constructor(cause) { super('Error de red al buscar mesa'); this.name = 'ErrorRedMesa'; this.cause = cause; } }

export async function obtenerMesaPorCodigo(codigoQr) {
  if (!supabaseConfigurado) return mesasMock.find(m => m.codigo_qr?.toLowerCase() === codigoQr?.toLowerCase()) || null;
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .ilike('codigo_qr', codigoQr)
    .maybeSingle();

  if (error) {
    // PGRST116 = no rows found (maybeSingle)
    if (error.code === 'PGRST116') throw new MesaNoEncontradaError();
    throw new ErrorRedMesa(error);
  }
  return data;
}
```

```javascript
// MenuCliente.jsx
import { MesaNoEncontradaError, ErrorRedMesa } from '../../servicios/mesas.js';

try {
  const [mesaDatos, productosDatos] = await Promise.all([...]);
  if (!mesaDatos) throw new MesaNoEncontradaError();
  ...
} catch (e) {
  if (e instanceof MesaNoEncontradaError) setError('Mesa no encontrada');
  else if (e instanceof ErrorRedMesa) setError('Error de conexión. Verifica tu WiFi e intenta de nuevo.');
  else setError('Error inesperado al cargar el menú');
}
```

### Fix M7 — Realtime filtrado por mesa
```javascript
// SeguimientoPedido.jsx
const canal = supabase
  .channel(`seguimiento_mesa_${mesaDatos.id}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'pedidos',
    filter: `mesa_id=eq.${mesaDatos.id}`  // ✅ Solo esta mesa
  }, () => cargarDatos())
  .subscribe();
```

### Fix B11 — Carrito persistente
```javascript
// ContextoCarrito.jsx
const STORAGE_KEY = 'borondo:carrito';

function cargarPersistido() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return estadoInicial;
}

export function ProveedorCarrito({ children }) {
  const [estado, despachar] = useReducer(reductorCarrito, null, cargarPersistido);

  // Persistir en cada cambio (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    }, 300);
    return () => clearTimeout(timer);
  }, [estado]);
  ...
}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN POST-FIXES

| Escenario | Esperado | Cómo probar |
|-----------|----------|-------------|
| QR generado en admin local → escaneado desde celular misma red | Abre menú correcto | `npm run dev` → abrir `http://IP_LOCAL:5173/mesa/CODIGO` en celular |
| QR generado en producción (Vercel/Netlify) → escaneado en 4G | Abre menú correcto (HTTPS) | Deploy → probar desde móvil sin WiFi |
| Dos clientes escanean misma mesa simultáneamente | **Una sola cuenta** creada | Abrir 2 pestañas incógnito → `/mesa/CODIGO` → verificar `cuentas` en BD |
| Mesa inexistente (`/mesa/NOEXISTE`) | Mensaje "Mesa no encontrada" | Navegar manual |
| Mesa existe pero BD caída / red cortada | Mensaje "Error de conexión. Verifica tu WiFi..." | `supabaseConfigurado = false` temporal o bloquear red en DevTools |
| Admin cambia IP en modal QR → recarga página | IP persistida | Cambiar → F5 → verificar modal muestra IP nueva |
| Impresión QR en térmica 58mm | Legible, escaneable | `Imprimir QR` → imprimir en térmica → escanear con celular |
| Cliente recarga página tras agregar al carrito | Carrito conservado | Agregar items → F5 → verificar `ResumenCarrito` |

---

## 📎 ARCHIVOS MODIFICADOS EN ESTA AUDITORÍA (Solo documentación)

- `docs/AUDITORIA_QR_MENU_CLIENTE.md` ← **Este documento**

**NO se modificaron archivos de código.** Esta auditoría es de solo lectura.  
Para implementar fixes, crear branch `fix/qr-menu-audit` y aplicar cambios por fases.

---

*Generado automáticamente como parte del proceso de QA Senior. Próxima revisión sugerida: tras implementar Fase 1.*