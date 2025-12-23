import { useState, useRef, useEffect } from 'react';

interface UseVoiceInputProps {
    onInput: (text: string) => void;
    onSend: () => void;
}

export function useVoiceInput({ onInput, onSend }: UseVoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);


    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'es-ES';
            recognitionRef.current.interimResults = true;

            let autoSendTimeout: any = null;

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                if (autoSendTimeout) clearTimeout(autoSendTimeout);
            };

            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result) => result.transcript)
                    .join('');
                onInput(transcript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                // Simple auto-send logic: if we have input, wait 1.5s then send
                // This relies on the parent checking if input is valid
                autoSendTimeout = setTimeout(() => {
                    onSend();
                }, 1500);
            };
        }
    }, [onInput, onSend]);

    const toggleMic = () => {
        if (!recognitionRef.current) {
            alert('Tu navegador no soporta reconocimiento de voz.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            // Reset input should happen in parent before calling this if needed, 
            // but we can assume parent handles "start new recording" = "clear old input" logic if they want
            recognitionRef.current.start();
        }
    };

    return { isListening, toggleMic };
}
