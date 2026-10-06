-- Ejecutar en Supabase SQL Editor para crear la configuración compartida
-- editable desde el panel administrativo.

CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
  id              BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  nombre_sistema  TEXT NOT NULL DEFAULT 'BORONDO Bar POS',
  version         TEXT NOT NULL DEFAULT '1.0.0',
  moneda          TEXT NOT NULL DEFAULT 'MXN (Peso mexicano)',
  idioma          TEXT NOT NULL DEFAULT 'Español',
  zona_horaria    TEXT NOT NULL DEFAULT 'America/Mexico_City',
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.configuracion_sistema (id)
VALUES (TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_configuracion_sistema_total" ON public.configuracion_sistema;
CREATE POLICY "admin_configuracion_sistema_total" ON public.configuracion_sistema
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public_read_configuracion_sistema" ON public.configuracion_sistema;
CREATE POLICY "public_read_configuracion_sistema" ON public.configuracion_sistema
  FOR SELECT USING (TRUE);

UPDATE public.configuracion_sistema
SET moneda = CASE
      WHEN moneda ~ '^[A-Z]{3}$' THEN moneda
      WHEN moneda ILIKE 'COP%' OR moneda ILIKE '%colomb%' THEN 'COP'
      WHEN moneda ILIKE 'USD%' OR moneda ILIKE '%dólar%' OR moneda ILIKE '%dollar%' THEN 'USD'
      WHEN moneda ILIKE 'EUR%' OR moneda ILIKE '%euro%' THEN 'EUR'
      WHEN moneda ILIKE 'GBP%' OR moneda ILIKE '%libra%' THEN 'GBP'
      ELSE 'MXN'
    END,
    idioma = CASE
      WHEN lower(idioma) IN ('en', 'english', 'inglés', 'ingles') THEN 'en'
      ELSE 'es'
    END
WHERE id = TRUE;
