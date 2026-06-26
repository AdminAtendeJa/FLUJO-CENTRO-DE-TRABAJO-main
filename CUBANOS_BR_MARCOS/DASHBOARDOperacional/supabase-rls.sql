-- Ejecutar en Supabase → SQL Editor
-- Habilita lectura para el dashboard (anon key) y realtime en las 3 tablas

ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_read_entradas" ON public.entradas;
DROP POLICY IF EXISTS "dashboard_read_salidas" ON public.salidas;
DROP POLICY IF EXISTS "dashboard_read_clientes" ON public.clientes;

CREATE POLICY "dashboard_read_entradas" ON public.entradas
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "dashboard_read_salidas" ON public.salidas
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "dashboard_insert_salidas" ON public.salidas;
CREATE POLICY "dashboard_insert_salidas" ON public.salidas
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "dashboard_update_salidas" ON public.salidas;
CREATE POLICY "dashboard_update_salidas" ON public.salidas
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dashboard_read_clientes" ON public.clientes
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "dashboard_update_clientes" ON public.clientes;
CREATE POLICY "dashboard_update_clientes" ON public.clientes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dashboard_insert_entradas" ON public.entradas;
CREATE POLICY "dashboard_insert_entradas" ON public.entradas
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "dashboard_insert_clientes" ON public.clientes;
CREATE POLICY "dashboard_insert_clientes" ON public.clientes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "dashboard_delete_entradas" ON public.entradas;
CREATE POLICY "dashboard_delete_entradas" ON public.entradas
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "dashboard_delete_clientes" ON public.clientes;
CREATE POLICY "dashboard_delete_clientes" ON public.clientes
  FOR DELETE TO authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'entradas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.entradas;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'salidas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.salidas;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'clientes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
  END IF;
END $$;
