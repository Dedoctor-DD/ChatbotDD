import { useState, useEffect } from 'react';
import { Truck, Wrench, MessageSquare, User, AlertCircle, Edit2, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProfileModal } from './ProfileModal';

interface HomePanelProps {
  onServiceSelect: (service: 'transport' | 'workshop') => void;
  onGoToChat: () => void;
  userName: string;
  userEmail: string;
  userId: string;
}

import type { Debt, ServiceRequest, Profile } from '../types';

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
      // Load Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileData) setProfile(profileData);

      // Load Pending Debts
      const { data: debtsData } = await supabase
        .from('client_debts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (debtsData) setDebts(debtsData);

      // Load Recent Requests (Limit 3)
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
      <div className="home-panel w-full max-w-2xl mx-auto pb-20 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="home-panel w-full max-w-2xl mx-auto pb-20 relative px-4">

      <div className="home-header mb-8 mt-4">
        <div className="user-greeting flex flex-col md:flex-row items-center gap-6 text-center md:text-left bg-transparent p-0 border-none shadow-none relative">
          
          <div className="relative group perspective-1000">
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              className="user-avatar-large shrink-0 relative w-24 h-24 bg-gradient-to-br from-sky-500 to-indigo-600 p-1 rounded-[2rem] shadow-xl shadow-sky-500/20 cursor-pointer transform transition-all duration-500 hover:rotate-3 hover:scale-105 active:scale-95 group"
            >
              <div className="w-full h-full bg-white rounded-[1.8rem] flex items-center justify-center overflow-hidden border-4 border-white relative">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-sky-600" />
                )}
                
                {/* Hover overlay */}
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
            
            {/* Quick edit badge */}
            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-xl shadow-md border border-slate-100 group-hover:scale-110 transition-transform">
               <Edit2 className="w-3 h-3 text-sky-500" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1 justify-center md:justify-start">
               <h1 className="welcome-title text-3xl font-black text-slate-800 tracking-tight">¡Hola, {userName.split(' ')[0]}!</h1>
               <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-sky-50 text-sky-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-sky-100 transition-colors inline-block w-fit mx-auto md:mx-0"
               >
                 Editar Perfil
               </button>
            </div>
            <p className="welcome-subtitle text-slate-500 font-medium leading-tight">¿Listo para tu próximo servicio?</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100/50 px-2.5 py-1 rounded-lg">{userEmail}</p>
               {profile?.phone && (
                 <p className="text-[10px] text-sky-500 font-bold uppercase tracking-wider bg-sky-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                   <Phone className="w-3 h-3" /> {profile.phone}
                 </p>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* ALERT: DEBTS */}
      {totalDebt > 0 && (
        <div className="mb-8 bg-white rounded-[2.5rem] p-8 shadow-xl shadow-red-500/10 border border-red-50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50 transition-transform group-hover:scale-110"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-red-100 text-red-500 rounded-[1.5rem] shadow-sm">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                   <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">Pagos Pendientes</h3>
                   <p className="text-sm text-slate-500 font-medium">{debts.length} cargo(s) en tu cuenta</p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-3xl font-black text-slate-900 tracking-tighter">${totalDebt.toLocaleString()}</span>
                <span className="text-[10px] text-red-600 font-black uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full inline-block mt-1 border border-red-100/50">Por pagar</span>
              </div>
            </div>
            
            <div className="space-y-3 mt-4">
              {debts.map(debt => (
                <div key={debt.id} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group/item hover:bg-white hover:shadow-sm transition-all duration-300">
                  <span className="text-slate-600 font-bold text-sm pl-1">{debt.description}</span>
                  <span className="font-black text-red-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-red-50 tracking-tight">${debt.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 bg-red-500 text-white py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/25 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2">
               Resolver Pagos <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="services-section mb-10">
        <h2 className="section-title text-left mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2">Servicios Disponibles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button
            onClick={() => onServiceSelect('transport')}
            className="group bg-white p-7 rounded-[3rem] shadow-sm border border-slate-100 flex items-center gap-6 transition-all hover:shadow-xl hover:border-sky-200 hover:translate-y-[-4px] text-left relative overflow-hidden active:scale-95 duration-300"
          >
            <div className="absolute right-0 top-0 w-40 h-40 bg-sky-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
            <div className="w-20 h-20 bg-sky-100/80 rounded-[2.2rem] flex items-center justify-center text-sky-600 relative z-10 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Truck className="w-10 h-10" />
            </div>
            <div className="relative z-10 flex-1">
              <h3 className="font-black text-xl text-slate-800 group-hover:text-sky-700 transition-colors tracking-tight">Transporte</h3>
              <p className="text-slate-500 text-sm font-medium leading-tight mt-1 opacity-80">
                Viajes seguros puerta a puerta
              </p>
            </div>
          </button>

          <button
            onClick={() => onServiceSelect('workshop')}
            className="group bg-white p-7 rounded-[3rem] shadow-sm border border-slate-100 flex items-center gap-6 transition-all hover:shadow-xl hover:border-orange-200 hover:translate-y-[-4px] text-left relative overflow-hidden active:scale-95 duration-300"
          >
             <div className="absolute right-0 top-0 w-40 h-40 bg-orange-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
            <div className="w-20 h-20 bg-orange-100/80 rounded-[2.2rem] flex items-center justify-center text-orange-600 relative z-10 shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
              <Wrench className="w-10 h-10" />
            </div>
            <div className="relative z-10 flex-1">
              <h3 className="font-black text-xl text-slate-800 group-hover:text-orange-700 transition-colors tracking-tight">Mantenimiento</h3>
              <p className="text-slate-500 text-sm font-medium leading-tight mt-1 opacity-80">
                Reparación y chequeo técnico
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="mb-24">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5 pl-2">Actividad Reciente</h3>

        {recentRequests.length > 0 ? (
          <div className="space-y-4">
            {recentRequests.map(req => {
              // Status Logic mapping
              let statusLabel = 'Pendiente';
              let statusClass = 'bg-yellow-50 text-yellow-600 border-yellow-100';

              if (req.status === 'confirmed') {
                statusLabel = 'Confirmado';
                statusClass = 'bg-blue-50 text-blue-600 border-blue-100';
              } else if (req.status === 'in_process') {
                statusLabel = 'En Proceso';
                statusClass = 'bg-purple-50 text-purple-600 border-purple-100 animate-pulse';
              } else if (req.status === 'completed') {
                statusLabel = 'Completado';
                statusClass = 'bg-green-50 text-green-600 border-green-100';
              } else if (req.status === 'cancelled') {
                statusLabel = 'Cancelado';
                statusClass = 'bg-slate-100 text-slate-500 border-slate-200';
              }

              return (
                <div key={req.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 flex items-center justify-between hover:shadow-lg hover:border-slate-200 transition-all cursor-pointer shadow-sm group active:scale-[0.99]">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${req.service_type === 'transport' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {req.service_type === 'transport' ? <Truck className="w-7 h-7" /> : <Wrench className="w-7 h-7" />}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-base mb-1 group-hover:text-blue-600 transition-colors tracking-tight">
                        {req.service_type === 'transport' ? 'Transporte' : 'Taller'}
                      </p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        {new Date(req.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border ${statusClass}`}>
                    {statusLabel}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-50 border-dashed rounded-[3rem] p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Truck className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Sin actividad reciente</p>
            <p className="text-xs text-slate-300 font-medium">Tus solicitudes aparecerán aquí</p>
          </div>
        )}
      </div>

      {/* QUICK ACTION - INTEGRATED */}
      <div className="mt-6 mb-8">
        <button
          onClick={onGoToChat}
          className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-[2.5rem] shadow-xl shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 py-8"
        >
          {/* Decorative shapes */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mt-16 opacity-50 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mb-20 opacity-50 transition-transform group-hover:scale-150 duration-1000 blur-2xl"></div>

          <div className="relative z-10 bg-white/20 p-3.5 rounded-[1.5rem] backdrop-blur-md border border-white/20 group-hover:rotate-12 transition-all duration-500 shadow-lg">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <span className="relative z-10 font-black text-xl tracking-tight">Iniciar Nueva Conversación</span>
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
