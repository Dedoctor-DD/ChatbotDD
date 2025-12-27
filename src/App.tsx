import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
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

  // Reset detail view and scroll when tab changes
  useEffect(() => {
    setShowDetail(false);
    window.scrollTo(0, 0);
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
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
        <div className="fixed inset-0 bg-white font-body flex flex-col md:flex-row overflow-hidden z-10">
           {/* Ambient Background */}
          <div className="hidden md:block absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow [animation-delay:2s]"></div>
          </div>
    
            
            {/* DESKTOP SIDEBAR - Obsidian Hub */}
            <nav className="hidden md:flex flex-col w-72 bg-white border-r border-slate-100/50 py-10 px-6 justify-between z-30 relative overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-slate-900/10 to-transparent"></div>
                
                <div className="flex flex-col gap-12 relative z-10">
                    {/* Brand Section */}
                    <div className="flex items-center gap-3 px-2">
                        <div className="size-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/20">
                            <span className="material-symbols-outlined text-white text-xl filled">smart_toy</span>
                        </div>
                        <div>
                            <h1 className="font-black text-[13px] uppercase tracking-[0.3em] leading-none text-slate-900 mb-1">
                                Dedoctor
                            </h1>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{isAdmin ? 'Control Center' : 'Nexus'}</p>
                        </div>
                    </div>
    
                    {/* Primary Navigation */}
                    <div className="flex flex-col gap-1.5">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] px-4 mb-3">Principal</p>
                        
                        <button 
                          onClick={() => setActiveTab('home')} 
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                            activeTab === 'home' 
                            ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' 
                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`material-symbols-outlined text-xl ${activeTab === 'home' ? 'filled' : ''}`}>grid_view</span>
                                <span className="text-[11px] font-black uppercase tracking-[0.15em]">Dashboard</span>
                            </div>
                            {activeTab === 'home' && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>}
                        </button>

                        <button 
                          onClick={() => setActiveTab('chat')} 
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                            activeTab === 'chat' 
                            ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' 
                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`material-symbols-outlined text-xl ${activeTab === 'chat' ? 'filled' : ''}`}>bolt</span>
                                <span className="text-[11px] font-black uppercase tracking-[0.15em]">Chat AI</span>
                            </div>
                            {activeTab === 'chat' && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>}
                        </button>

                        <button 
                          onClick={() => setActiveTab('history')} 
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                            activeTab === 'history' 
                            ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' 
                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`material-symbols-outlined text-xl ${activeTab === 'history' ? 'filled' : ''}`}>history_edu</span>
                                <span className="text-[11px] font-black uppercase tracking-[0.15em]">Historial</span>
                            </div>
                        </button>

                        {isAdmin && (
                            <div className="mt-8">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] px-4 mb-3">Gestión</p>
                                <button 
                                  onClick={() => setActiveTab('admin')} 
                                  className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                                    activeTab === 'admin' 
                                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' 
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`material-symbols-outlined text-xl ${activeTab === 'admin' ? 'filled' : ''}`}>shield_person</span>
                                        <span className="text-[11px] font-black uppercase tracking-[0.15em]">Panel Admin</span>
                                    </div>
                                    {activeTab === 'admin' && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
    
                {/* User Card - Bottom */}
                <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 relative group transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-900 font-black text-sm border border-slate-100">
                            {userName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black text-slate-900 truncate leading-tight mb-1">{userName}</p>
                            <div className="flex items-center gap-1.5">
                                <div className={`size-1.5 rounded-full ${isAdmin ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">{isAdmin ? 'Administrator' : 'Verified Member'}</p>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 text-[9px] font-black bg-white text-slate-400 uppercase tracking-widest hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-slate-100 group/logout"
                    >
                        <span className="material-symbols-outlined text-sm group-hover/logout:rotate-12 transition-transform">logout</span>
                        Cerrar Sesión
                    </button>
                </div>
            </nav>
    
            <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/20">
              {activeTab === 'home' && (
                <div className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth">
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
                    onViewHistory={() => setActiveTab('history')}
                    onLogout={handleLogout}
                    userName={userName}
                    userId={session.user.id}
                  />
                </div>
              )}

          {activeTab === 'history' && (
             <div className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
               <HistoryPanel 
                 userId={session.user.id}
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
            <div className="absolute inset-0 flex flex-col overflow-hidden bg-white z-20">
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
                  {messages.map((msg) => {
                    const isLocation = msg.content.includes('📍 Mi ubicación actual:') && msg.content.includes('maps?q=');
                    const coords = isLocation ? msg.content.match(/q=([-.\d]+),([-.\d]+)/) : null;
                    
                    return (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`flex flex-col max-w-[88%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {isLocation && coords ? (
                            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 w-full max-w-[300px] group transition-all hover:scale-[1.02]">
                                <div className="h-40 bg-slate-100 relative">
                                    <iframe 
                                      title="Location Map"
                                      width="100%" 
                                      height="100%" 
                                      frameBorder="0" 
                                      className="grayscale hover:grayscale-0 transition-all duration-700"
                                      src={`https://maps.google.com/maps?q=${coords[1]},${coords[2]}&z=15&output=embed`}
                                    />
                                    <div className="absolute inset-0 pointer-events-none border-4 border-white/20"></div>
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <div className="bg-green-500 w-2 h-2 rounded-full animate-ping"></div>
                                        <div className="bg-green-500 w-2 h-2 rounded-full absolute"></div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg filled">location_on</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Punto de Recojo</p>
                                            <p className="text-xs font-black text-slate-800 tracking-tight">Geolocalización GPS</p>
                                        </div>
                                    </div>
                                    <a 
                                      href={`https://www.google.com/maps?q=${coords[1]},${coords[2]}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                        Abrir en Google Maps
                                    </a>
                                </div>
                            </div>
                          ) : (
                            <div className={`px-6 py-4 rounded-3xl text-sm font-medium leading-relaxed relative ${
                              msg.role === 'user' 
                              ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-tr-none shadow-xl shadow-primary/25' 
                              : 'bg-white text-slate-800 rounded-tl-none shadow-2xl shadow-slate-200/50 border border-slate-50'
                            }`}>
                              {msg.content.split('\n').map((line, i) => (
                                <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                              ))}
                            </div>
                          )}

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
                    );
                  })}

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
              <div className="p-4 md:px-8 md:py-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 relative z-20">
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

            {/* MOBILE NAVIGATION - Obsidian Style */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50">
                <div className="bg-slate-900/95 backdrop-blur-2xl px-6 py-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex justify-between items-center relative overflow-hidden">
                    {/* Visual Light Effect */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
                    
                    {[
                        { id: 'home', icon: 'grid_view', label: 'Inicio' },
                        { id: 'chat', icon: 'bolt', label: 'Chat' },
                        { id: 'history', icon: 'history_edu', label: 'Historial' },
                        { id: 'admin', icon: 'shield_person', label: 'Admin', hide: !isAdmin }
                    ].filter(item => !item.hide).map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`flex flex-col items-center gap-1.5 transition-all relative ${
                                activeTab === item.id ? 'text-white scale-110' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-2xl ${activeTab === item.id ? 'filled' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-opacity ${
                                activeTab === item.id ? 'opacity-100' : 'opacity-0'
                            }`}>
                                {item.label}
                            </span>
                            {activeTab === item.id && (
                                <span className="absolute -top-1 w-1 h-1 bg-blue-400 rounded-full animate-pulse"></span>
                            )}
                        </button>
                    ))}
                </div>
            </nav>
      </div>
  );
}

export default App;
