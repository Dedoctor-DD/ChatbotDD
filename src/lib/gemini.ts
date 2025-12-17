import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing env vars:', { url: !!SUPABASE_URL, key: !!SUPABASE_ANON_KEY });
}

export async function getGeminiResponse(
    prompt: string,
    conversationHistory: Array<{ role: string, content: string }> = []
): Promise<string> {
    try {
        // Enviar más contexto (últimos 15 mensajes) para evitar que el bot olvide datos previos
        const recentHistory = conversationHistory.slice(-15);

        // Obtener sesión actual para enviar token de usuario si existe
        // Obtener sesión actual para enviar token de usuario si existe
        const { data: { session } } = await supabase.auth.getSession();

        // FIX: Si es sesión de invitado (token 'mock_token') o no hay sesión, usamos la ANON KEY.
        // Si mandamos 'Bearer mock_token', Supabase rechazará la llamada (Signature verification failed).
        const isMockToken = session?.access_token?.startsWith('mock_token');
        const authToken = (session?.access_token && !isMockToken)
            ? `Bearer ${session.access_token}`
            : `Bearer ${SUPABASE_ANON_KEY}`;

        // Create AbortController for timeout (20 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        // Llamar a Edge Function de Supabase en lugar de Gemini directamente
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/chat`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken,
                },
                body: JSON.stringify({
                    prompt,
                    conversationHistory: recentHistory
                }),
                signal: controller.signal
            }
        );
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            console.error('Edge Function Error:', data);

            // Manejo de errores específicos
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((data as any).error?.includes('quota') || (data as any).error?.includes('RESOURCE_EXHAUSTED')) {
                return 'Lo siento, hemos alcanzado el límite de la API. Por favor intenta en unos minutos.';
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return `Error: ${(data as any).error || response.statusText}`;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data as any).text || "Lo siento, no pude generar una respuesta.";

    } catch (error) {
        console.error("Error calling Edge Function:", error);
        return "Lo siento, hubo un error de conexión con el servidor.";
    }
}
