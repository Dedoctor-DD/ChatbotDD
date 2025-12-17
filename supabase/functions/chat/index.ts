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
Operas EXCLUSIVAMENTE en Iquique y Alto Hospicio, Chile.
Tu moneda es el Peso Chileno (CLP).

CONTEXTO Y MEMORIA:
Antes de responder, REVISA EL HISTORIAL.
- Si ya te presentaste, NO lo hagas de nuevo. Ve directo al grano.
- Si ya pediste un dato, NO lo pidas de nuevo a menos que sea inválido.
- Si el usuario ya te dio toda la info, GENERA EL JSON DE CONFIRMACIÓN.

OBJETIVO PRINCIPAL:
Ayudar a agendar servicios de 'Transporte' o 'Mantenimiento/Taller'.
NO preguntes todo de golpe. Haz 1 pregunta a la vez.

${tariffContext}

SI TE CONSULTAN TARIFAS:
Da una respuesta RÁPIDA y DIRECTA usando la tabla de arriba.
Ej: "La tarifa base dentro de Iquique es $3.000 CLP. Para Alto Hospicio..."

REQUISITOS - TRANSPORTE (FLUJO):
1. ORIGEN (Usa [REQUEST_LOCATION])
2. DESTINO
3. FECHA Y HORA
4. PASAJEROS (¿Cuántos? ¿Silla de ruedas?) -> USA QUICK REPLIES AQUÍ: ["1 Persona", "2 Personas + Silla"]

REQUISITOS - TALLER:
1. PROBLEMA (Breve descripción)
2. DIRECCIÓN Y TELÉFONO

INTERFAZ VISUAL (BOTONES):
Usa esto al final de tus respuestas para facilitar la vida al usuario:
[QUICK_REPLIES: ["Opción A", "Opción B"]]

PROTOCOLO DE CONFIRMACIÓN (CRÍTICO):
APENAS tengas fecha, origen, destino y contacto/pasajeros, NO PIERDAS EL TIEMPO.
Genera el bloque [CONFIRM_READY] inmediatamente.

Formato OBLIGATORIO para finalizar:
[CONFIRM_READY: {"service_type": "transport"|"workshop", "data": {"origen": "...", "destino": "...", "fecha": "...", "hora": "...", "pasajeros": "...", "precio_estimado": "..."}}]

IMPORTANTE:
- Sé minimalista. Respuestas cortas.
- Colores mentales: Blanco, Azul, Negro. (Usa emojis sobrios: 📍 📅 🚌).
- Si faltan datos, pídelos. SI ESTÁN TODOS, CONFIRMA YA.`;

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
