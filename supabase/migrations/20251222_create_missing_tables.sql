-- =====================================================
-- SCRIPT DE CORRECCIÓN: CREACIÓN DE TABLAS FALTANTES
-- =====================================================
-- Este script crea las tablas 'partners' y 'landing_leads'
-- que están causando errores 500 en la Landing Page.
-- =====================================================

-- 1. TABLA PARTNERS
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Políticas Partners (Lectura pública, Escritura Admin)
CREATE POLICY "Public can read active partners" ON public.partners
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can do everything on partners" ON public.partners
    FOR ALL USING (auth.email() = 'dedoctor.transportes@gmail.com');


-- 2. TABLA LANDING_LEADS
CREATE TABLE IF NOT EXISTS public.landing_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_type TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;

-- Políticas Leads (Insert público para el formulario, Select Admin)
CREATE POLICY "Public can insert leads" ON public.landing_leads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view leads" ON public.landing_leads
    FOR SELECT USING (auth.email() = 'dedoctor.transportes@gmail.com');


-- 3. INSERTAR DATOS DE EJEMPLO EN PARTNERS
INSERT INTO public.partners (name, display_order)
VALUES 
    ('Partner 1', 1),
    ('Partner 2', 2)
ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ Tablas partners y landing_leads creadas exitosamente.';
