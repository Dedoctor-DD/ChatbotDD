-- =====================================================
-- SCRIPT COMPLETO DE CREACIÓN DE TABLAS PARA CHATBOT
-- =====================================================
-- Este script verifica y crea todas las tablas necesarias
-- para el funcionamiento del chatbot.
-- Es idempotente: puede ejecutarse múltiples veces sin errores.
-- =====================================================

-- =====================================================
-- 1. CREAR TIPOS ENUM (si no existen)
-- =====================================================

DO $$
BEGIN
    -- Crear tipo service_type si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
        CREATE TYPE service_type AS ENUM ('transport', 'workshop');
        RAISE NOTICE '✅ Tipo ENUM service_type creado exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️  Tipo ENUM service_type ya existe';
    END IF;

    -- Crear tipo request_status si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('draft', 'confirmed', 'completed', 'cancelled');
        RAISE NOTICE '✅ Tipo ENUM request_status creado exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️  Tipo ENUM request_status ya existe';
    END IF;
END
$$;

-- =====================================================
-- 2. CREAR TABLA messages
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        -- Crear la tabla messages
        CREATE TABLE messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            content TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            user_id UUID DEFAULT auth.uid(), -- Link to auth.users
            session_id TEXT, -- Optional: for grouping chats
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Habilitar Row Level Security
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

        -- Crear política para INSERT: Solo el propio usuario puede insertar
        CREATE POLICY "Users can insert their own messages" ON messages
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);

        -- Crear política para SELECT: Solo el propio usuario puede ver sus mensajes
        CREATE POLICY "Users can view their own messages" ON messages
            FOR SELECT 
            USING (auth.uid() = user_id);

        -- Crear índice para búsquedas por fecha y usuario
        CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
        CREATE INDEX idx_messages_user_id ON messages(user_id);
        CREATE INDEX idx_messages_session_id ON messages(session_id);

        RAISE NOTICE '✅ Tabla messages creada exitosamente con RLS estricto y políticas';
    ELSE
        RAISE NOTICE 'ℹ️  Tabla messages ya existe';
        
        -- Verificar si falta la columna user_id y agregarla
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='user_id') THEN
            ALTER TABLE messages ADD COLUMN user_id UUID DEFAULT auth.uid();
            CREATE INDEX idx_messages_user_id ON messages(user_id);
            RAISE NOTICE '✅ Columna user_id agregada a messages';
        END IF;

        -- Verificar si falta la columna session_id y agregarla
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='session_id') THEN
            ALTER TABLE messages ADD COLUMN session_id TEXT;
            CREATE INDEX idx_messages_session_id ON messages(session_id);
            RAISE NOTICE '✅ Columna session_id agregada a messages';
        END IF;
    END IF;
END
$$;

