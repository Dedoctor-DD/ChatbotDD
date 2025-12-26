import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing env vars:', { url: !!SUPABASE_URL, key: !!SUPABASE_ANON_KEY });
}

interface ChatResponse {
    text?: string;
    error?: string;
}

export async function getGeminiResponse(
    prompt: string,
    conversationHistory: Array<{ role: string, content: string }> = []
): Promise<string> {
    try {
        // Send recent context (last 15 messages)
        const recentHistory = conversationHistory.slice(-15);

        // Get current session for user token
        const { data: { session } } = await supabase.auth.getSession();

        // FIX: If guest session (mock_token) or no session, use ANON KEY.
        const isMockToken = session?.access_token?.startsWith('mock_token');
        const authToken = (session?.access_token && !isMockToken)
            ? `Bearer ${session.access_token}`
            : `Bearer ${SUPABASE_ANON_KEY}`;

        // Create AbortController for timeout (40 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 40000);

        // Call Supabase Edge Function
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/chat`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken, // Valid token or Anon Key
                },
                body: JSON.stringify({
                    prompt,
                    conversationHistory: recentHistory
                }),
                signal: controller.signal
            }
        );
        clearTimeout(timeoutId);

        const data = await response.json() as ChatResponse;

        if (!response.ok) {
            console.error('Edge Function Error:', data);

            if (data.error?.includes('quota') || data.error?.includes('RESOURCE_EXHAUSTED')) {
                return 'Lo siento, hemos alcanzado el límite de la API. Por favor intenta en unos minutos.';
            }

            return `Error: ${data.error || response.statusText}`;
        }

        return data.text || "Lo siento, no pude generar una respuesta.";

    } catch (error) {
        console.error("Error calling Edge Function:", error);
        return "Lo siento, hubo un error de conexión con el servidor.";
    }
}
