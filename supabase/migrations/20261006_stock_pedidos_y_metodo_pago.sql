-- Ejecutar una vez en Supabase SQL Editor para actualizar una base existente.
-- El detalle del pedido descuenta stock de productos e inventario dentro de
-- la misma transacción, incluso cuando el pedido lo crea un cliente anónimo.

ALTER TABLE public.cuentas
  ADD COLUMN IF NOT EXISTS metodo_pago public.metodo_pago;

CREATE OR REPLACE FUNCTION public.actualizar_inventario_por_movimiento()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_actual INTEGER;
  v_stock_minimo INTEGER;
  v_nuevo_stock INTEGER;
BEGIN
  SELECT stock, stock_minimo
  INTO v_stock_actual, v_stock_minimo
  FROM public.productos
  WHERE id = NEW.producto_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe el producto % para el movimiento de inventario', NEW.producto_id;
  END IF;

  IF NEW.tipo = 'entrada' THEN
    v_nuevo_stock := v_stock_actual + NEW.cantidad;
  ELSIF NEW.tipo = 'salida' THEN
    v_nuevo_stock := GREATEST(0, v_stock_actual - NEW.cantidad);
  ELSIF NEW.tipo = 'ajuste' THEN
    v_nuevo_stock := NEW.cantidad;
  END IF;

  UPDATE public.productos
  SET stock = v_nuevo_stock
  WHERE id = NEW.producto_id;

  INSERT INTO public.inventario (producto_id, stock_actual, stock_minimo, actualizado_en)
  VALUES (NEW.producto_id, v_nuevo_stock, v_stock_minimo, NOW())
  ON CONFLICT (producto_id) DO UPDATE
  SET stock_actual = EXCLUDED.stock_actual,
      stock_minimo = EXCLUDED.stock_minimo,
      actualizado_en = EXCLUDED.actualizado_en;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

CREATE OR REPLACE FUNCTION public.validar_stock_disponible()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_actual INTEGER;
  v_nombre_prod TEXT;
BEGIN
  SELECT stock, nombre
  INTO v_stock_actual, v_nombre_prod
  FROM public.productos
  WHERE id = NEW.producto_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe el producto % solicitado', NEW.producto_id;
  END IF;

  IF v_stock_actual < NEW.cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto "%". Disponibles: %, Solicitados: %',
      v_nombre_prod, v_stock_actual, NEW.cantidad;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

CREATE OR REPLACE FUNCTION public.descontar_stock_detalle_pedido()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_actual INTEGER;
  v_stock_minimo INTEGER;
BEGIN
  SELECT stock, stock_minimo
  INTO v_stock_actual, v_stock_minimo
  FROM public.productos
  WHERE id = NEW.producto_id;

  INSERT INTO public.inventario (producto_id, stock_actual, stock_minimo, actualizado_en)
  VALUES (NEW.producto_id, v_stock_actual, v_stock_minimo, NOW())
  ON CONFLICT (producto_id) DO NOTHING;

  INSERT INTO public.movimientos_inventario (producto_id, tipo, cantidad, motivo)
  VALUES (NEW.producto_id, 'salida', NEW.cantidad, 'Pedido ' || LEFT(NEW.pedido_id::TEXT, 8));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

DROP TRIGGER IF EXISTS trigger_descontar_stock_detalle ON public.detalles_pedido;
CREATE TRIGGER trigger_descontar_stock_detalle
AFTER INSERT ON public.detalles_pedido
FOR EACH ROW EXECUTE FUNCTION public.descontar_stock_detalle_pedido();

CREATE OR REPLACE FUNCTION public.reponer_stock_pedido_cancelado()
RETURNS TRIGGER AS $$
DECLARE
  v_detalle RECORD;
BEGIN
  IF OLD.estado IS DISTINCT FROM 'cancelado' AND NEW.estado = 'cancelado' THEN
    FOR v_detalle IN
      SELECT producto_id, cantidad
      FROM public.detalles_pedido
      WHERE pedido_id = NEW.id
    LOOP
      INSERT INTO public.movimientos_inventario (producto_id, tipo, cantidad, motivo)
      VALUES (
        v_detalle.producto_id,
        'entrada',
        v_detalle.cantidad,
        'Cancelación pedido ' || LEFT(NEW.id::TEXT, 8)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

DROP TRIGGER IF EXISTS trigger_reponer_stock_pedido_cancelado ON public.pedidos;
CREATE TRIGGER trigger_reponer_stock_pedido_cancelado
AFTER UPDATE OF estado ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.reponer_stock_pedido_cancelado();

CREATE OR REPLACE FUNCTION public.validar_entrega_antes_de_solicitar_cuenta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'pendiente_pago'
     AND OLD.estado IS DISTINCT FROM 'pendiente_pago'
     AND EXISTS (
       SELECT 1
       FROM public.pedidos
       WHERE cuenta_id = NEW.id
         AND estado NOT IN ('entregado', 'cancelado')
     ) THEN
    RAISE EXCEPTION 'No se puede solicitar la cuenta hasta que todos los pedidos estén entregados';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

DROP TRIGGER IF EXISTS trigger_validar_entrega_antes_de_solicitar_cuenta ON public.cuentas;
CREATE TRIGGER trigger_validar_entrega_antes_de_solicitar_cuenta
BEFORE UPDATE OF estado ON public.cuentas
FOR EACH ROW EXECUTE FUNCTION public.validar_entrega_antes_de_solicitar_cuenta();
