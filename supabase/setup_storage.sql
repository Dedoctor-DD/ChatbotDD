-- =====================================================
-- CONFIGURACIÓN DE STORAGE (ARCHIVOS)
-- =====================================================
-- Este script configura el bucket para guardar imágenes y archivos
-- y crea la tabla para relacionarlos con las solicitudes.
-- =====================================================

-- 1. Crear el BUCKET 'request_attachments'
-- Solo inserta si no existe.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'request_attachments', 
    'request_attachments', 
    false, -- Privado por defecto (requiere token firmado o RLS)
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;


-- 2. Crear Tabla para Metadatos de Archivos
CREATE TABLE IF NOT EXISTS public.request_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Relación con la solicitud (puede ser nulo inicialmente si suben antes de crear la request)
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    
    -- Dueño del archivo
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Datos de Storage
    file_path TEXT NOT NULL, -- Ej: "user_123/foto_rueda.jpg"
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT
);

-- Habilitar RLS en la tabla
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;


-- 3. POLÍTICAS DE ACCESO (TABLA public.request_attachments)

-- A. USUARIOS: Ver sus propios archivos
CREATE POLICY "Users can view own attachments" ON public.request_attachments
    FOR SELECT USING (auth.uid() = user_id);

-- B. USUARIOS: Crear registros de sus archivos
CREATE POLICY "Users can insert own attachments" ON public.request_attachments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- C. ADMINS: Ver TODOS los archivos
-- Basado en la lógica de admin_policies.sql
CREATE POLICY "Admins can view all attachments" ON public.request_attachments
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'dedoctor.transportes@gmail.com' 
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );


-- 4. POLÍTICAS DE STORAGE (storage.objects)
-- Estas políticas controlan quién puede subir/descargar bits reales del bucket.

-- A. USUARIOS: Subir archivos a su propia carpeta (carpeta = user_id)
-- Requiere que el path del archivo empiece con su user_id + '/'
CREATE POLICY "Users can upload to own folder" ON storage.objects
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'request_attachments' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- B. USUARIOS: Ver/Descargar sus propios archivos
CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT TO authenticated 
    USING (
        bucket_id = 'request_attachments' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- C. ADMINS: Ver/Descargar CUALQUIER archivo del bucket
CREATE POLICY "Admins can view all files" ON storage.objects
    FOR SELECT TO authenticated 
    USING (
        bucket_id = 'request_attachments' AND (
            auth.jwt() ->> 'email' = 'dedoctor.transportes@gmail.com' 
            OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    );
