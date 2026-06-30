-- ==============================================================================
-- Tabla: notas_tramite
-- Propósito: Almacenar el historial de notas/actualizaciones de cada trámite.
-- Ejecutar en Supabase → SQL Editor
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notas_tramite (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entrada_id uuid NOT NULL REFERENCES public.entradas(id) ON DELETE CASCADE,
  texto text NOT NULL,
  creado_en timestamptz DEFAULT now(),
  creado_por text DEFAULT 'operador'
);

-- Índice para consultas por trámite
CREATE INDEX IF NOT EXISTS idx_notas_tramite_entrada_id ON public.notas_tramite(entrada_id);

-- RLS
ALTER TABLE public.notas_tramite ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notas_tramite_select" ON public.notas_tramite;
CREATE POLICY "notas_tramite_select" ON public.notas_tramite
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "notas_tramite_insert" ON public.notas_tramite;
CREATE POLICY "notas_tramite_insert" ON public.notas_tramite
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notas_tramite_delete" ON public.notas_tramite;
CREATE POLICY "notas_tramite_delete" ON public.notas_tramite
  FOR DELETE TO authenticated USING (true);
