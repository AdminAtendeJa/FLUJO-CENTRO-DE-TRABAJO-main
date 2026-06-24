-- ============================================================
-- EJECUTAR EN SUPABASE → SQL EDITOR
-- Dashboard Cubanos BR — Vistas, RLS y Realtime
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. VISTA: v_clientes_entradas
--    Cada cliente con contadores de entradas pre-calculados
-- ────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS v_clientes_entradas;

CREATE OR REPLACE VIEW v_clientes_entradas
WITH (security_invoker = true) AS
SELECT
  c.*,
  COALESCE(COUNT(e.id), 0)::integer AS num_entradas,
  COALESCE(COUNT(CASE WHEN e.estado_tramite = 'completada' THEN 1 END), 0)::integer AS num_completadas,
  COALESCE(COUNT(CASE WHEN e.estado_tramite = 'pendiente' THEN 1 END), 0)::integer AS num_pendientes,
  COALESCE(COUNT(CASE WHEN e.estado_tramite = 'procesando' THEN 1 END), 0)::integer AS num_procesando,
  COALESCE(SUM(CASE WHEN e.estado_tramite = 'completada' THEN e.valor ELSE 0 END), 0)::numeric AS valor_completado,
  MAX(e.fecha) AS fecha_ultima_entrada
FROM clientes c
LEFT JOIN entradas e ON e.id_cliente = c.id
GROUP BY c.id;

-- ────────────────────────────────────────────────────────────
-- 2. VISTA: v_historial_detallado
--    Historial de cambios con nombres legibles
-- ────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS v_historial_detallado;

CREATE OR REPLACE VIEW v_historial_detallado
WITH (security_invoker = true) AS
SELECT
  h.*,
  c.nombre  AS nombre_cliente,
  ent.servicio AS nombre_servicio
FROM historial_cambios h
LEFT JOIN clientes c   ON h.id_cliente = c.id
LEFT JOIN entradas ent ON h.id_entrada = ent.id;

-- ────────────────────────────────────────────────────────────
-- 3. RLS para historial_cambios
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.historial_cambios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_read_historial" ON public.historial_cambios;
CREATE POLICY "dashboard_read_historial" ON public.historial_cambios
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "dashboard_insert_historial" ON public.historial_cambios;
CREATE POLICY "dashboard_insert_historial" ON public.historial_cambios
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "dashboard_delete_historial" ON public.historial_cambios;
CREATE POLICY "dashboard_delete_historial" ON public.historial_cambios
  FOR DELETE TO anon, authenticated USING (true);

-- ────────────────────────────────────────────────────────────
-- 4. RLS de UPDATE para entradas (permite edición desde la app)
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "dashboard_update_entradas" ON public.entradas;
CREATE POLICY "dashboard_update_entradas" ON public.entradas
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dashboard_insert_entradas" ON public.entradas;
CREATE POLICY "dashboard_insert_entradas" ON public.entradas
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "dashboard_delete_entradas" ON public.entradas;
CREATE POLICY "dashboard_delete_entradas" ON public.entradas
  FOR DELETE TO anon, authenticated USING (true);

-- ────────────────────────────────────────────────────────────
-- 5. Realtime para historial_cambios
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'historial_cambios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.historial_cambios;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 6. RLS SELECT para vistas (heredan de tablas base,
--    pero necesitan permisos de lectura explícitos)
-- ────────────────────────────────────────────────────────────

GRANT SELECT ON v_clientes_entradas TO anon, authenticated;
GRANT SELECT ON v_historial_detallado TO anon, authenticated;

-- ============================================================
-- FIN — Ejecuta este script completo en Supabase SQL Editor
-- ============================================================
