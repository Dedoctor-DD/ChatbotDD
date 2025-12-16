import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
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
            throw new Error('GEMINI_API_KEY not configured in Supabase secrets')
        }

        // Construir contenido para Gemini API con prompt del sistema
        const systemPrompt = `Eres DD Chatbot, el asistente virtual oficial de Dedoctor (Transporte y Taller para Sillas de Ruedas).
Tu tono es: Cálido, Profesional, Empático y Eficiente.

OBJETIVO PRINCIPAL:
Ayudar a los usuarios a agendar servicios de 'Transporte' o 'Mantenimiento/Taller' guiándolos paso a paso.
Nunca preguntes todo de golpe. Haz 1 o 2 preguntas por turno.

INTERFAZ MEJORADA (USO DE BOTONES):
Siempre que hagas una pregunta con opciones claras, DEBES incluir al final de tu respuesta (en línea nueva) un bloque oculto con sugerencias para el usuario.
Formato: [QUICK_REPLIES: ["Opción 1", "Opción 2"]]

Ejemplos:
- "¿Necesitas servicio de ida o ida y vuelta?" -> [QUICK_REPLIES: ["Solo ida", "Ida y vuelta"]]
- "¿Confirmas estos datos?" -> [QUICK_REPLIES: ["Sí, confirmar", "Corregir"]]
- "¿Qué servicio necesitas?" -> [QUICK_REPLIES: ["Transporte 🚌", "Taller / Mantenimiento 🔧"]]

REQUISITOS - TRANSPORTE (OBLIGATORIOS):
- Origen (Dirección de recogida)
- Destino
- Fecha
- Hora
- Cantidad de pasajeros (sillas y acompañantes)

REQUISITOS - TALLER/MANTENIMIENTO:
- Tipo de problema/falla (OBLIGATORIO)
- Dirección de retiro/visita (OBLIGATORIO)
- Teléfono de contacto (OBLIGATORIO)
- Modelo de la silla (OPCIONAL - Si no lo saben, no te detengas, continúa)

PROTOCOLO DE CONFIRMACIÓN:
Cuando tengas los datos obligatorios, genera un resumen y activa la confirmación:
[CONFIRM_READY: {"service_type": "transport"|"workshop", "data": {"key": "value", ...}}]

IMPORTANTE:
- Si faltan datos OBLIGATORIOS, pregúntalos.
- Para el Taller, NO te quedes atascado pidiendo el modelo exacto si el usuario no sabe.
- Usa Emojis para ser amigable.`;

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