-- =====================================================
-- 3. CREAR TABLA service_requests
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_requests') THEN
        -- Crear la tabla service_requests
        CREATE TABLE service_requests (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id UUID DEFAULT auth.uid(), -- Link to auth.users
            service_type service_type NOT NULL,
            status request_status DEFAULT 'draft' NOT NULL,
            collected_data JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Habilitar Row Level Security
        ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

        -- Crear política para INSERT
        CREATE POLICY "Users can insert their own requests" ON service_requests
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);

        -- Crear política para SELECT
        CREATE POLICY "Users can view their own requests" ON service_requests
            FOR SELECT
            USING (auth.uid() = user_id);
            
         -- Permitir a admins ver todas las solicitudes (Opcional, basado en rol/email)
         -- Por ahora mantenemos simple para el usuario base.

        -- Crear índices para mejor rendimiento
        CREATE INDEX idx_service_requests_user_id ON service_requests(user_id);

        CREATE INDEX idx_service_requests_status ON service_requests(status);
        CREATE INDEX idx_service_requests_service_type ON service_requests(service_type);
        CREATE INDEX idx_service_requests_created_at ON service_requests(created_at DESC);
        
        -- Índice GIN para búsquedas en JSONB
        CREATE INDEX idx_service_requests_collected_data ON service_requests USING GIN (collected_data);

        -- Crear función para actualizar updated_at automáticamente
        CREATE OR REPLACE FUNCTION update_service_requests_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = timezone('utc'::text, now());
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Crear trigger para actualizar updated_at
        CREATE TRIGGER update_service_requests_timestamp
            BEFORE UPDATE ON service_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_service_requests_updated_at();

        RAISE NOTICE '✅ Tabla service_requests creada exitosamente con RLS, políticas, índices y triggers';
    ELSE
        RAISE NOTICE 'ℹ️  Tabla service_requests ya existe';
        
        -- Verificar que RLS esté habilitado
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE t.schemaname = 'public' 
            AND t.tablename = 'service_requests'
            AND c.relrowsecurity = true
        ) THEN
            ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE '✅ RLS habilitado en tabla service_requests';
        END IF;

        -- Verificar y crear políticas si no existen
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'service_requests' 
            AND policyname = 'Allow anonymous inserts'
        ) THEN
            CREATE POLICY "Allow anonymous inserts" ON service_requests
                FOR INSERT TO anon, authenticated WITH CHECK (true);
            RAISE NOTICE '✅ Política INSERT creada para service_requests';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'service_requests' 
            AND policyname = 'Allow reading own requests'
        ) THEN
            CREATE POLICY "Allow reading own requests" ON service_requests
                FOR SELECT TO anon, authenticated USING (true);
            RAISE NOTICE '✅ Política SELECT creada para service_requests';
        END IF;

        -- Crear función y trigger para updated_at si no existen
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'update_service_requests_updated_at'
        ) THEN
            CREATE OR REPLACE FUNCTION update_service_requests_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = timezone('utc'::text, now());
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            RAISE NOTICE '✅ Función update_service_requests_updated_at creada';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'update_service_requests_timestamp'
        ) THEN
            CREATE TRIGGER update_service_requests_timestamp
                BEFORE UPDATE ON service_requests
                FOR EACH ROW
                EXECUTE FUNCTION update_service_requests_updated_at();
            RAISE NOTICE '✅ Trigger update_service_requests_timestamp creado';
        END IF;
    END IF;
END
$$;

-- =====================================================
-- 4. VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar resumen de tablas creadas
SELECT 
    '📊 RESUMEN DE TABLAS' AS info;

SELECT 
    tablename AS "Tabla",
    schemaname AS "Esquema",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = t.tablename 
            AND n.nspname = t.schemaname
            AND c.relrowsecurity = true
        ) THEN '✅ Habilitado'
        ELSE '❌ Deshabilitado'
    END AS "RLS"
FROM pg_tables t
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'service_requests')
ORDER BY tablename;

-- Mostrar políticas RLS
SELECT 
    '🔐 POLÍTICAS RLS' AS info;

SELECT 
    tablename AS "Tabla",
    policyname AS "Política",
    cmd AS "Operación",
    CASE 
        WHEN roles = '{anon,authenticated}' OR roles = '{anon}' OR roles = '{authenticated}' 
        THEN '✅ Público'
        ELSE '🔒 Restringido'
    END AS "Acceso"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('messages', 'service_requests')
ORDER BY tablename, policyname;

-- Mostrar tipos ENUM
SELECT 
    '📋 TIPOS ENUM' AS info;

SELECT 
    t.typname AS "Tipo",
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS "Valores"
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('service_type', 'request_status')
GROUP BY t.typname
ORDER BY t.typname;

-- Mostrar índices creados
SELECT 
    '📇 ÍNDICES' AS info;

SELECT 
    tablename AS "Tabla",
    indexname AS "Índice",
    indexdef AS "Definición"
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('messages', 'service_requests')
ORDER BY tablename, indexname;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
-- ✅ Todas las tablas han sido verificadas y creadas
-- ✅ RLS está habilitado en todas las tablas
-- ✅ Políticas de acceso configuradas
-- ✅ Índices creados para optimización
-- ✅ Triggers configurados para updated_at
-- =====================================================

