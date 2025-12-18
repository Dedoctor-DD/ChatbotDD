import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
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
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase credentials not configured');

        const { prompt, conversationHistory } = await req.json() as ChatRequest;

        // Initialize Supabase Client
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Fetch Tariffs
        const { data: tariffs, error: tariffError } = await supabase.from('tariffs').select('*');
        if (tariffError) {
            console.error('Error fetching tariffs:', tariffError);
        }

        let tariffContext = '';
        if (tariffs && tariffs.length > 0) {
            tariffContext = '\n\nTARIFAS VIGENTES (Referencia para cotizar):\n' +
                (tariffs as Tariff[]).map(t => `- ${t.sub_category} (${t.category}): $${t.price} ${t.description ? '- ' + t.description : ''}`).join('\n')
        }

        // Construir contenido para Gemini API con prompt del sistema
        const systemPrompt = `Eres DD Chatbot, el asistente virtual amigable y experto de Dedoctor (Transporte y Taller para Sillas de Ruedas).
📍 Operas en Iquique y Alto Hospicio, Chile. Moneda: CLP.

TONO DE VOZ:
- Extremadamente CORDIAL y EMPÁTICO. No eres una máquina, eres un asesor servicial.
- Usa frases como: "¡Con gusto!", "Entiendo perfectamente", "Excelente elección", "Muchas gracias por esperar".
- Usa emojis de forma natural (✨, 🚌, 🔧, ✅).

REGLAS DE ORO:
1. PIDE DATOS UNO POR UNO. No hagas un cuestionario largo.
2. Si el usuario selecciona "Transporte", pregúntale: ¿Desde dónde necesitas el traslado? (Origen).
3. Una vez te dé el origen, pregúntale: ¿Hacia dónde te diriges? (Destino).
4. Luego pide Fecha y Hora. Finalmente, pregunta cuántos pasajeros acompañan al usuario de silla de ruedas.
5. Para "Taller/Mantenimiento": Pregunta la falla, luego la dirección y un teléfono de contacto.

TARIFAS DE REFERENCIA:
${tariffContext}

BLOQUE DE CONFIRMACIÓN (CRÍTICO):
Solo cuando tengas todos los datos necesarios, genera este bloque exacto al FINAL de tu mensaje (No lo expliques). Ajusta los campos según el servicio:

- Para TRANSPORTE: [CONFIRM_READY: {"service_type": "transport", "data": {"origen": "...", "destino": "...", "fecha": "...", "hora": "...", "pasajeros": "...", "precio_estimado": "Cifra basada en tarifas"}}]
- Para TALLER: [CONFIRM_READY: {"service_type": "workshop", "data": {"tipo_problema": "...", "modelo_silla": "...", "direccion": "...", "telefono": "...", "precio_estimado": "Cifra basada en tarifas"}}]

BOTONES DE APOYO:
Sugiere opciones usando: [QUICK_REPLIES: ["Transporte 🚌", "Taller 🔧"]]
Si el usuario manda fotos, responde: "¡Gracias! Recibí la foto. La adjuntaré a tu solicitud."`;

        const contents = [
            {
                role: 'user',
                parts: [{ text: systemPrompt }]
            },
            {
                role: 'model',
                parts: [{ text: 'Entendido. Soy DD Chatbot y estoy listo para ayudar.' }]
            },
            ...conversationHistory.map((msg) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ];

        // Llamar a Gemini API desde el servidor (API key protegida)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', data);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMsg = (data as any).error?.message || 'Unknown Gemini API error';

            if (errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
                return new Response(
                    JSON.stringify({ text: 'Lo siento, hemos alcanzado el límite de la API. Por favor intenta en unos minutos.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            throw new Error(errorMsg);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text = (data as any).candidates?.[0]?.content?.parts?.[0]?.text ||
            'Lo siento, no pude generar una respuesta.';

        return new Response(
            JSON.stringify({ text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
