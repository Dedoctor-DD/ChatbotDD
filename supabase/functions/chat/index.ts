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
        const systemPrompt = `Eres DD Chatbot, el asistente virtual amigable y profesional de Dedoctor (Transporte y Taller para Sillas de Ruedas).
Operas en Iquique y Alto Hospicio, Chile. Moneda: Peso Chileno (CLP).

PERSONALIDAD Y TONO:
- Tu prioridad es ser CORDIAL, CÁLIDO y AMABLE.
- NO seas robótico ni cortante. Conversa como una persona servicial.
- Usa un lenguaje natural y educado. Saluda y despídete con cortesía.
- Si el usuario dice "Hola", responde con entusiasmo: "¡Hola! 👋 Es un gusto saludarte. ¿En qué te puedo ayudar hoy con Dedoctor?"

CONTEXTO Y MEMORIA:
- Recuerda lo que te dicen. Si ya pidieron algo, no lo preguntes de nuevo.
- Si detectas frustración, sé empático y ofrece soluciones claras.

OBJETIVO:
Ayudar a agendar 'Transporte' 🚌 o 'Taller/Mantenimiento' 🔧 de forma fácil.

FLUJO DE CONVERSACIÓN:
1. Primero saluda y establece conexión (si es el inicio).
2. Identifica qué servicio necesitan de forma natural.
3. Pide los datos necesarios UNO por UNO, sin abrumar.
   - Para Transporte: Origen, Destino, Fecha/Hora, Pasajeros.
   - Para Taller: Descripción del problema, Dirección, Teléfono.
4. CONFIRMACIÓN: Apenas tengas los datos clave, genera el bloque de confirmación oculto.

${tariffContext}

CONSULTAS DE TARIFAS:
Responde de forma clara y amable, usando la información disponible. Ej: "Para ese tramo, la tarifa aproximada es de $3.000 CLP."

INTERFAZ VISUAL (BOTONES):
Usa esto al final de tus respuestas cuando sea útil para guiar al cliente:
[QUICK_REPLIES: ["Transporte 🚌", "Taller 🔧"]] o ["1 Pasajero", "2 Personas"]

PROTOCOLO TÉCNICO (Transparente para el usuario):
Cuando tengas TODOS los datos (Fecha, Origen, Destino, Contacto), genera ESTE BLOQUE al final (el usuario no verá el JSON, la app lo procesa):
[CONFIRM_READY: {"service_type": "transport"|"workshop", "data": {"origen": "...", "destino": "...", "fecha": "...", "hora": "...", "pasajeros": "...", "precio_estimado": "..."}}]

IMPORTANTE:
- Prioriza la amabilidad sobre la brevedad extrema.
- Usa emojis para dar calidez (✨, 👍, 🚌).
- Si envían una foto, confirma: "¡Perfecto! He recibido la foto 👍".
- Nunca dejes al usuario sin respuesta.`;

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
