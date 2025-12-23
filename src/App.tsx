import React, { useState, useEffect, useRef } from 'react';
import { getGeminiResponse } from './lib/gemini';
import { supabase } from './lib/supabase';
import { uploadAttachment } from './lib/storage';
import { generateUUID } from './lib/utils';
import { ConfirmationCard } from './components/ConfirmationCard';
import { Login } from './components/Login';
import { BottomNav } from './components/BottomNav';
import { AdminPanel } from './components/AdminPanel';
import { HomePanel } from './components/HomePanel';
import { LandingPage } from './components/LandingPage';


import { ProfilePanel } from './components/ProfilePanel';
import { HistoryPanel } from './components/HistoryPanel';
import { ServiceDetailPanel } from './components/ServiceDetailPanel';
import { ContactPanel } from './components/ContactPanel';

import type { Session } from '@supabase/supabase-js';
import type { Message, ConfirmationData, ServiceRequest } from './types';

type TabType = 'home' | 'chat' | 'admin' | 'history' | 'profile' | 'contact';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Quick Replies


  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetail, setShowDetail] = useState(false);

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

  useEffect(() => {
    setShowDetail(false);
  }, [activeTab]);

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

      // Check if we have a pending auth hash in the URL
      const hasAuthHash = window.location.hash && window.location.hash.includes('access_token');

      // In PKCE flow, getSession() handles the code exchange.
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        if (error.status === 401 || error.message.includes('invalid_grant')) {
          console.warn('Session invalid, clearing data...');
          await supabase.auth.signOut();
          localStorage.clear();
          window.history.replaceState(null, '', window.location.pathname);
          setIsCheckingSession(false);
        }
      }

      if (session) {
        setSession(session);
        setIsCheckingSession(false);
      } else if (!hasAuthHash) {
        // If no session and no hash, we are truly logged out
        setTimeout(() => setIsCheckingSession(false), 800);
      } else {
        // If hash exists but session is null, wait for onAuthStateChange to handle it
        console.log('Detected auth hash, waiting for Supabase processing...');
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
        setShowLogin(false); // Reset to show Landing Page instead of Login
        

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
    if (session && activeTab === 'chat' && messages.length === 0) {
      const userName = session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email?.split('@')[0] ||
        'Usuario';
      setMessages([
        {
          id: generateUUID(),
          role: 'assistant',
          content: `¡Hola ${userName}! 👋 Bienvenido a Arise. ¿En qué puedo ayudarte hoy?\n\nSolicitar 'Transporte' 🚌\nSolicitar 'Mantenimiento' 🔧`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [session, activeTab]);

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
      let messageOptions: string[] = [];

      if (quickRepliesMatch) {
        try {
          messageOptions = JSON.parse(quickRepliesMatch[1]);
          cleanResponse = cleanResponse.replace(quickRepliesMatch[0], '').trim();
        } catch (e) {
          console.error('Error parsing quick replies:', e);
        }
      }

      // 2. Check for Confirmation (Robust Regex Parsing)
      // Matches [CONFIRM_READY: { ... }] handling potential newlines, spaces, and markdown blocks
      const confirmRegex = /\[CONFIRM_READY:\s*({[\s\S]*?})\]/i;
      const confirmMatch = cleanResponse.match(confirmRegex);

      if (confirmMatch && confirmMatch[1]) {
        try {
          const jsonStr = confirmMatch[1];
          const confirmData = JSON.parse(jsonStr);
          setConfirmationData(confirmData);
          messageOptions = []; // Clear options if confirming
          
          // Remove the tag from the message to show the user only the text
          cleanResponse = cleanResponse.replace(confirmMatch[0], '').trim();
        } catch (e) {
          console.error('Failed to parse confirmation data JSON:', e);
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
        content: cleanResponse || (confirmMatch ? 'He preparado tu solicitud. Por favor confirma los detalles abajo: 👇' : 'Lo siento, no pude procesar tu solicitud.'),
        timestamp: new Date(),
        options: messageOptions.length > 0 ? messageOptions : undefined
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
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to handle Quick Reply click
  const handleQuickReply = (text: string) => {
    sendMessage(text);
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
      
      // Handle single attachment from legacy or simple uploads
      if (additionalData?.attachment_id) {
        allAttachmentIds.push(additionalData.attachment_id);
      }
      
      // Handle multiple attachments from the new ConfirmationCard
      if (additionalData?.attachment_ids && Array.isArray(additionalData.attachment_ids)) {
        allAttachmentIds.push(...additionalData.attachment_ids);
      }

      // Remove duplicates just in case
      const uniqueAttachmentIds = Array.from(new Set(allAttachmentIds));

      if (uniqueAttachmentIds.length > 0) {
        const { error: linkError } = await supabase
          .from('request_attachments')
          .update({ request_id: newRequest.id })
          .in('id', uniqueAttachmentIds);

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

  // Mostrar Landing Page o Login si no hay sesión
  if (!session) {
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  const userName = session.user.user_metadata?.full_name ||
    session.user.user_metadata?.name ||
    session.user.email?.split('@')[0] ||
    'Usuario';
  const userEmail = session.user.email || '';

  return (
    <div className="flex justify-center min-h-screen bg-background-light dark:bg-background-dark overflow-hidden font-body relative">
      {/* Ambient Background for PC */}
      <div className="hidden md:block absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow [animation-delay:2s]"></div>
      </div>

      {/* Mobile Frame Container */}
      <div className="w-full max-w-md md:max-w-2xl bg-white dark:bg-surface-dark shadow-2xl relative flex flex-col min-h-screen md:min-h-[90vh] md:my-auto md:rounded-[3rem] overflow-hidden border-x border-gray-100 dark:border-gray-800 z-10 transition-all duration-500">
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {activeTab === 'home' && (
            <div className="flex-1 overflow-y-auto pb-24 scroll-smooth no-scrollbar">
              <HomePanel 
                onServiceSelect={(type) => {
                  setActiveTab('chat');
                  const msg = type === 'transport' ? 'Necesito solicitar un transporte' : 'Necesito mantenimiento para mi silla';
                  sendMessage(msg);
                }}
                onGoToChat={() => setActiveTab('chat')}
                onViewDetail={(req) => {
                  setSelectedRequest(req);
                  setShowDetail(true);
                }}
                userName={userName}
                userId={session.user.id}
              />
            </div>
          )}

          {activeTab === 'home' && showDetail && selectedRequest && (
            <div className="flex-1 overflow-y-auto no-scrollbar h-full absolute inset-0 z-[60]">
               <ServiceDetailPanel 
                 request={selectedRequest}
                 onBack={() => setShowDetail(false)}
               />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col relative overflow-hidden h-full">
              {/* Chat Header */}
              <header className="px-6 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">smart_toy</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900 dark:text-white">Arise AI</h2>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                      <span className="text-[10px] text-primary font-black uppercase tracking-wider">Arise Active</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (window.confirm('¿Deseas ver tus historiales anteriores?')) {
                        setActiveTab('history');
                      }
                    }}
                    className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-gray-400">history</span>
                  </button>
                  <button 
                    onClick={() => window.confirm('¿Reiniciar chat actual?') && createNewSession()}
                    className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors border border-gray-100 dark:border-gray-800"
                  >
                    <span className="material-symbols-outlined text-primary">add_comment</span>
                  </button>
                </div>
              </header>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth no-scrollbar bg-slate-50/50 dark:bg-background-dark/50">
                <div className="flex flex-col gap-6 max-w-full">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-3.5 rounded-3xl text-sm font-medium leading-relaxed relative ${
                          msg.role === 'user' 
                          ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20' 
                          : 'bg-white dark:bg-surface-dark text-gray-800 dark:text-gray-100 rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-800'
                        }`}>
                          {msg.content.split('\n').map((line, i) => (
                            <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                          ))}
                        </div>

                        {/* Options / Quick Replies */}
                        {msg.role === 'assistant' && msg.options && msg.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleQuickReply(opt)}
                            className="mt-2 w-full text-left bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-xs font-bold text-primary shadow-sm active:scale-95 transition-all flex justify-between items-center"
                          >
                            {opt}
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </button>
                        ))}
                        
                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-1.5 px-1">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-white dark:bg-surface-dark px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5 border border-gray-100 dark:border-gray-800">
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Confirmation Card Logic Integrated */}
                {confirmationData && session && (
                  <div className="mt-8 mb-4">
                    <ConfirmationCard
                      serviceType={confirmationData.service_type}
                      data={confirmationData.data}
                      userId={session.user.id}
                      onConfirm={handleConfirm}
                      onEdit={handleEdit}
                    />
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
                {showLocationBtn && !confirmationData && (
                  <button
                    onClick={handleLocation}
                    className="w-full mb-3 bg-green-500 text-white rounded-2xl py-3 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 animate-bounce"
                  >
                    <span className="material-symbols-outlined text-lg">location_on</span>
                    Compartir Ubicación GPS
                  </button>
                )}
                
                <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                  <div className="flex-1 bg-gray-50 dark:bg-surface-dark rounded-[1.5rem] p-1 flex items-end border border-gray-100 dark:border-gray-800 transition-all focus-within:border-primary/50">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">attach_file</span>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                    </button>
                    
                    <textarea
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e as any);
                        }
                      }}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 px-2 max-h-32 resize-none text-gray-800 dark:text-gray-100"
                    />
                    
                    <button
                      type="button"
                      onClick={toggleMic}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isListening ? 'text-rose-500 animate-pulse' : 'text-gray-400'}`}
                    >
                      <span className="material-symbols-outlined">{isListening ? 'mic_off' : 'mic'}</span>
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${!input.trim() || isLoading ? 'bg-gray-100 text-gray-300 dark:bg-gray-800' : 'bg-primary text-white shadow-lg shadow-primary/30 active:scale-95'}`}
                  >
                    <span className="material-symbols-outlined filled">send</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="flex-1 overflow-y-auto pb-24 scroll-smooth no-scrollbar">
              <ProfilePanel 
                userName={userName}
                userEmail={userEmail}
                onLogout={async () => {
                  await supabase.auth.signOut();
                  localStorage.removeItem('dd_chatbot_test_session');
                  setSession(null);
                }}
              />
            </div>
          )}

          {activeTab === 'history' && !showDetail && (
            <div className="flex-1 overflow-y-auto pb-24 scroll-smooth no-scrollbar">
              <HistoryPanel 
                onViewDetail={(req) => {
                  setSelectedRequest(req);
                  setShowDetail(true);
                }}
              />
            </div>
          )}

          {activeTab === 'history' && showDetail && selectedRequest && (
            <div className="flex-1 overflow-y-auto no-scrollbar h-full absolute inset-0 z-[60]">
               <ServiceDetailPanel 
                 request={selectedRequest}
                 onBack={() => setShowDetail(false)}
               />
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="flex-1 overflow-y-auto pb-24 scroll-smooth no-scrollbar">
              <ContactPanel />
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
              <AdminPanel />
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isAdmin={isAdmin}
          onNewChat={createNewSession}
        />

        {/* Floating Logout for Mobile (Cleanly placed) */}
        {!session && (
          <div className="fixed top-6 right-6 z-[60]">
             {/* Not needed if handled by LandingPage */}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
