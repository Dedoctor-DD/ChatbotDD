import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Send, Bot, User, Sparkles, Mic, MicOff, PlusCircle, MapPin } from 'lucide-react';
import { getGeminiResponse } from './lib/gemini';
import { supabase } from './lib/supabase';
import { ConfirmationCard } from './components/ConfirmationCard';
import { Login } from './components/Login';
import { BottomNav } from './components/BottomNav';
import { AdminPanel } from './components/AdminPanel';
import { HomePanel } from './components/HomePanel';


interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConfirmationData {
  service_type: 'transport' | 'workshop';
  data: Record<string, any>;
}

type TabType = 'home' | 'chat' | 'admin';

function App() {
  const [session, setSession] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // State for Quick Replies
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);

  // Session ID management for individual chats
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem('dd_current_session_id');
    return saved || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });

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
  const isAdmin = session?.user?.email === 'dedoctor.transportes@gmail.com' ||
    session?.user?.user_metadata?.role === 'admin';

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
        setMessages([]);
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

  // Voice Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
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
          setTimeout(() => {
            sendMessage(inputRef.current);
            setInput(''); // Clear input after sending
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
          .eq('session_id', sessionId) // Only load active session
          .order('created_at', { ascending: false }) // Traemos los más recientes primero
          .limit(50);

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

    // Log to Supabase (ONLY if not guest or test admin)
    if (!session.user.id.startsWith('guest-') && !session.user.id.startsWith('admin-')) {
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

      // 1. Check for Quick Replies
      const quickRepliesMatch = responseText.match(/\[QUICK_REPLIES:\s*(\[.*?\])\s*\]/s);
      let cleanResponse = responseText;

      if (quickRepliesMatch) {
        try {
          const options = JSON.parse(quickRepliesMatch[1]);
          setQuickReplies(options);
          cleanResponse = cleanResponse.replace(/\[QUICK_REPLIES:\s*\[.*?\]\s*\]/s, '').trim();
        } catch (e) {
          console.error('Error parsing quick replies:', e);
        }
      } else {
        setQuickReplies([]);
      }

      // 2. Check for Confirmation
      const confirmMatch = cleanResponse.match(/\[CONFIRM_READY:\s*({.*?})\s*\]/s);

      if (confirmMatch) {
        try {
          const confirmData = JSON.parse(confirmMatch[1]);
          setConfirmationData(confirmData);
          cleanResponse = cleanResponse.replace(/\[CONFIRM_READY:\s*{.*?}\s*\]/s, '').trim();
          setQuickReplies([]);
        } catch (e) {
          console.error('Failed to parse confirmation data:', e);
        }
      }

      // 3. Check for Location Request
      if (cleanResponse.includes('[REQUEST_LOCATION]')) {
        setShowLocationBtn(true);
        cleanResponse = cleanResponse.replace('[REQUEST_LOCATION]', '').trim();
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanResponse || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Log assistant message (ONLY if not guest or test admin)
      if (!session.user.id.startsWith('guest-') && !session.user.id.startsWith('admin-')) {
        supabase.from('messages').insert({
          role: 'assistant',
          content: cleanResponse,
          created_at: new Date().toISOString(),
          user_id: session.user.id,
          session_id: sessionId
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
    if (!confirmationData) return;

    try {
      // Merge confirmation data with any additional data (e.g. image_url)
      const finalData = { ...confirmationData.data, ...(additionalData || {}) };

      const { error } = await supabase.from('service_requests').insert({
        session_id: sessionId,
        user_id: session.user.id,
        service_type: confirmationData.service_type,
        status: 'pending', // Change to pending
        collected_data: finalData
      });

      if (error) throw error;

      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '✅ ¡Solicitud recibida! Tu pedido ha sido enviado y está pendiente de confirmación por el administrador.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMessage]);
      setConfirmationData(null);
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
        {/* Header - Visible */}
        <div className="top-header">
          <div className="header-branding">
            <div className="logo-container">
              <Sparkles className="icon-md text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="app-title">DD Chatbot</h1>
                {/* NEW CHAT BUTTON */}
                <button
                  onClick={() => {
                    if (window.confirm('¿Iniciar nueva conversación?')) {
                      createNewSession();
                    }
                  }}
                  className="text-white/80 hover:text-white"
                  title="Nueva Conversación"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>
              <p className="status-indicator">
                <span className="status-dot"></span>
                En línea
              </p>
            </div>
          </div>
          <div className="header-user">
            {session?.user && (
              <div className="user-info">
                {session.user.user_metadata?.avatar_url && (
                  <img
                    src={session.user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="user-avatar"
                  />
                )}
                <div className="user-details">
                  <p className="user-name">{userName}</p>
                  <p className="user-email">{userEmail}</p>
                </div>
                <button
                  onClick={async () => {
                    localStorage.removeItem('dd_chatbot_test_session'); // Clear test session if any
                    await supabase.auth.signOut();
                    setSession(null); // Force update state
                    window.location.reload();
                  }}
                  className="logout-btn"
                  title="Cerrar sesión"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  <span className="logout-text">Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">


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
              {confirmationData && (
                <ConfirmationCard
                  serviceType={confirmationData.service_type}
                  data={confirmationData.data}
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

                  {/* Action Buttons Group */}
                  <div className="flex items-center gap-2 ml-1">

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
                      className={`p-3.5 rounded-full transition-all duration-200 ${!input.trim() || isLoading ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500'}`}
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
      </div>

      {/* Bottom Navigation - Fijo en móvil */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default App;
