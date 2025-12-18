import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Send, Bot, User, Sparkles, Mic, MicOff, PlusCircle, MapPin, Paperclip, Loader } from 'lucide-react';
import { getGeminiResponse } from './lib/gemini';
import { supabase } from './lib/supabase';
import { uploadAttachment } from './lib/storage';
import { generateUUID } from './lib/utils';
import { ConfirmationCard } from './components/ConfirmationCard';
import { Login } from './components/Login';
import { BottomNav } from './components/BottomNav';
import { AdminPanel } from './components/AdminPanel';
import { HomePanel } from './components/HomePanel';


import type { Session } from '@supabase/supabase-js';
import type { Message, ConfirmationData } from './types';


type TabType = 'home' | 'chat' | 'admin';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  // State for Quick Replies
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);

  // Session ID management for individual chats
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem('dd_current_session_id');
    return saved || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });

  const [pendingAttachmentIds, setPendingAttachmentIds] = useState<string[]>([]);

  // Persist session ID
  useEffect(() => {
    localStorage.setItem('dd_current_session_id', sessionId);
  }, [sessionId]);

  const createNewSession = () => {
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newId);
    setMessages([]);
    setConfirmationData(null);
    return newId;
  };

  // Determinar si el usuario es admin (basado en email)
  const isAdmin = session?.user?.email === 'dedoctor.transportes@gmail.com';

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    // Check for test session first
    const testSessionStr = localStorage.getItem('dd_chatbot_test_session');
    if (testSessionStr) {
      try {
        setSession(JSON.parse(testSessionStr));
        setIsCheckingSession(false);
        return; // Skip Supabase check
      } catch (e) {
        console.error('Invalid test session', e);
        localStorage.removeItem('dd_chatbot_test_session');
      }
    }

    // Check active session logic
    const handleSessionCheck = async () => {
      // DEBUG: Verify Env Vars
      console.log('--- ENTORNO DEPURACIÓN ---');
      console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      console.log('KEY (Primeros 10 chars):', key ? key.substring(0, 10) + '...' : 'NO DEFINIDA');
      console.log('--------------------------');

      // In PKCE flow, getSession() handles the code exchange.
      // We must call it even if we see a code/token in the URL.

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        // If token/code is invalid (401), or any other error during exchange
        if (error.status === 401 || error.message.includes('invalid_grant')) {
          console.warn('Session invalid, clearing data...');
          await supabase.auth.signOut();
          localStorage.clear();
          // Clean URL to avoid infinite loops
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      if (session) {
        setSession(session);
        // If we have a session, we can clear the loading state immediately
        setIsCheckingSession(false);
      } else {
        // If no session yet, we might still be waiting for onAuthStateChange event
        // specifically if the auto-refresh or initial load is slightly delayed.
        // However, we shouldn't wait forever.
        setTimeout(() => setIsCheckingSession(false), 2000);
      }
    };

    handleSessionCheck();

    // Listen for auth changes (Login, Logout, OAuth finish)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth Event:', _event);
      setSession(session);

      // Stop loading state on any auth event
      setIsCheckingSession(false);

      // Successfully signed in
      if (session && _event === 'SIGNED_IN') {
        // No borramos mensajes aquí para permitir que loadHistory los restaure sin parpadeo si es la misma sesión
        setActiveTab('home'); // Send to Home Dashboard first
        // Clean URL
        window.history.replaceState(null, '', window.location.pathname);
      }

      // Signed out
      if (!session && _event === 'SIGNED_OUT') {
        setMessages([]);
        setConfirmationData(null);
        setActiveTab('home');

        // CRITICAL: If we are signed out but still have an auth hash, it means the auth failed (stale/invalid).
        // We MUST clear the hash so the Login component doesn't get stuck in "Loading..."
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.warn('Authentication failed (stale token), clearing hash...');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Watchdog: Reset isLoading if it gets stuck for more than 25 seconds
  useEffect(() => {
    let timeout: any;
    if (isLoading) {
      timeout = setTimeout(() => {
        console.warn('Loading stuck for 15s, resetting...');
        setIsLoading(false);
      }, 15000);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Voice Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.interimResults = true;

      // Ref for auto-send timeout
      const autoSendTimeoutRef: { current: any } = { current: null };

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        if (autoSendTimeoutRef.current) clearTimeout(autoSendTimeoutRef.current);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Auto-send after silence/end of speech
        if (inputRef.current.trim()) {
          autoSendTimeoutRef.current = setTimeout(() => {
            // Check if we already sent or if input was cleared
            if (inputRef.current.trim()) {
              sendMessage(inputRef.current);
            }
          }, 1500); // 1.5s delay to allow reading/breath
        }
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  // Load persistent history for CURRENT SESSION ONLY
  useEffect(() => {
    if (session && activeTab === 'chat') {
      const loadHistory = async () => {
        // Obtenemos los últimos 50 mensajes de este usuario (orden cronológico)
        const { data: history, error } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', session.user.id)
          // .eq('session_id', sessionId) // Mostramos historial completo para mejor experiencia
          .order('created_at', { ascending: false }) // Traemos los más recientes primero
          .limit(100);

        if (error) {
          console.error('Error loading history:', error);
          return;
        }

        if (history && history.length > 0) {
          // Supabase los devuelve "más recientes primero" por el orden, así que invertimos para mostrar cronológicamente
          const sortedHistory = history.reverse().map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          }));
          setMessages(sortedHistory);
          // Opcional: Agregar una pequeña marca visual de "Historial cargado"
        } else {
          // Si es una sesión nueva, saludo
          if (messages.length === 0) {
            const userName = session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'Usuario';
            setMessages([
              {
                id: '1',
                role: 'assistant',
                content: `¡Hola ${userName}! 👋 Soy DD Chatbot. ¿Necesitas solicitar 'Transporte' 🚌 o 'Mantenimiento' 🔧?`,
                timestamp: new Date(),
              },
            ]);
          }
        }
      };

      loadHistory();
    }
  }, [session, activeTab, sessionId]); // Add sessionId dep

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta reconocimiento de voz.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput('');
      recognitionRef.current.start();
    }
  };

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

    // Log to Supabase (Always log)
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

      // 1. Check for Quick Replies (Regex is usually safe for arrays, but let's make it robust)
      const quickRepliesMatch = responseText.match(/\[QUICK_REPLIES:\s*(\[.*?\])\s*\]/s);
      let cleanResponse = responseText;

      if (quickRepliesMatch) {
        try {
          const options = JSON.parse(quickRepliesMatch[1]);
          setQuickReplies(options);
          cleanResponse = cleanResponse.replace(quickRepliesMatch[0], '').trim();
        } catch (e) {
          console.error('Error parsing quick replies:', e);
        }
      } else {
        setQuickReplies([]);
      }

      // 2. Check for Confirmation (Robust Parsing for Nested JSON)
      const confirmMarker = '[CONFIRM_READY:';
      const confirmIndex = cleanResponse.indexOf(confirmMarker);

      if (confirmIndex !== -1) {
        // Find the start of the JSON object
        const jsonStart = cleanResponse.indexOf('{', confirmIndex);
        if (jsonStart !== -1) {
          let braceCount = 0;
          let jsonEnd = -1;

          // Iterate to find the matching closing brace
          for (let i = jsonStart; i < cleanResponse.length; i++) {
            if (cleanResponse[i] === '{') braceCount++;
            else if (cleanResponse[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                jsonEnd = i + 1; // Include the closing brace
                break;
              }
            }
          }

          if (jsonEnd !== -1) {
            const jsonStr = cleanResponse.substring(jsonStart, jsonEnd);
            try {
              const confirmData = JSON.parse(jsonStr);
              setConfirmationData(confirmData);

              // Remove the entire block from [CONFIRM_READY: ... ]
              // We need to find the closing ']' of the tag, which should be after jsonEnd
              const tagEnd = cleanResponse.indexOf(']', jsonEnd);
              if (tagEnd !== -1) {
                cleanResponse = (cleanResponse.substring(0, confirmIndex) + cleanResponse.substring(tagEnd + 1)).trim();
              } else {
                // Fallback: just remove up to jsonEnd
                cleanResponse = (cleanResponse.substring(0, confirmIndex) + cleanResponse.substring(jsonEnd)).trim();
              }

              setQuickReplies([]); // Clear quick replies if confirming
            } catch (e) {
              console.error('Failed to parse confirmation data JSON:', e);
            }
          }
        }
      }

      // 3. Check for Location Request
      if (cleanResponse.includes('[REQUEST_LOCATION]')) {
        setShowLocationBtn(true);
        cleanResponse = cleanResponse.replace('[REQUEST_LOCATION]', '').trim();
      }

      const botMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: cleanResponse || (confirmIndex !== -1 ? 'He preparado tu solicitud. Por favor confirma los detalles abajo: 👇' : 'Lo siento, no pude procesar tu solicitud.'),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Log assistant message (Always log, as IDs are now valid UUIDs)
      if (session?.user?.id) {
        supabase.from('messages').insert({
          role: 'assistant',
          content: cleanResponse,
          created_at: new Date().toISOString(),
          user_id: session.user.id,
          session_id: sessionId
        }).then(({ error }) => {
          if (error) console.error('Error logging assistant message:', error);
        });
      }

    } catch (error) {
      console.error('Error getting response:', error);
      setQuickReplies([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to handle Quick Reply click
  const handleQuickReply = (text: string) => {
    sendMessage(text);
    setQuickReplies([]);
  };

  const handleConfirm = async (additionalData?: any) => {
    if (!confirmationData || !session) return;

    try {
      // Merge confirmation data with any additional data (e.g. image_url)
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

      // Link any pending attachments to this new request
      const allAttachmentIds = [...pendingAttachmentIds];
      if (additionalData?.attachment_id) {
        allAttachmentIds.push(additionalData.attachment_id);
      }

      if (allAttachmentIds.length > 0) {
        const { error: linkError } = await supabase
          .from('request_attachments')
          .update({ request_id: newRequest.id })
          .in('id', allAttachmentIds);

        if (linkError) console.error('Error linking attachments:', linkError);
      }


      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '✅ ¡Solicitud recibida! Tu pedido ha sido enviado y está pendiente de confirmación por el administrador.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMessage]);
      setConfirmationData(null);
      setPendingAttachmentIds([]); // Clear after linking
    } catch (error) {
      console.error('Error confirming request:', error);
      alert('Hubo un error al confirmar la solicitud. Por favor intenta nuevamente.');
    }
  };

  const [showLocationBtn, setShowLocationBtn] = useState(false);

  // ... (existing code)

  const handleEdit = () => {
    setConfirmationData(null);
    setShowLocationBtn(false);
    const editMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '¿Qué información deseas modificar?',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, editMessage]);
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const locationMsg = `📍 Mi ubicación actual: ${link}`;
        sendMessage(locationMsg);
        setShowLocationBtn(false); // Hide after sending
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('No se pudo obtener la ubicación. Por favor verifica tus permisos.');
        setIsLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowLocationBtn(false); // Hide if user types manually instead
    sendMessage(input);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande (Máx 10MB)');
      return;
    }

    if (!session?.user?.id) return;

    setIsUploading(true);
    try {
      // Upload to Supabase Storage and DB
      const result = await uploadAttachment(file, session.user.id, null);
      
      // Save ID to link it later to a request
      setPendingAttachmentIds(prev => [...prev, result.id]);

      // Notify in chat
      const msgText = `📎 Archivo adjunto: ${file.name}`;
      sendMessage(msgText);
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Error al subir archivo: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Mostrar loading mientras se verifica la sesión
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Verificando sesión...</p>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.hash = '';
              window.location.reload();
            }}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            ¿Problemas? Borrar caché y recargar
          </button>
        </div>
      </div>
    );
  }

  // Mostrar Login si no hay sesión
  if (!session) {
    return <Login />;
  }

  const userName = session.user.user_metadata?.full_name ||
    session.user.user_metadata?.name ||
    session.user.email?.split('@')[0] ||
    'Usuario';
  const userEmail = session.user.email || '';

  return (
    <div className="app-container">
      <div className="main-content">
        {/* Header - Visible only in Chat */}
        {/* GLOBAL HEADER - Narrow & Sleek (Always Visible) */}
        <div className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 z-40 sticky top-0 flex-none shadow-sm">
          
          {/* Left: Brand & New Chat */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sky-500/20 shadow-md transform hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
               <h1 className="text-sm font-black text-slate-700 tracking-tight">DD Chatbot</h1>
               
               {/* New Chat Button */}
               <button
                  onClick={() => {
                    if (window.confirm('¿Iniciar nueva conversación?')) {
                      createNewSession();
                    }
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-400 hover:text-sky-500 border border-slate-200 hover:border-sky-200 transition-all ml-1"
                  title="Nueva Conversación"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
               </button>
            </div>
          </div>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-3">
            {session?.user && (
              <>
                 {/* User Info (Hidden on very small screens) */}
                 <div className="hidden sm:flex flex-col items-end mr-1">
                    <span className="text-xs font-bold text-slate-700">{userName.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]">{userEmail}</span>
                 </div>
                 
                 {/* Avatar */}
                 <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden relative">
                    {session.user.user_metadata?.avatar_url ? (
                       <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-xs select-none">
                          {userName.charAt(0).toUpperCase()}
                       </div>
                    )}
                 </div>

                 {/* Divider */}
                 <div className="h-4 w-px bg-slate-200 mx-1"></div>

                 {/* Logout Button - Consistent Location */}
                 <button
                    onClick={async () => {
                      if(window.confirm('¿Cerrar sesión?')) {
                          localStorage.removeItem('dd_chatbot_test_session');
                          await supabase.auth.signOut();
                          setSession(null);
                          window.location.reload();
                      }
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Cerrar sesión"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                 </button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto relative bg-slate-50 w-full scroll-smooth">


          {activeTab === 'home' && (
            <HomePanel
              onServiceSelect={(type) => {
                // START NEW CHAT SESSION
                createNewSession();

                const prompt = type === 'transport' ? 'Quiero solicitar transporte' : 'Necesito mantenimiento para mi silla';
                setInput(prompt);
                setActiveTab('chat');
              }}
              onGoToChat={() => setActiveTab('chat')}
              userName={userName}
              userEmail={userEmail}
              userId={session.user.id}
            />
          )}

          {activeTab === 'chat' && (
            <div className="chat-tab">
              {/* Messages Area */}
              <div className="messages-area">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-row ${msg.role === 'user' ? 'user' : 'assistant'}`}
                  >
                    <div className={`avatar ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                      {msg.role === 'user' ? (
                        <User className="icon-sm text-white" />
                      ) : (
                        <Bot className="icon-sm text-white" />
                      )}
                    </div>
                    <div className={`message-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} style={{ margin: i > 0 ? '0.5rem 0 0 0' : 0 }}>{line}</p>
                      ))}
                      <span className={`message-time ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message-row assistant">
                    <div className="avatar assistant">
                      <Bot className="icon-sm text-white" />
                    </div>
                    <div className="typing-content">
                      <div className="typing-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Confirmation Card */}
              {confirmationData && session && (
                <ConfirmationCard
                  serviceType={confirmationData.service_type}
                  data={confirmationData.data}
                  userId={session.user.id}
                  onConfirm={handleConfirm}
                  onEdit={handleEdit}
                />
              )}

              {/* Input Area - Fijo en la parte inferior */}
              <div className="chat-input-area">

                {/* QUICK REPLIES */}
                {quickReplies.length > 0 && !confirmationData && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2 px-1">
                    {quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 text-base px-6 py-3 rounded-full whitespace-nowrap transition-colors border border-blue-500/30 font-medium active:scale-95 duration-200"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* LOCATION REQUEST BUTTON */}
                {showLocationBtn && !confirmationData && (
                  <div className="flex justify-center mb-3 animate-bounce">
                    <button
                      onClick={handleLocation}
                      className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-green-500/30 flex items-center gap-2 hover:bg-green-500 transition-colors active:scale-95"
                    >
                      <MapPin className="w-5 h-5" />
                      Compartir Ubicación Actual (GPS)
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="input-form">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isListening ? "Escuchando..." : "Escribe tu mensaje aquí..."}
                      className="chat-input pr-10 text-lg py-3"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="chat-input-buttons flex items-center gap-2 ml-1 flex-shrink-0">

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                    />

                    {/* Clip / Attachment Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isLoading}
                      className={`p-3.5 rounded-full transition-all duration-200 ${isUploading ? 'bg-gray-700/50 cursor-wait' : 'bg-gray-700/50 text-gray-300 hover:bg-blue-600/20 hover:text-blue-400'}`}
                      title="Adjuntar archivo o foto"
                    >
                      {isUploading ? <Loader className="w-6 h-6 animate-spin" /> : <Paperclip className="w-6 h-6" />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMic}
                      className={`p-3.5 rounded-full transition-all duration-200 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-gray-700/50 text-gray-300 hover:bg-blue-600/20 hover:text-blue-400'}`}
                      title="Dictar voz"
                    >
                      {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className={`btn-send-chat p-3.5 rounded-full transition-all duration-200 ${!input.trim() || isLoading ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500'}`}
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <AdminPanel />
          )}
        </div>
        
        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
             if (tab === 'admin' && activeTab === 'admin') {
                setIsAdminMenuOpen(!isAdminMenuOpen);
             } else {
                setActiveTab(tab);
                setIsAdminMenuOpen(false);
             }
          }}
          isAdmin={isAdmin}
        />
      </div>
      
    </div>
  );
}

export default App;
