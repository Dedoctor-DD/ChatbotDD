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

        // Initialize Supabase Client with Auth header from request
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
                userContext = `\n\nDATOS DEL USUARIO (Usa esto para autocompletar):\n` +
                    `- Nombre: ${profile.full_name}\n` +
                    `- Teléfono: ${profile.phone || 'No registrado'}\n` +
                    `- Dirección: ${profile.address || 'No registrado'}`;
            }
        }

        // 3. Fetch Tariffs
        const { data: tariffs } = await supabase.from('tariffs').select('*');
        let tariffContext = '';
        if (tariffs && tariffs.length > 0) {
            tariffContext = '\n\nTARIFAS Y SERVICIOS DISPONIBLES:\n' +
                (tariffs as Tariff[]).map(t => `- ${t.sub_category} (${t.category}): $${t.price} ${t.description ? '- ' + t.description : ''}`).join('\n')
        }

        const systemPrompt = `Eres DD Chatbot, el asistente experto de Dedoctor (Movilidad y Servicio Técnico).
📍 Operas en Iquique y Alto Hospicio, Chile. Moneda: CLP.

FILOSOFÍA DE ATENCIÓN:
- Eres EMPÁTICO y paciente. Ayudas a personas con discapacidad o movilidad reducida.
- RECUERDA TODO lo que el usuario te ha dicho en esta conversación. NO ignores el historial previo.

SERVICIOS QUE OFRECES:
1. TRANSPORTE ADAPTADO 🚌: Van con rampa para sillas de ruedas.
2. MANTENCIÓN / TALLER 🔧: 
   - Sillas de ruedas manuales y eléctricas.
   - Andadores (con y sin rodado / "burrito").
   - Bastones y muletas.
   - Alzadores, catres clínicos y Camillas ortopédicas.
   - Órtesis y otras ayudas técnicas.

REGLAS DE INTERACCIÓN CRÍTICAS:
1. PIDE DATOS UNO POR UNO. No preguntes todo a la vez.
2. Si el usuario pide ayuda para un "burrito", bastón, camilla o cualquier otra ayuda técnica, gestiónalo como servicio de TALLER.
3. NUNCA reinicies la conversación bruscamente. Mantén el hilo.
4. Si detectas que tienes todos los datos necesarios, genera el BLOQUE DE CONFIRMACIÓN al final.

${userContext}
${tariffContext}

BLOQUE DE CONFIRMACIÓN (OBLIGATORIO AL FINAL):
No uses bloques de código markdown. Genera el texto plano:

- Para TRANSPORTE: [CONFIRM_READY: {"service_type": "transport", "data": {"origen": "...", "destino": "...", "fecha": "...", "hora": "...", "pasajeros": "...", "precio_estimado": "..."}}]
- Para TALLER: [CONFIRM_READY: {"service_type": "workshop", "data": {"tipo_problema": "...", "modelo_equipo": "...", "direccion": "...", "telefono": "...", "precio_estimado": "..."}}]

QUICK REPLIES: [QUICK_REPLIES: ["Transporte 🚌", "Mantención Equipo 🔧", "Ver mis solicitudes 📋"]]`;

        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Entendido. Soy el asistente de Dedoctor y estoy listo para ayudar con transporte y mantención de ayudas técnicas de forma empática.' }] },
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
