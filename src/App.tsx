import React, { useState, useEffect, useRef } from 'react';
import { ConfirmationCard } from './components/ConfirmationCard';
import { Login } from './components/Login';
import { HomePanel } from './components/HomePanel';
import { LandingPage } from './components/LandingPage';
import { ServiceDetailPanel } from './components/ServiceDetailPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { AdminPanel } from './components/AdminPanel';

import type { ServiceRequest } from './types';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { useVoiceInput } from './hooks/useVoiceInput';

type TabType = 'home' | 'chat' | 'admin' | 'history' | 'profile' | 'contact';

function App() {
  const { session, isCheckingSession, userName, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Chat Hook
  const {
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
  } = useChat(session, activeTab);

  // Ref for input to handle the "auto send after voice" properly
  const inputRef = useRef(input);
  useEffect(() => { inputRef.current = input; }, [input]);

  // Voice Hook
  const { isListening, toggleMic } = useVoiceInput({
      onInput: (text) => setInput(text),
      onSend: () => {
          if (inputRef.current.trim()) {
              sendMessage(inputRef.current);
          }
      }
  });


  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset detail view when tab changes
  useEffect(() => {
    setShowDetail(false);
  }, [activeTab]);

  // Theme Management - FORCED LIGHT MODE
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('dd_theme', 'light');
  }, []);

  const handleLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    // Since we don't expose setIsLoading from useChat for general use, we might need to?
    // Actually we do expose it.

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const locationMsg = `📍 Mi ubicación actual: ${link}`;
        sendMessage(locationMsg);
        setShowLocationBtn(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('No se pudo obtener la ubicación. Por favor verifica tus permisos.');
      }
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setShowLocationBtn(false);
      sendMessage(input);
  };

  const handleEdit = () => {
    setConfirmationData(null);
    setShowLocationBtn(false);
    sendMessage("Quiero modificar la información");
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  return (
    <div className="flex justify-center min-h-screen bg-white font-body relative">
       {/* Ambient Background */}
      <div className="hidden md:block absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow [animation-delay:2s]"></div>
      </div>

      <div className="w-full max-w-md md:max-w-2xl bg-white shadow-2xl relative flex flex-col h-[100dvh] md:h-[90vh] md:my-auto md:rounded-[3rem] overflow-hidden border-x border-gray-100 z-10 transition-all duration-500">
        
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {activeTab === 'home' && (
            <div className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
              <HomePanel 
                onServiceSelect={(type) => {
                  setActiveTab('chat');
                  const msg = type === 'transport' ? 'Necesito solicitar un transporte' : 'Necesito mantención para un equipo o ayuda técnica';
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

          {activeTab === 'history' && (
             <div className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
               <HistoryPanel 
                 onViewDetail={(req) => {
                   setSelectedRequest(req);
                   setShowDetail(true);
                 }} 
               />
             </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
              <AdminPanel />
            </div>
          )}

          {(activeTab === 'home' || activeTab === 'history') && showDetail && selectedRequest && (
            <div className="flex-1 overflow-y-auto no-scrollbar h-full absolute inset-0 z-[60]">
               <ServiceDetailPanel 
                 request={selectedRequest}
                 onBack={() => setShowDetail(false)}
               />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col relative overflow-hidden h-full">
              {/* Header */}
              <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">smart_toy</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900">Arise AI</h2>
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
                    className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-gray-400">history</span>
                  </button>
                  <button 
                    onClick={() => window.confirm('¿Reiniciar chat actual?') && createNewSession()}
                    className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors border border-gray-100"
                  >
                    <span className="material-symbols-outlined text-primary">add_comment</span>
                  </button>
                </div>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth no-scrollbar bg-slate-50/50">
                <div className="flex flex-col gap-8 max-w-full">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className={`flex flex-col max-w-[88%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-6 py-4 rounded-3xl text-sm font-medium leading-relaxed relative ${
                          msg.role === 'user' 
                          ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-tr-none shadow-xl shadow-primary/25' 
                          : 'bg-white text-slate-800 rounded-tl-none shadow-2xl shadow-slate-200/50 border border-slate-50'
                        }`}>
                          {msg.content.split('\n').map((line, i) => (
                            <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                          ))}
                        </div>

                        {msg.role === 'assistant' && msg.options && (
                          <div className="mt-4 flex flex-col gap-3 w-full animate-slide-up">
                            {msg.options.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => sendMessage(opt)}
                                className="w-full text-left bg-white border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black text-primary uppercase tracking-widest shadow-xl shadow-slate-200/40 active:scale-95 hover:bg-slate-50 transition-all flex justify-between items-center group"
                              >
                                {opt}
                                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2 px-2">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-white px-6 py-4 rounded-3xl rounded-tl-none shadow-2xl shadow-slate-200/40 flex gap-2 border border-slate-50">
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {confirmationData && (
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
                <div className="h-4" />
              </div>

              {/* Input */}
              <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100">
                {showLocationBtn && !confirmationData && (
                  <button
                    onClick={handleLocation}
                    className="w-full mb-3 bg-green-500 text-white rounded-2xl py-3 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 animate-bounce"
                  >
                    <span className="material-symbols-outlined text-lg">location_on</span>
                    Compartir Ubicación GPS
                  </button>
                )}
                
                <form onSubmit={handleFormSubmit} className="flex gap-2 items-end">
                  <div className="flex-1 bg-gray-50 rounded-[1.5rem] p-1 flex items-end border border-gray-100 transition-all focus-within:border-primary/50">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">attach_file</span>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileSelect(e, fileInputRef)} />
                    </button>
                    
                    <textarea
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleFormSubmit(e);
                        }
                      }}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 bg-transparent border-none focus:ring-0 p-2.5 text-sm text-gray-700 placeholder-gray-400 resize-none font-medium max-h-32"
                    />
                    
                    <button
                        type="button"
                        onClick={toggleMic}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isListening 
                          ? 'bg-red-500 text-white shadow-lg animate-pulse' 
                          : 'text-gray-400 hover:text-primary'
                        }`}
                      >
                         <span className="material-symbols-outlined">{isListening ? 'mic_off' : 'mic'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-12 h-12 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>

        <nav className="bg-white border-t border-gray-100 py-2 px-6 flex justify-between items-center z-30">
             <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === 'home' ? 'text-primary bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
                <span className={`material-symbols-outlined ${activeTab === 'home' ? 'filled' : ''}`}>home</span>
                <span className="text-[9px] font-black uppercase tracking-wider">Inicio</span>
             </button>
             <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === 'chat' ? 'text-primary bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
                <span className={`material-symbols-outlined ${activeTab === 'chat' ? 'filled' : ''}`}>chat_bubble</span>
                <span className="text-[9px] font-black uppercase tracking-wider">Chat</span>
             </button>
             {isAdmin && (
               <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === 'admin' ? 'text-primary bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
                  <span className={`material-symbols-outlined ${activeTab === 'admin' ? 'filled' : ''}`}>admin_panel_settings</span>
                  <span className="text-[9px] font-black uppercase tracking-wider">Admin</span>
               </button>
             )}
        </nav>
      </div>
    </div>
  );
}

export default App;
