-- =====================================================
-- 5. POLÍTICAS DE ADMINISTRADOR (CRÍTICO)
-- =====================================================
-- Este script habilita a los administradores para ver y gestionar
-- TODAS las solicitudes y mensajes, no solo los propios.
-- =====================================================

DO $$
BEGIN
    -- Política para que Admins vean TODAS las service_requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'service_requests' 
        AND policyname = 'Admins can view all requests'
    ) THEN
        CREATE POLICY "Admins can view all requests" ON service_requests
            FOR SELECT
            USING (
                auth.jwt() ->> 'email' = 'dedoctor.transportes@gmail.com' 
                OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
            );
        RAISE NOTICE '✅ Política Admin SELECT creada para service_requests';
    END IF;

    -- Política para que Admins puedan ACTUALIZAR service_requests (cambiar estatus)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'service_requests' 
        AND policyname = 'Admins can update requests'
    ) THEN
        CREATE POLICY "Admins can update requests" ON service_requests
            FOR UPDATE
            USING (
                auth.jwt() ->> 'email' = 'dedoctor.transportes@gmail.com' 
                OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
            );
        RAISE NOTICE '✅ Política Admin UPDATE creada para service_requests';
    END IF;

    -- Opcional: Política para que Admins vean TODOS los mensajes de chat
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'messages' 
        AND policyname = 'Admins can view all messages'
    ) THEN
        CREATE POLICY "Admins can view all messages" ON messages
            FOR SELECT
            USING (
                auth.jwt() ->> 'email' = 'dedoctor.transportes@gmail.com' 
                OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
            );
        RAISE NOTICE '✅ Política Admin SELECT creada para messages';
    END IF;
END
$$;
