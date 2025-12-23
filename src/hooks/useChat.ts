import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getGeminiResponse } from '../lib/gemini';
import { uploadAttachment } from '../lib/storage';
import { generateUUID } from '../lib/utils';
import type { Message, ConfirmationData } from '../types';
import type { Session } from '@supabase/supabase-js';

export function useChat(session: Session | null, activeTab: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
    const [showLocationBtn, setShowLocationBtn] = useState(false);
    const [sessionId, setSessionId] = useState(() => {
        const saved = localStorage.getItem('dd_current_session_id');
        return saved || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    });
    const [pendingAttachmentIds, setPendingAttachmentIds] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Persist session ID
    useEffect(() => {
        localStorage.setItem('dd_current_session_id', sessionId);
    }, [sessionId]);

    const createNewSession = useCallback(() => {
        const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newId);
        setMessages([]);
        setConfirmationData(null);
        return newId;
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (activeTab === 'chat') {
            scrollToBottom();
        }
    }, [messages, activeTab]);

    // Load persistent history
    useEffect(() => {
        const loadHistory = async () => {
            if (!session || activeTab !== 'chat') return;

            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('session_id', sessionId)
                    .order('created_at', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    const formattedMessages: Message[] = data.map(m => {
                        let displayContent = m.content;

                        const qrMatch = displayContent.match(/\[QUICK_REPLIES:\s*(\[.*?\])\s*\]/s);
                        let options: string[] = [];
                        if (qrMatch) {
                            try { options = JSON.parse(qrMatch[1]); } catch (e) { }
                            displayContent = displayContent.replace(qrMatch[0], '').trim();
                        }

                        const cMatch = displayContent.match(/\[CONFIRM_READY:\s*({[\s\S]*?})\]/i);
                        if (cMatch) {
                            displayContent = displayContent.replace(cMatch[0], '').trim();
                        }

                        return {
                            id: m.id,
                            role: m.role,
                            content: displayContent,
                            rawContent: m.content,
                            timestamp: new Date(m.created_at),
                            options: options.length > 0 ? options : undefined
                        };
                    });
                    setMessages(formattedMessages);

                    const lastBotMessage = formattedMessages.filter(m => m.role === 'assistant').pop();
                    if (lastBotMessage && (lastBotMessage as any).rawContent) {
                        const confirmRegex = /\[CONFIRM_READY:\s*({[\s\S]*?})\]/i;
                        const confirmMatch = (lastBotMessage as any).rawContent.match(confirmRegex);
                        if (confirmMatch && confirmMatch[1]) {
                            try {
                                let jsonStr = confirmMatch[1].trim();
                                if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '');
                                if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '');
                                if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/```$/, '');
                                const confirmData = JSON.parse(jsonStr);
                                setConfirmationData(confirmData);
                            } catch (e) {
                                console.error('Error recovering confirmation data:', e);
                            }
                        }
                    }
                } else {
                    const userName = session?.user?.user_metadata?.full_name || 'Usuario';
                    setMessages([
                        {
                            id: generateUUID(),
                            role: 'assistant',
                            content: `¡Hola ${userName}! 👋 Bienvenido a Dedoctor. ¿En qué podemos ayudarte hoy?\n\n- Solicitar Transporte 🚌\n- Mantención de Silla o Ayuda Técnica 🔧`,
                            timestamp: new Date(),
                            options: ['Transporte 🚌', 'Mantención 🔧']
                        },
                    ]);
                }
            } catch (err) {
                console.error('Error loading history:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (activeTab === 'chat' && messages.length === 0) {
            loadHistory();
        }
    }, [session, activeTab, sessionId]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Supabase Log
        if (session?.user?.id) {
            supabase.from('messages').insert({
                role: 'user',
                content: userMessage.content,
                created_at: userMessage.timestamp.toISOString(),
                user_id: session.user.id,
                session_id: sessionId
            }).then(({ error }) => {
                if (error) console.error('Error logging user message:', error);
            });
        }

        try {
            const history = messages.slice(-15).map(m => ({ role: m.role, content: m.content }));
            const responseText = await getGeminiResponse(text, history);

            // Parsing Logic
            const quickRepliesMatch = responseText.match(/\[QUICK_REPLIES:\s*(\[.*?\])\s*\]/s);
            let cleanResponse = responseText;
            let messageOptions: string[] = [];

            if (quickRepliesMatch) {
                try {
                    messageOptions = JSON.parse(quickRepliesMatch[1]);
                    cleanResponse = cleanResponse.replace(quickRepliesMatch[0], '').trim();
                } catch (e) { console.error('Error parsing quick replies:', e); }
            }

            const confirmRegex = /\[CONFIRM_READY:\s*({[\s\S]*?})\]/i;
            const confirmMatch = cleanResponse.match(confirmRegex);

            if (confirmMatch && confirmMatch[1]) {
                try {
                    let jsonStr = confirmMatch[1].trim();
                    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '');
                    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '');
                    if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/```$/, '');

                    const confirmData = JSON.parse(jsonStr);
                    setConfirmationData(confirmData);
                    messageOptions = [];
                    cleanResponse = cleanResponse.replace(confirmMatch[0], '').trim();
                } catch (e) {
                    console.error('Failed to parse confirmation data JSON:', e);
                }
            }

            if (cleanResponse.includes('[REQUEST_LOCATION]')) {
                setShowLocationBtn(true);
                cleanResponse = cleanResponse.replace('[REQUEST_LOCATION]', '').trim();
            }

            const botMessage: Message = {
                id: generateUUID(),
                role: 'assistant',
                content: cleanResponse || (confirmMatch ? 'He preparado tu solicitud. Por favor confirma los detalles abajo: 👇' : 'Lo siento, no pude procesar tu solicitud.'),
                timestamp: new Date(),
                options: messageOptions.length > 0 ? messageOptions : undefined
            };

            setMessages((prev) => [...prev, botMessage]);

            if (session?.user?.id) {
                supabase.from('messages').insert({
                    role: 'assistant',
                    content: responseText,
                    created_at: new Date().toISOString(),
                    user_id: session.user.id,
                    session_id: sessionId
                }).then(({ error }) => { msgError: if (error) console.error('Error logging assistant message:', error); });
            }

        } catch (error) {
            console.error('Error getting response:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async (additionalData?: any) => {
        if (!confirmationData || !session) return;

        try {
            const finalData = { ...confirmationData.data, ...(additionalData || {}) };

            const { data: newRequest, error } = await supabase
                .from('service_requests')
                .insert({
                    session_id: sessionId,
                    user_id: session.user.id,
                    service_type: confirmationData.service_type,
                    status: 'pending',
                    collected_data: finalData
                })
                .select()
                .single();

            if (error) throw error;

            const allAttachmentIds = [...pendingAttachmentIds];
            if (additionalData?.attachment_id) allAttachmentIds.push(additionalData.attachment_id);
            if (additionalData?.attachment_ids && Array.isArray(additionalData.attachment_ids)) {
                allAttachmentIds.push(...additionalData.attachment_ids);
            }
            const uniqueAttachmentIds = Array.from(new Set(allAttachmentIds));

            if (uniqueAttachmentIds.length > 0) {
                await supabase
                    .from('request_attachments')
                    .update({ request_id: newRequest.id })
                    .in('id', uniqueAttachmentIds);
            }

            const successMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: '✅ ¡Solicitud recibida! Tu pedido ha sido enviado y está pendiente de confirmación por el administrador.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, successMessage]);
            setConfirmationData(null);
            setPendingAttachmentIds([]);
        } catch (error) {
            console.error('Error confirming request:', error);
            alert('Hubo un error al confirmar la solicitud. Por favor intenta nuevamente.');
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, fileInputRef: any) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        if (file.size > 10 * 1024 * 1024) {
            alert('El archivo es demasiado grande (Máx 10MB)');
            return;
        }

        if (!session?.user?.id) return;

        try {
            const result = await uploadAttachment(file, session.user.id, null);
            setPendingAttachmentIds(prev => [...prev, result.id]);
            const msgText = `📎 Archivo adjunto: ${file.name}`;
            sendMessage(msgText);
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Error al subir archivo: ${error.message}`);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Watchdog
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (isLoading) {
            timeout = setTimeout(() => {
                console.warn('Loading stuck for 15s, resetting...');
                setIsLoading(false);
            }, 15000);
        }
        return () => clearTimeout(timeout);
    }, [isLoading]);


    return {
        messages,
        input,
        setInput,
        isLoading,
        confirmationData,
        setConfirmationData,
        showLocationBtn,
        setShowLocationBtn,
        messagesEndRef,
        sendMessage,
        handleConfirm,
        createNewSession,
        handleFileSelect
    };
}
