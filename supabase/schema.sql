-- ============================================
-- BORONDO — Schema de Base de Datos
-- 100% en español
-- Versión: 1.1.0 (Simplificado)
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TIPOS ENUMERADOS (ENUMS)
-- ============================================

CREATE TYPE estado_mesa AS ENUM (
  'disponible',
  'ocupada',
  'pendiente_pago',
  'cerrada'
);

CREATE TYPE estado_pedido AS ENUM (
  'recibido',
  'en_preparacion',
  'listo',
  'entregado',
  'cancelado'
);

CREATE TYPE estado_cuenta AS ENUM (
  'abierta',
  'pendiente_pago',
  'pagada',
  'cerrada'
);

CREATE TYPE metodo_pago AS ENUM (
  'efectivo',
  'transferencia'
);

CREATE TYPE tipo_movimiento AS ENUM (
  'entrada',
  'salida',
  'ajuste'
);

-- ============================================
-- TABLA: mesas (Simplificada: solo nombre de la mesa)
-- ============================================
CREATE TABLE IF NOT EXISTS mesas (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL UNIQUE,
  estado       estado_mesa NOT NULL DEFAULT 'disponible',
  codigo_qr    TEXT UNIQUE NOT NULL,
  creada_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLA: productos
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre         TEXT NOT NULL,
  descripcion    TEXT,
  precio_venta   DECIMAL(10, 2) NOT NULL DEFAULT 0,
  costo          DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock          INTEGER NOT NULL DEFAULT 0,
  stock_minimo   INTEGER NOT NULL DEFAULT 5,
  imagen_url     TEXT,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLA: cuentas
-- Vista acumulada del consumo de una mesa.
-- ============================================
CREATE TABLE IF NOT EXISTS cuentas (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mesa_id      UUID NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
  estado       estado_cuenta NOT NULL DEFAULT 'abierta',
  total        DECIMAL(10, 2) NOT NULL DEFAULT 0,
  abierta_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cerrada_en   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cuentas_mesa_estado ON cuentas(mesa_id, estado);

-- ============================================
-- TABLA: pedidos
-- Transacciones individuales del cliente.
-- ============================================
CREATE TABLE IF NOT EXISTS pedidos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mesa_id         UUID NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
  cuenta_id       UUID REFERENCES cuentas(id) ON DELETE CASCADE,
  estado          estado_pedido NOT NULL DEFAULT 'recibido',
  observaciones   TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos(mesa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cuenta ON pedidos(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);

-- ============================================
-- TABLA: detalles_pedido
-- Ítems individuales de cada pedido
-- ============================================
CREATE TABLE IF NOT EXISTS detalles_pedido (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad        INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detalles_pedido ON detalles_pedido(pedido_id);

-- ============================================
-- TABLA: ventas
-- Registro final de cobro
-- ============================================
CREATE TABLE IF NOT EXISTS ventas (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cuenta_id    UUID NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  mesa_id      UUID NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
  total        DECIMAL(10, 2) NOT NULL,
  metodo_pago  metodo_pago NOT NULL DEFAULT 'efectivo',
  vendido_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(vendido_en);
CREATE INDEX IF NOT EXISTS idx_ventas_mesa ON ventas(mesa_id);

-- ============================================
-- TABLA: inventario
-- Stock actual por producto
-- ============================================
CREATE TABLE IF NOT EXISTS inventario (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id     UUID NOT NULL UNIQUE REFERENCES productos(id) ON DELETE CASCADE,
  stock_actual    INTEGER NOT NULL DEFAULT 0,
  stock_minimo    INTEGER NOT NULL DEFAULT 5,
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLA: movimientos_inventario
-- ============================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id  UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  tipo         tipo_movimiento NOT NULL,
  cantidad     INTEGER NOT NULL,
  motivo       TEXT,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(creado_en);

-- ============================================
-- TABLA: cierres
-- Cierres diarios de caja
-- ============================================
CREATE TABLE IF NOT EXISTS cierres (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha                 DATE NOT NULL,
  total_ventas          DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_efectivo        DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_transferencias  DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cantidad_ventas       INTEGER NOT NULL DEFAULT 0,
  cerrado_en            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cierres_fecha ON cierres(fecha);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pedidos_actualizado_en ON pedidos;
CREATE TRIGGER trigger_pedidos_actualizado_en
BEFORE UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE OR REPLACE FUNCTION actualizar_inventario_por_movimiento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE inventario
    SET stock_actual = stock_actual + NEW.cantidad,
        actualizado_en = NOW()
    WHERE producto_id = NEW.producto_id;
  ELSIF NEW.tipo = 'salida' THEN
    UPDATE inventario
    SET stock_actual = GREATEST(0, stock_actual - NEW.cantidad),
        actualizado_en = NOW()
    WHERE producto_id = NEW.producto_id;
  ELSIF NEW.tipo = 'ajuste' THEN
    UPDATE inventario
    SET stock_actual = NEW.cantidad,
        actualizado_en = NOW()
    WHERE producto_id = NEW.producto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_movimiento_inventario ON movimientos_inventario;
CREATE TRIGGER trigger_movimiento_inventario
AFTER INSERT ON movimientos_inventario
FOR EACH ROW EXECUTE FUNCTION actualizar_inventario_por_movimiento();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE cierres ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "mesas_lectura_publica" ON mesas FOR SELECT USING (TRUE);
CREATE POLICY "productos_lectura_publica" ON productos FOR SELECT USING (activo = TRUE);
CREATE POLICY "cuentas_lectura_publica" ON cuentas FOR SELECT USING (TRUE);
CREATE POLICY "pedidos_lectura_publica" ON pedidos FOR SELECT USING (TRUE);
CREATE POLICY "detalles_lectura_publica" ON detalles_pedido FOR SELECT USING (TRUE);

-- Políticas de inserción pública para pedidos de clientes
CREATE POLICY "pedidos_insercion_publica" ON pedidos FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "detalles_insercion_publica" ON detalles_pedido FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "cuentas_insercion_publica" ON cuentas FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "cuentas_actualizacion_publica" ON cuentas FOR UPDATE USING (TRUE);
CREATE POLICY "pedidos_actualizacion_publica" ON pedidos FOR UPDATE USING (TRUE);
CREATE POLICY "mesas_actualizacion_publica" ON mesas FOR UPDATE USING (TRUE);
CREATE POLICY "mesas_insercion_publica" ON mesas FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "mesas_eliminacion_publica" ON mesas FOR DELETE USING (TRUE);
CREATE POLICY "cuentas_eliminacion_publica" ON cuentas FOR DELETE USING (TRUE);
CREATE POLICY "pedidos_eliminacion_publica" ON pedidos FOR DELETE USING (TRUE);
CREATE POLICY "detalles_eliminacion_publica" ON detalles_pedido FOR DELETE USING (TRUE);
CREATE POLICY "ventas_eliminacion_publica" ON ventas FOR DELETE USING (TRUE);

-- Políticas completas para administradores autenticados
CREATE POLICY "admin_mesas_total" ON mesas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_productos_total" ON productos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_ventas_total" ON ventas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_inventario_total" ON inventario FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_movimientos_total" ON movimientos_inventario FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_cierres_total" ON cierres FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- BASE DE DATOS LISTA PARA PRODUCCIÓN
-- Las tablas están creadas y listas para recibir
-- tus mesas, productos e inventario reales.
-- ============================================
