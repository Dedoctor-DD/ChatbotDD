/**
 * Script para verificar y crear tablas en Supabase
 * Este script verifica qué tablas existen y crea las faltantes
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde .env si existe (opcional)
// Si dotenv no está instalado, usar variables de entorno del sistema
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
                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
            }
        });
    }
} catch (e) {
    // Si falla, usar variables de entorno del sistema directamente
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Variables de entorno de Supabase no encontradas');
    console.error('   Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY en tu .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Verifica si una tabla existe
 */
async function checkTableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error) {
            // Si el error es que la tabla no existe, retornar false
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                return false;
            }
            throw error;
        }
        return true;
    } catch (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
            return false;
        }
        throw error;
    }
}

/**
 * Verifica tablas y muestra resumen
 */
async function checkTables() {
    console.log('\n🔍 Verificando tablas en Supabase...\n');

    const tables = ['messages', 'service_requests'];
    const results = {};

    for (const table of tables) {
        try {
            const exists = await checkTableExists(table);
            results[table] = exists;
            console.log(`${exists ? '✅' : '❌'} Tabla "${table}": ${exists ? 'EXISTE' : 'NO EXISTE'}`);
        } catch (error) {
            console.error(`❌ Error verificando tabla "${table}":`, error.message);
            results[table] = false;
        }
    }

    return results;
}

/**
 * Lee y muestra el contenido del SQL de creación
 */
function showSQLInstructions() {
    const sqlPath = join(__dirname, '..', 'supabase', 'create_all_tables.sql');
    try {
        const sqlContent = readFileSync(sqlPath, 'utf8');
        console.log('\n📝 INSTRUCCIONES PARA CREAR TABLAS:\n');
        console.log('1. Ve al Dashboard de Supabase: https://supabase.com/dashboard');
        console.log('2. Selecciona tu proyecto');
        console.log('3. Ve a "SQL Editor" en el menú lateral');
        console.log('4. Haz clic en "New Query"');
        console.log('5. Copia y pega el contenido del archivo: supabase/create_all_tables.sql');
        console.log('6. Haz clic en "Run" o presiona Ctrl+Enter');
        console.log('\n📄 El archivo SQL está en: supabase/create_all_tables.sql\n');
    } catch (error) {
        console.error('Error leyendo archivo SQL:', error.message);
    }
}

/**
 * Intenta contar registros en una tabla
 */
async function countRecords(tableName) {
    try {
        const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        return count;
    } catch (error) {
        return null;
    }
}

/**
 * Muestra estadísticas de las tablas
 */
async function showTableStats() {
    console.log('\n📊 Estadísticas de Tablas:\n');

    const tables = ['messages', 'service_requests'];
    for (const table of tables) {
        const exists = await checkTableExists(table);
        if (exists) {
            const count = await countRecords(table);
            console.log(`📋 ${table}: ${count !== null ? `${count} registros` : 'No se pudo contar'}`);
        } else {
            console.log(`📋 ${table}: No existe`);
        }
    }
}

/**
 * Función principal
 */
async function main() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  VERIFICACIÓN DE TABLAS - CHATBOT SUPABASE              ║');
    console.log('╚══════════════════════════════════════════════════════════╝');

    try {
        // Verificar tablas
        const results = await checkTables();

        // Mostrar estadísticas
        await showTableStats();

        // Verificar si faltan tablas
        const missingTables = Object.entries(results)
            .filter(([_, exists]) => !exists)
            .map(([table]) => table);

        if (missingTables.length > 0) {
            console.log('\n⚠️  TABLAS FALTANTES DETECTADAS:');
            missingTables.forEach(table => console.log(`   - ${table}`));
            console.log('\n📋 Sigue las instrucciones a continuación para crearlas:\n');
            showSQLInstructions();
        } else {
            console.log('\n✅ ¡Todas las tablas requeridas existen!');
            console.log('\n💡 Si necesitas recrear las tablas, puedes ejecutar el script SQL:');
            console.log('   supabase/create_all_tables.sql');
        }

        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║  VERIFICACIÓN COMPLETADA                                  ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

    } catch (error) {
        console.error('\n❌ Error durante la verificación:', error.message);
        console.error('\n💡 Asegúrate de que:');
        console.error('   1. Las variables de entorno estén configuradas correctamente');
        console.error('   2. Tu proyecto de Supabase esté activo');
        console.error('   3. Tengas permisos para acceder a la base de datos');
        process.exit(1);
    }
}

// Ejecutar
main();

