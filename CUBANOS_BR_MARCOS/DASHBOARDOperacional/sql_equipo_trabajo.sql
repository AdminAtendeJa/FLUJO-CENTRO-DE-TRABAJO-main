-- ==============================================================================
-- Modificación: Función de Equipo de Trabajo, Historial y Chat
-- Propósito: Manejo de usuarios, auditoría global y chat interno.
-- Instrucciones: Ejecutar este script en el SQL Editor de Supabase.
-- ==============================================================================

-- 1. Tabla de Perfiles
-- Se vincula a auth.users para guardar información pública de cada miembro.
CREATE TABLE IF NOT EXISTS public.perfiles (
    id uuid references auth.users on delete cascade not null primary key,
    nombre text not null default 'Usuario',
    email text,
    rol text default 'miembro', -- 'admin' o 'miembro'
    creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles
DROP POLICY IF EXISTS "Perfiles visibles para todos los autenticados" ON public.perfiles;
CREATE POLICY "Perfiles visibles para todos los autenticados" ON public.perfiles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.perfiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.perfiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Trigger para crear perfil automáticamente cuando un usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombre, rol)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'rol', 'miembro')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Tabla de Historial Global por Cliente (Auditoría)
CREATE TABLE IF NOT EXISTS public.historial_clientes (
    id uuid default gen_random_uuid() primary key,
    cliente_id bigint references public.clientes(id) on delete cascade not null,
    usuario_id uuid references public.perfiles(id) on delete set null,
    accion text not null, -- Ej. "MODIFICACION", "CREACION", "ELIMINACION"
    descripcion text not null, -- Ej. "Cambió el nombre a Juan"
    creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.historial_clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Historial visible para todos los autenticados" ON public.historial_clientes;
CREATE POLICY "Historial visible para todos los autenticados" ON public.historial_clientes
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Todos los autenticados pueden insertar historial" ON public.historial_clientes;
CREATE POLICY "Todos los autenticados pueden insertar historial" ON public.historial_clientes
    FOR INSERT TO authenticated WITH CHECK (true);


-- 3. Tabla de Chat de Equipo
CREATE TABLE IF NOT EXISTS public.chat_equipo (
    id uuid default gen_random_uuid() primary key,
    usuario_id uuid references public.perfiles(id) on delete cascade not null,
    mensaje text not null,
    creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.chat_equipo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat visible para todos los autenticados" ON public.chat_equipo;
CREATE POLICY "Chat visible para todos los autenticados" ON public.chat_equipo
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Todos pueden enviar mensajes al chat" ON public.chat_equipo;
CREATE POLICY "Todos pueden enviar mensajes al chat" ON public.chat_equipo
    FOR INSERT TO authenticated WITH CHECK (true);

-- Habilitar Realtime para el chat de equipo y el historial
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_equipo'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_equipo;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'historial_clientes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.historial_clientes;
  END IF;
END $$;
