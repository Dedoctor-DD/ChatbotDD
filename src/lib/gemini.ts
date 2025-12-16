const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL is not set');
}

// Nota: Ya NO necesitamos VITE_GEMINI_API_KEY
// La API key ahora está protegida en la Edge Function de Supabase

export async function getGeminiResponse(
    prompt: string,
    conversationHistory: Array<{ role: string, content: string }> = []
): Promise<string> {
    try {
        // Limitar historial a últimos 2 mensajes para optimizar tokens
        const recentHistory = conversationHistory.slice(-2);

        // Llamar a Edge Function de Supabase en lugar de Gemini directamente
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/chat`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    conversationHistory: recentHistory
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Edge Function Error:', data);

            // Manejo de errores específicos
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
