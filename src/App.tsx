import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Send, Bot, User, Mic, MicOff, PlusCircle, MapPin, Paperclip, Loader, Home, MessageSquare, Users } from 'lucide-react';
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


import type { Session } from '@supabase/supabase-js';
import type { Message, ConfirmationData, Profile } from './types';


type TabType = 'home' | 'chat' | 'admin';

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
  const [isUploading, setIsUploading] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  // State for Quick Replies
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [showLogin, setShowLogin] = useState(false);

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

  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (data) setUserProfile(data);
  };

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
        if (error.status === 401 || error.message.includes('invalid_grant')) {
          console.warn('Session invalid, clearing data...');
          await supabase.auth.signOut();
          localStorage.clear();
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      if (session) {
        setSession(session);
        setIsCheckingSession(false);
      } else {
        setTimeout(() => setIsCheckingSession(false), 800);
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
    <div className="app-container">
      {/* Sidebar (Desktop Only) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo bg-white flex items-center justify-center p-1">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="sidebar-brand">DD Chatbot</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            onClick={() => setActiveTab('home')} 
            className={`sidebar-item ${activeTab === 'home' ? 'active' : ''}`}
          >
            <Home className="sidebar-icon" />
            <span>Inicio</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`sidebar-item ${activeTab === 'chat' ? 'active' : ''}`}
          >
            <MessageSquare className="sidebar-icon" />
            <span>Chat</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`sidebar-item ${activeTab === 'admin' ? 'active' : ''}`}
            >
              <Users className="sidebar-icon" />
              <span>Administración</span>
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="p-4 bg-slate-50/50 rounded-[24px] border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                {userProfile?.avatar_url || session.user.user_metadata?.avatar_url ? (
                  <img src={userProfile?.avatar_url || session.user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-sky-600">{(userProfile?.full_name || userName).charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate leading-tight group-hover:text-sky-600 transition-colors uppercase tracking-tight">{userName}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-widest">{userEmail}</p>
              </div>
            </div>
            
            <button 
              onClick={async () => {
                if(window.confirm('¿Cerrar sesión?')) {
                    localStorage.removeItem('dd_chatbot_test_session');
                    await supabase.auth.signOut();
                    setSession(null);
                    window.location.reload();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        {/* GLOBAL HEADER - (Visible Mobile / Optional Desktop) */}
        <div className="md:hidden h-14 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 z-40 sticky top-0 flex-none shadow-sm">
          
          {/* Left: Brand & New Chat */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm border border-slate-100 transform hover:scale-105 transition-transform">
               <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
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

          {/* Right: Avatar only on mobile header */}
          <div className="flex items-center gap-3">
            {session?.user && (
               <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden relative">
                  {userProfile?.avatar_url || session.user.user_metadata?.avatar_url ? (
                     <img src={userProfile?.avatar_url || session.user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-xs select-none">
                        {(userProfile?.full_name || userName).charAt(0).toUpperCase()}
                     </div>
                  )}
               </div>
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
              {/* Chat Tab Header */}
              <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-700 tracking-tight">Chat de Soporte</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">En línea</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if (window.confirm('¿Iniciar nueva conversación?')) {
                      createNewSession();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all text-xs font-black uppercase tracking-wider border border-slate-200 hover:border-sky-100"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Nueva</span>
                </button>
              </div>

              {/* Messages Area */}
              <div className="messages-area px-4 py-8 max-w-4xl mx-auto w-full">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-8 animate-fade-in`}
                  >
                    <div className={`flex max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-sky-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                        {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex flex-col">
                        <div className={`px-6 py-4 rounded-[24px] shadow-sm relative ${
                          msg.role === 'user' 
                          ? 'bg-sky-600 text-white rounded-br-none' 
                          : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                        }`}>
                          {msg.content.split('\n').map((line, i) => (
                            <p key={i} className="text-[15px] font-medium leading-relaxed leading-6">{line}</p>
                          ))}
                        </div>
                        <span className={`text-[10px] mt-1.5 font-bold uppercase tracking-widest px-1 ${msg.role === 'user' ? 'text-right text-slate-400' : 'text-left text-slate-400'}`}>
                          {msg.role === 'user' ? 'Tú' : 'Asistente'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-8 animate-fade-in">
                    <div className="flex max-w-[85%] md:max-w-[75%] items-end gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <Bot className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="bg-white border border-slate-100 px-6 py-4 rounded-[24px] rounded-bl-none shadow-sm">
                        <div className="flex gap-1.5">
                          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
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
              <div className="chat-input-area border-t border-slate-100 bg-white/80 backdrop-blur-xl">
                <div className="input-container py-4">
                  {/* QUICK REPLIES */}
                  {quickReplies.length > 0 && !confirmationData && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 px-1 no-scrollbar">
                      {quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickReply(reply)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-600 px-5 py-2.5 rounded-2xl whitespace-nowrap transition-all border border-sky-100/50 font-bold text-[11px] uppercase tracking-wider active:scale-95 shadow-sm"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* LOCATION REQUEST BUTTON */}
                  {showLocationBtn && !confirmationData && (
                    <div className="flex justify-center mb-4">
                      <button
                        onClick={handleLocation}
                        className="bg-white text-emerald-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/10 flex items-center gap-3 hover:bg-emerald-50 transition-all active:scale-95 border border-emerald-100 animate-bounce"
                      >
                        <MapPin className="w-5 h-5" />
                        Compartir Ubicación Actual (GPS)
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="input-form gap-3">
                    <div className="flex-1 relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition duration-500"></div>
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Escuchando..." : "Escribe tu mensaje aquí..."}
                        className="chat-input relative w-full bg-slate-50 border-slate-100 focus:bg-white focus:border-sky-300 transition-all rounded-2xl py-4 px-6 text-slate-700 font-medium placeholder:text-slate-400"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="chat-input-buttons flex items-center gap-2 flex-shrink-0">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={handleFileSelect}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isLoading}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-500 hover:bg-sky-50 hover:text-sky-600 border border-slate-100'}`}
                        title="Adjuntar"
                      >
                        {isUploading ? <Loader className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                      </button>

                      <button
                        type="button"
                        onClick={toggleMic}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-50 text-red-500 border border-red-100 animate-pulse' : 'bg-slate-50 text-slate-500 hover:bg-sky-50 hover:text-sky-600 border border-slate-100'}`}
                      >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>

                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${!input.trim() || isLoading ? 'bg-slate-100 text-slate-300' : 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 hover:bg-sky-700 hover:scale-105 active:scale-95'}`}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </div>
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
