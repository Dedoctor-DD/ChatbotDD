import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        console.log(`Reading .env from: ${envPath}`);
        if (!fs.existsSync(envPath)) {
            console.error("File does not exist!");
            return {};
        }
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envFile.split(/\r?\n/).forEach(line => {
            // Skip comments and empty lines
            if (!line || line.startsWith('#')) return;

            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error("Could not read .env file:", e.message);
        return {};
    }
}

const env = loadEnv();
console.log("Keys found in .env:", Object.keys(env));

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY; // This is the key name used in src/lib/supabase.ts

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Required keys not found.');
    console.log('Expected: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
    process.exit(1);
}

console.log(`Connecting to Supabase at: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('--- Testing Connection ---');
    // Check if 'messages' table exists
    const { data, error } = await supabase.from('messages').select('count', { count: 'exact', head: true });

    if (error) {
        console.log('Result: Error encountered');
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);

        if (error.code === '42P01') { // undefined_table
            console.log("\nSUCCESS: Connected to Supabase! The 'messages' table does not exist yet.");
        } else {
            console.log("\nFAILURE: Could not verify connection clearly. Check error message above.");
        }
    } else {
        console.log("\nSUCCESS: Connected and 'messages' table exists!");

        // Test Insert
        console.log("--- Testing Insert ---");
        const { error: insertError } = await supabase.from('messages').insert({
            content: 'Test message from verification script',
            role: 'system',
            created_at: new Date().toISOString()
        });

        if (insertError) {
            console.log("INSERT FAILED: ", insertError.message);
            console.log("This is likely due to RLS (Row Level Security) policies.");
        } else {
            console.log("INSERT SUCCESS: Wrote to 'messages' table.");
        }
    }
}

verify();
