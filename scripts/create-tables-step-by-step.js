/**
 * Script para crear tablas dividiendo el SQL en partes ejecutables
 * Usa la Management API de Supabase (equivalente a MCP)
 */

import https from 'https';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
let envVars = {};
try {
    const fs = await import('fs');
    const envPath = join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const match = trimmed.match(/^([^#=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, '');
                    envVars[key] = value;
                }
            }
        });
    }
} catch (e) {
    // Usar variables de entorno del sistema
}

const token = process.env.SUPABASE_ACCESS_TOKEN || envVars.SUPABASE_ACCESS_TOKEN || 'sbp_aff5587b227798c53aa466d7b36b987c9a7e1806';
const projectRef = process.env.SUPABASE_PROJECT_REF || envVars.SUPABASE_PROJECT_REF || 'utsuqmulvfcyxqlonlnf';

/**
 * Ejecutar query SQL
 */
function executeSQL(query, description) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${projectRef}/database/query`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'MCP-Supabase-Migration'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log(`✅ ${description}`);
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    const errorMsg = data ? JSON.parse(data).message || data : `HTTP ${res.statusCode}`;
                    // Algunos errores son esperados (como "ya existe")
                    if (errorMsg.includes('already exists') || errorMsg.includes('ya existe')) {
                        console.log(`ℹ️  ${description} (ya existe)`);
                        resolve({ skipped: true });
                    } else {
                        console.error(`❌ ${description} - ${errorMsg}`);
                        reject(new Error(errorMsg));
                    }
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Error en ${description}:`, error.message);
            reject(error);
        });

        req.write(JSON.stringify({ query: query }));
        req.end();
    });
}

/**
 * Función principal - Ejecuta SQL en partes
 */
async function main() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  CREANDO TABLAS EN SUPABASE (Método MCP)               ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log(`📋 Project Ref: ${projectRef}\n`);

    try {
        // Paso 1: Crear tipos ENUM
        console.log('📋 Paso 1: Creando tipos ENUM...\n');
        
        await executeSQL(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
                    CREATE TYPE service_type AS ENUM ('transport', 'workshop');
                END IF;
            END $$;
        `, 'Tipo service_type');

        await executeSQL(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
                    CREATE TYPE request_status AS ENUM ('draft', 'confirmed', 'completed', 'cancelled');
                END IF;
            END $$;
        `, 'Tipo request_status');

        // Paso 2: Crear tabla service_requests
        console.log('\n📋 Paso 2: Creando tabla service_requests...\n');
        
        await executeSQL(`
            CREATE TABLE IF NOT EXISTS service_requests (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                session_id TEXT NOT NULL,
                service_type service_type NOT NULL,
                status request_status DEFAULT 'draft' NOT NULL,
                collected_data JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );
        `, 'Tabla service_requests');

        // Paso 3: Habilitar RLS
        console.log('\n📋 Paso 3: Configurando RLS...\n');
        
        await executeSQL(`
            ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
        `, 'RLS habilitado');

        // Paso 4: Crear políticas
        console.log('\n📋 Paso 4: Creando políticas RLS...\n');
        
        await executeSQL(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE schemaname = 'public' 
                    AND tablename = 'service_requests' 
                    AND policyname = 'Allow anonymous inserts'
                ) THEN
                    CREATE POLICY "Allow anonymous inserts" ON service_requests
                        FOR INSERT TO anon, authenticated WITH CHECK (true);
                END IF;
            END $$;
        `, 'Política INSERT');

        await executeSQL(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE schemaname = 'public' 
                    AND tablename = 'service_requests' 
                    AND policyname = 'Allow reading own requests'
                ) THEN
                    CREATE POLICY "Allow reading own requests" ON service_requests
                        FOR SELECT TO anon, authenticated USING (true);
                END IF;
            END $$;
        `, 'Política SELECT');

        // Paso 5: Crear índices
        console.log('\n📋 Paso 5: Creando índices...\n');
        
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_service_requests_session_id ON service_requests(session_id);',
            'CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);',
            'CREATE INDEX IF NOT EXISTS idx_service_requests_service_type ON service_requests(service_type);',
            'CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);',
            'CREATE INDEX IF NOT EXISTS idx_service_requests_collected_data ON service_requests USING GIN (collected_data);'
        ];

        for (const indexSQL of indexes) {
            await executeSQL(indexSQL, `Índice: ${indexSQL.match(/idx_\w+/)?.[0] || 'desconocido'}`);
        }

        // Paso 6: Crear función y trigger
        console.log('\n📋 Paso 6: Creando función y trigger...\n');
        
        await executeSQL(`
            CREATE OR REPLACE FUNCTION update_service_requests_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = timezone('utc'::text, now());
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `, 'Función update_service_requests_updated_at');

        await executeSQL(`
            DROP TRIGGER IF EXISTS update_service_requests_timestamp ON service_requests;
            CREATE TRIGGER update_service_requests_timestamp
                BEFORE UPDATE ON service_requests
                FOR EACH ROW
                EXECUTE FUNCTION update_service_requests_updated_at();
        `, 'Trigger update_service_requests_timestamp');

        // Verificación final
        console.log('\n📋 Verificando resultado...\n');
        
        const verifyResult = await executeSQL(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'service_requests';
        `, 'Verificación de tabla');

        if (verifyResult && Array.isArray(verifyResult) && verifyResult.length > 0) {
            console.log('\n✅ ¡Tabla service_requests creada exitosamente!');
        }

        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║  ✅ PROCESO COMPLETADO EXITOSAMENTE                        ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

    } catch (error) {
        console.error('\n❌ Error durante el proceso:', error.message);
        console.error('\n💡 Si el error persiste, ejecuta el SQL manualmente:');
        console.error('   1. Ve a https://supabase.com/dashboard');
        console.error('   2. SQL Editor → New Query');
        console.error('   3. Copia el contenido de: supabase/create_all_tables.sql');
        console.error('   4. Ejecuta el query\n');
        process.exit(1);
    }
}

// Ejecutar
main().catch(console.error);

