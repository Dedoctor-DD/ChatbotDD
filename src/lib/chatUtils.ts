import type { Message, ConfirmationData } from '../types';

export const PATTERNS = {
    QUICK_REPLIES: /\[QUICK_REPLIES:\s*(\[.*?\])\s*\]/s,
    CONFIRM_READY: /\[CONFIRM_READY:\s*({[\s\S]*?})\]/i,
    REQUEST_LOCATION: /\[REQUEST_LOCATION\]/
};

export interface ParsedMessage {
    cleanContent: string;
    options?: string[];
    confirmationData?: ConfirmationData | null;
    requestLocation?: boolean;
}

/**
 * Parses a raw message string from the bot to extract special commands
 * like Quick Replies or Confirmation Blocks.
 */
export function parseBotMessage(rawContent: string): ParsedMessage {
    let cleanContent = rawContent;
    let options: string[] = [];
    let confirmationData: ConfirmationData | null = null;
    let requestLocation = false;

    // 1. Extract Quick Replies
    const qrMatch = cleanContent.match(PATTERNS.QUICK_REPLIES);
    if (qrMatch) {
        try {
            options = JSON.parse(qrMatch[1]);
            cleanContent = cleanContent.replace(qrMatch[0], '').trim();
        } catch (e) {
            console.error('Error parsing quick replies:', e);
        }
    }

    // 2. Extract Confirmation Data
    const confirmMatch = cleanContent.match(PATTERNS.CONFIRM_READY);
    if (confirmMatch && confirmMatch[1]) {
        try {
            let jsonStr = confirmMatch[1].trim();
            // Clean up markdown code blocks if present
            if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '');
            if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '');
            if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/```$/, '');

            confirmationData = JSON.parse(jsonStr);
            // Usually if we have confirmation, we don't show old options, but let's keep logic flexible
            options = [];
            cleanContent = cleanContent.replace(confirmMatch[0], '').trim();

            // If content is empty after stripping, provide a default
            if (!cleanContent) {
                cleanContent = 'He preparado tu solicitud. Por favor confirma los detalles abajo: 👇';
            }
        } catch (e) {
            console.error('Failed to parse confirmation data JSON:', e);
        }
    }

    // 3. Check for Location Request
    if (cleanContent.includes('[REQUEST_LOCATION]')) {
        requestLocation = true;
        cleanContent = cleanContent.replace('[REQUEST_LOCATION]', '').trim();
    }

    return {
        cleanContent,
        options: options.length > 0 ? options : undefined,
        confirmationData,
        requestLocation
    };
}

/**
 * Formats a list of database messages into the Message type used by the UI,
 * extracting hidden metadata like options.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatHistoryMessages(dbMessages: any[]): { messages: Message[], lastConfirmation: ConfirmationData | null } {
    let lastConfirmation: ConfirmationData | null = null;

    const messages = dbMessages.map(m => {
        const { cleanContent, options, confirmationData } = parseBotMessage(m.content);

        // Track the last confirmation data found in history (usually the last bot message)
        if (confirmationData) {
            lastConfirmation = confirmationData;
        }

        return {
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: cleanContent,
            rawContent: m.content, // Keep raw for debugging or re-parsing if needed
            timestamp: new Date(m.created_at),
            options
        };
    });

    return { messages, lastConfirmation };
}
