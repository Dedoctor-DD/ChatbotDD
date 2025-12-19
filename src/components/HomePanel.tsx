import { useState, useEffect } from 'react';
import { Truck, Wrench, MessageSquare, User, AlertCircle, Edit2, Phone, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProfileModal } from './ProfileModal';
import type { Debt, ServiceRequest, Profile } from '../types';

interface HomePanelProps {
  onServiceSelect: (service: 'transport' | 'workshop') => void;
  onGoToChat: () => void;
  userName: string;
  userEmail: string;
  userId: string;
}

export function HomePanel({ onServiceSelect, onGoToChat, userName: initialUserName, userEmail, userId }: HomePanelProps) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [recentRequests, setRecentRequests] = useState<ServiceRequest[]>([]);
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileData) setProfile(profileData);

      const { data: debtsData } = await supabase
        .from('client_debts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (debtsData) setDebts(debtsData);

      const { data: reqData } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (reqData) setRecentRequests(reqData);

    } catch (e) {
      console.error('Error loading user data', e);
    } finally {
      setLoading(false);
    }
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const userName = profile?.full_name || initialUserName;

  if (loading) {
    return (
      <div className="home-panel w-full max-w-5xl mx-auto pb-20 flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-xl h-12 w-12 border-4 border-sky-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="home-panel w-full max-w-5xl mx-auto pb-20 relative px-4">

      {/* Hero Section: Greeting & Profile */}
      <div className="home-header mb-12 mt-8">
        <div className="user-greeting flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative">
          
          <div className="relative group perspective-1000">
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              className="user-avatar-large shrink-0 relative w-24 h-24 bg-gradient-to-br from-sky-500 to-indigo-600 p-1 rounded-[2rem] shadow-xl shadow-sky-500/20 cursor-pointer transform transition-all duration-500 hover:rotate-3 hover:scale-105 active:scale-95 group"
            >
              <div className="w-full h-full bg-white rounded-[1.8rem] flex items-center justify-center overflow-hidden border-4 border-white relative">
                {profile?.avatar_url || profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-sky-600" />
                )}
                
                <div className="absolute inset-0 bg-sky-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Edit2 className="w-6 h-6 text-white drop-shadow-md" />
                </div>
              </div>
              
              {debts.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-7 h-7 flex items-center justify-center border-4 border-slate-50 shadow-lg z-20 animate-bounce">
                  <span className="text-[10px] font-black text-white">!</span>
                </div>
              )}
            </div>
            
            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-xl shadow-md border border-slate-100 group-hover:scale-110 transition-transform">
               <Edit2 className="w-3 h-3 text-sky-500" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
               <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">¡Hola, {userName.split(' ')[0]}!</h1>
               <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-sky-100 transition-colors inline-block w-fit mx-auto md:mx-0 border border-sky-100"
               >
                 Mi Perfil
               </button>
            </div>
            <p className="text-slate-500 font-semibold text-lg">¿En qué podemos ayudarte hoy?</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/50">{userEmail}</span>
               {profile?.phone && (
                 <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider bg-sky-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-sky-100/50">
                   <Phone className="w-3 h-3" /> {profile.phone}
                 </span>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* ALERT: DEBTS */}
      {totalDebt > 0 && (
        <div className="mb-12 glass-card rounded-[32px] p-8 border-red-50 relative overflow-hidden group border border-red-100">
          <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-110"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center shadow-inner">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="text-center md:text-left">
                   <h3 className="font-black text-slate-800 text-2xl tracking-tight">Pagos Pendientes</h3>
                   <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Tienes {debts.length} cargo(s) por resolver</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <span className="block text-4xl font-black text-slate-900 tracking-tighter">${totalDebt.toLocaleString()}</span>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full mt-2 border border-red-100">
                   <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                   Por pagar
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {debts.map(debt => (
                <div key={debt.id} className="flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-slate-100 hover:border-red-200 hover:bg-white transition-all duration-300">
                  <span className="text-slate-600 font-bold text-sm">{debt.description}</span>
                  <span className="font-black text-slate-800 tracking-tight">${debt.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Services Selection: The Premium Experience */}
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 pl-2">Servicios Disponibles</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <button 
          onClick={() => onServiceSelect('workshop')}
          className="premium-card group overflow-hidden rounded-[40px] text-left border-none relative bg-white"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-50 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="p-8 h-full flex flex-col relative z-10">
            <div className="w-16 h-16 bg-rose-50 rounded-[24px] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm border border-rose-100">
              <Wrench className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Servicio Técnico</h3>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed mb-8 opacity-80">Mantenimiento experto y reparaciones garantizadas para tu equipo.</p>
            <div className="mt-auto flex items-center text-rose-600 font-black text-xs uppercase tracking-[0.2em] gap-2">
              <span>Solicitar ahora</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
            </div>
          </div>
        </button>

        <button 
          onClick={() => onServiceSelect('transport')}
          className="premium-card group overflow-hidden rounded-[40px] text-left border-none relative bg-white"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-sky-50 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="p-8 h-full flex flex-col relative z-10">
            <div className="w-16 h-16 bg-sky-50 rounded-[24px] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-sm border border-sky-100">
              <Truck className="w-8 h-8 text-sky-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Transporte Adaptado</h3>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed mb-8 opacity-80">Viajes confortables en vehículos equipados para cualquier necesidad.</p>
            <div className="mt-auto flex items-center text-sky-600 font-black text-xs uppercase tracking-[0.2em] gap-2">
              <span>Programar viaje</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
            </div>
          </div>
        </button>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="mb-24">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 pl-2">Actividad Reciente</h3>

        {recentRequests.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {recentRequests.map(req => {
              let statusLabel = 'Pendiente';
              let statusClass = 'bg-yellow-50 text-yellow-600 border-yellow-200';

              if (req.status === 'confirmed') {
                statusLabel = 'Confirmado';
                statusClass = 'bg-blue-50 text-blue-600 border-blue-200';
              } else if (req.status === 'in_process') {
                statusLabel = 'En Proceso';
                statusClass = 'bg-purple-50 text-purple-600 border-purple-200';
              } else if (req.status === 'completed') {
                statusLabel = 'Completado';
                statusClass = 'bg-green-50 text-green-600 border-green-200';
              } else if (req.status === 'cancelled') {
                statusLabel = 'Cancelado';
                statusClass = 'bg-slate-100 text-slate-500 border-slate-200';
              }

              return (
                <div key={req.id} className="premium-card rounded-[2.5rem] p-6 flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${req.service_type === 'transport' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                      {req.service_type === 'transport' ? <Truck className="w-7 h-7" /> : <Wrench className="w-7 h-7" />}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-base mb-0.5 group-hover:text-sky-600 transition-colors tracking-tight">
                        {req.service_type === 'transport' ? 'Transporte' : 'Taller'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        {new Date(req.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusClass}`}>
                    {statusLabel}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-50 border-dashed rounded-[3rem] p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Truck className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-extrabold text-xs uppercase tracking-widest mb-2">Sin actividad reciente</p>
            <p className="text-xs text-slate-300 font-semibold italic">Tus solicitudes aparecerán aquí una vez las realices</p>
          </div>
        )}
      </div>

      {/* QUICK ACTION: Start Chat */}
      <div className="mt-8 mb-4">
        <button
          onClick={onGoToChat}
          className="w-full group relative overflow-hidden bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col md:flex-row items-center justify-center gap-6"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-sky-500/20 rounded-full -ml-32 -mt-32 blur-3xl group-hover:opacity-60 transition-opacity"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mb-32 blur-3xl"></div>

          <div className="relative z-10 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 group-hover:rotate-12 transition-transform duration-500">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <div className="relative z-10 text-center md:text-left">
            <h4 className="font-black text-2xl tracking-tight text-white mb-1">¿Tienes alguna duda?</h4>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Chatea con nuestro asistente inteligente</p>
          </div>
        </button>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={userId}
        onUpdate={loadUserData}
      />
    </div>
  );
}
