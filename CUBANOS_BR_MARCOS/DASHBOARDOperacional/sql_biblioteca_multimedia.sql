-- ==============================================================================
-- Tabla: biblioteca_multimedia
-- Propósito: Almacenar la lista global de audios y videos pregrabados
-- para ser utilizados en el panel de entrega de documentos (WhatsApp).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.biblioteca_multimedia (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    nombre text NOT NULL,
    tipo_contenido text NOT NULL, -- ej: 'audio/mpeg', 'video/mp4'
    url_archivo text NOT NULL,
    tamano integer, -- tamaño en bytes
    creado_en timestamp with time zone DEFAULT now(),
    CONSTRAINT biblioteca_multimedia_pkey PRIMARY KEY (id)
);

-- Políticas de seguridad (RLS)
ALTER TABLE public.biblioteca_multimedia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica" 
ON public.biblioteca_multimedia FOR SELECT 
USING (true);

CREATE POLICY "Permitir insercion" 
ON public.biblioteca_multimedia FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir borrado" 
ON public.biblioteca_multimedia FOR DELETE 
USING (true);
