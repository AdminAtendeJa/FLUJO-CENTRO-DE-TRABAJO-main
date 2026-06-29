-- ==============================================================================
-- Solución RLS para la tabla notas_kommo
-- Propósito: Permitir inserciones y actualizaciones a la tabla desde el Dashboard (Anon)
-- ==============================================================================

-- 1. Habilitar RLS explícitamente por seguridad
ALTER TABLE public.notas_kommo ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que cualquier usuario (incluyendo anónimos) pueda LEER
CREATE POLICY "Permitir lectura a todos" 
ON public.notas_kommo 
FOR SELECT 
USING (true);

-- 3. Permitir que n8n y el Dashboard (anónimos) puedan INSERTAR
CREATE POLICY "Permitir insertar a n8n" 
ON public.notas_kommo 
FOR INSERT 
WITH CHECK (true);

-- 4. Permitir que n8n pueda ACTUALIZAR (para el historial flotante)
CREATE POLICY "Permitir actualizar a n8n" 
ON public.notas_kommo 
FOR UPDATE 
USING (true);

-- 5. Permitir borrar (por si acaso desde el Dashboard)
CREATE POLICY "Permitir borrar a n8n" 
ON public.notas_kommo 
FOR DELETE 
USING (true);
