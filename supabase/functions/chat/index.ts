import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const MODEL_NAME = 'gemini-2.0-flash-exp'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Message {
    role: 'user' | 'model';
    content: string;
}

interface ChatRequest {
    prompt: string;
    conversationHistory: Message[];
}

interface Tariff {
    category: string;
    sub_category: string;
    price: number;
    description?: string;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase credentials not configured');

        const { prompt, conversationHistory } = await req.json() as ChatRequest;

        // Initialize Supabase Client with Service Role (to bypass RLS for profile fetching if needed, or just use auth header)
        // Actually, better use the user's token for safety if we just want their profile.
        // But for "smart" context, service role helps fetch everything once.
        const authHeader = req.headers.get('Authorization')
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader || '' } }
        });

        // 1. Get User Session/ID
        const { data: { user } } = await supabase.auth.getUser();

        // 2. Fetch Profile
        let userContext = '';
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, phone, address')
                .eq('id', user.id)
                .maybeSingle();

            if (profile) {
                userContext = `\n\nDATOS DEL USUARIO (Usa esto para autocompletar si es necesario):\n` +
                    `- Nombre: ${profile.full_name}\n` +
                    `- Teléfono: ${profile.phone || 'No registrado'}\n` +
                    `- Dirección: ${profile.address || 'No registrado'}`;
            }
        }

        // 3. Fetch Tariffs
        const { data: tariffs } = await supabase.from('tariffs').select('*');
        let tariffContext = '';
        if (tariffs && tariffs.length > 0) {
            tariffContext = '\n\nTARIFAS VIGENTES (Referencia para cotizar):\n' +
                (tariffs as Tariff[]).map(t => `- ${t.sub_category} (${t.category}): $${t.price} ${t.description ? '- ' + t.description : ''}`).join('\n')
        }

        const systemPrompt = `Eres DD Chatbot, el asistente virtual amigable y experto de Dedoctor (Transporte y Taller para Sillas de Ruedas).
📍 Operas en Iquique y Alto Hospicio, Chile. Moneda: CLP.

TONO DE VOZ:
- Extremadamente CORDIAL y EMPÁTICO.
- Usa emojis (✨, 🚌, 🔧, ✅).

REGLAS DE ORO:
1. PIDE DATOS UNO POR UNO.
2. PERSONALIZACIÓN: Si el usuario ya tiene teléfono o dirección en su perfil, NO se los vuelvas a preguntar bruscamente. Puedes decir: "¿Deseas usar la dirección registrada (${userContext?.match(/Dirección: (.*)/)?.[1]}) o prefieres otra?".
3. TRANSPORTE: Pide Origen, Destino, Fecha/Hora y Pasajeros.
4. TALLER/MANTENIMIENTO: Pregunta el problema.

${userContext}
${tariffContext}

BLOQUE DE CONFIRMACIÓN (CRÍTICO):
Genera este bloque exacto al FINAL de tu mensaje cuando tengas todo. Usa los datos del perfil si el usuario no indicó cambios.

- Para TRANSPORTE: [CONFIRM_READY: {"service_type": "transport", "data": {"origen": "...", "destino": "...", "fecha": "...", "hora": "...", "pasajeros": "...", "precio_estimado": "Cifra basados en tarifas"}}]
- Para TALLER: [CONFIRM_READY: {"service_type": "workshop", "data": {"tipo_problema": "...", "modelo_silla": "...", "direccion": "...", "telefono": "...", "precio_estimado": "Cifra basados en tarifas"}}]

BOTONES DE APOYO: [QUICK_REPLIES: ["Transporte 🚌", "Taller 🔧"]]`;

        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Entendido. Estoy listo con el contexto del usuario.' }] },
            ...conversationHistory.map((msg) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            { role: 'user', parts: [{ text: prompt }] }
        ];

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            }
        );

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Gemini API Error');

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Lo siento, no pude generar una respuesta.';

        return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('Edge Function Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
