-- ==============================================================================
-- Tabla: operarios
-- Propósito: Almacenar la lista de operadores / equipo interno.
-- Ejecutar en Supabase → SQL Editor
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.operarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  iniciales text,
  activo boolean DEFAULT true,
  creado_en timestamptz DEFAULT now()
);

-- Insertar datos iniciales comunes
INSERT INTO public.operarios (nombre, iniciales) VALUES 
  ('MARCOS', 'MP'),
  ('SOPHIA', 'SF'),
  ('LUCAS', 'L'),
  ('CARLOS', 'C'),
  ('JS', 'JS'),
  ('M MARCO', 'MM')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.operarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "operarios_select" ON public.operarios;
CREATE POLICY "operarios_select" ON public.operarios
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "operarios_insert" ON public.operarios;
CREATE POLICY "operarios_insert" ON public.operarios
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "operarios_update" ON public.operarios;
CREATE POLICY "operarios_update" ON public.operarios
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "operarios_delete" ON public.operarios;
CREATE POLICY "operarios_delete" ON public.operarios
  FOR DELETE TO authenticated USING (true);
