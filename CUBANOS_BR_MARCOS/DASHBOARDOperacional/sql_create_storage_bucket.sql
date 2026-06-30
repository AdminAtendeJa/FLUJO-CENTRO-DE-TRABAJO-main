-- 1. Crear el bucket si no existe (normalmente debes hacerlo desde el panel de Supabase si falla este insert)
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp_media', 'whatsapp_media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir lectura pública a cualquier usuario
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp_media');

-- 3. Permitir subida de archivos
DROP POLICY IF EXISTS "Allow Insert" ON storage.objects;
CREATE POLICY "Allow Insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'whatsapp_media');
