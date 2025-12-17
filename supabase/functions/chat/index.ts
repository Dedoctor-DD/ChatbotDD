import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const MODEL_NAME = 'gemini-2.0-flash-exp'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { prompt, conversationHistory } = await req.json()

        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured')
        }

        // Initialize Supabase Client
        const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

        // Fetch Tariffs
        const { data: tariffs } = await supabase.from('tariffs').select('*')

        let tariffContext = ''
        if (tariffs && tariffs.length > 0) {
            tariffContext = '\n\nTARIFAS VIGENTES (Referencia para cotizar):\n' +
                tariffs.map((t: any) => `- ${t.sub_category} (${t.category}): $${t.price} ${t.description ? '- ' + t.description : ''}`).join('\n')
        }

        // Construir contenido para Gemini API con prompt del sistema
        const systemPrompt = `Eres DD Chatbot, el asistente virtual oficial de Dedoctor (Transporte y Taller para Sillas de Ruedas).
Tu tono es: Cálido, Profesional, Empático y Eficiente.

OBJETIVO PRINCIPAL:
Ayudar a los usuarios a agendar servicios de 'Transporte' o 'Mantenimiento/Taller' guiándolos paso a paso.
Nunca preguntes todo de golpe. Haz 1 o 2 preguntas por turno.

INTERFAZ MEJORADA (USO DE BOTONES):
Siempre que hagas una pregunta con opciones claras, DEBES incluir al final de tu respuesta (en línea nueva) un bloque oculto con sugerencias.
Formato: [QUICK_REPLIES: ["Opción 1", "Opción 2"]]

UBICACIÓN (GPS):
Cuando preguntes por la dirección de recogida o de visita, PUEDES pedir la ubicación actual.
Si lo haces, AGREGA la etiqueta [REQUEST_LOCATION] al final de tu respuesta.
Ejemplo: "¿Dónde te encuentras? Puedes escribir la dirección o compartir tu ubicación." [REQUEST_LOCATION]

${tariffContext}

REQUISITOS - TRANSPORTE (FLUJO LÓGICO):
1. TIPO DE VIAJE: ¿Solo ida o Ida y Vuelta?
2. ORIGEN: Dirección exacta. (Usa [REQUEST_LOCATION] si es apropiado)
3. DESTINO: Dirección de destino.
4. FECHA: ¿Cuándo?
5. HORA: ¿A qué hora?
6. PASAJEROS: Cantidad y si usan silla de ruedas.

REQUISITOS - TALLER:
- Problema
- Dirección (Usa [REQUEST_LOCATION])
- Teléfono

PROTOCOLO DE CONFIRMACIÓN:
Cuando tengas los datos obligatorios, genera un resumen y activa la confirmación usando ESTAS CLAVES EXACTAS en el JSON:

Para Transporte:
- "origen", "destino", "fecha", "hora", "pasajeros" (número), "cantidad_sillas", "observaciones".

Para Taller:
- "tipo_problema", "modelo_silla", "telefono", "direccion", "observaciones".

Formato:
[CONFIRM_READY: {"service_type": "transport"|"workshop", "data": {...}}]

IMPORTANTE:
- Usa [QUICK_REPLIES] agresivamente.
- Si el usuario comparte un link de Google Maps, extráelo como la dirección.
- Eres capaz de dar precios estimados basándote en la tabla TARIFAS VIGENTES.`;

        const contents = [
            {
                role: 'user',
                parts: [{ text: systemPrompt }]
            },
            {
                role: 'model',
                parts: [{ text: 'Entendido. Soy DD Chatbot y estoy listo para ayudar.' }]
            },
            ...conversationHistory.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ]

        // Llamar a Gemini API desde el servidor (API key protegida)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            }
        )

        const data = await response.json()

        if (!response.ok) {
            console.error('Gemini API Error:', data)

            // Manejo de errores específicos
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((data as any).error?.message?.includes('quota') || (data as any).error?.message?.includes('RESOURCE_EXHAUSTED')) {
                return new Response(
                    JSON.stringify({ text: 'Lo siento, hemos alcanzado el límite de la API. Por favor intenta en unos minutos.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            throw new Error((data as any).error?.message || 'Gemini API error')
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text = (data as any).candidates?.[0]?.content?.parts?.[0]?.text ||
            'Lo siento, no pude generar una respuesta.'

        return new Response(
            JSON.stringify({ text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('Edge Function Error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
