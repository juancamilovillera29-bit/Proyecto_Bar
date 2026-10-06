INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imagenes-productos',
  'imagenes-productos',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "imagenes_productos_lectura_publica" ON storage.objects;
CREATE POLICY "imagenes_productos_lectura_publica"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'imagenes-productos');

DROP POLICY IF EXISTS "imagenes_productos_carga_admin" ON storage.objects;
CREATE POLICY "imagenes_productos_carga_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'imagenes-productos');

DROP POLICY IF EXISTS "imagenes_productos_actualizacion_admin" ON storage.objects;
CREATE POLICY "imagenes_productos_actualizacion_admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'imagenes-productos')
  WITH CHECK (bucket_id = 'imagenes-productos');

DROP POLICY IF EXISTS "imagenes_productos_eliminacion_admin" ON storage.objects;
CREATE POLICY "imagenes_productos_eliminacion_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'imagenes-productos');
