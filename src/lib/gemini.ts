import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.warn('Missing Gemini API Key');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function getGeminiResponse(message: string) {
    if (!apiKey) {
        return "I'm sorry, I don't have an API key configured.";
    }
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating content:", error);
        return "I'm sorry, I encountered an error while processing your request.";
    }
}
