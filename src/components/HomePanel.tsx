import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ProfileModal } from './ProfileModal';
import type { Debt, ServiceRequest, Profile } from '../types';

interface HomePanelProps {
  onServiceSelect: (service: 'transport' | 'workshop') => void;
  onGoToChat: () => void;
  onViewDetail: (request: ServiceRequest) => void;
  userName: string;
  userId: string;
}

export function HomePanel({ onServiceSelect, onGoToChat, onViewDetail, userName: initialUserName, userId }: HomePanelProps) {
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
        .maybeSingle();
      
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
        .limit(5);

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
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-24 bg-slate-50/30">
      {/* Saludo y Perfil Quick Link */}
      <section className="px-6 pt-10 mb-8">
        <div className="flex justify-between items-end">
          <div className="animate-fade-in">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Bienvenido de vuelta</span>
                <div className="h-px w-8 bg-slate-200"></div>
             </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
              ¡Hola, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">{userName.split(' ')[0]}</span>!
            </h2>
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-14 h-14 rounded-2xl bg-white shadow-2xl shadow-slate-200 flex items-center justify-center border border-slate-50 overflow-hidden active:scale-90 transition-all group"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
              <span className="material-symbols-outlined text-primary text-4xl group-hover:scale-110 transition-transform">account_circle</span>
            )}
          </button>
        </div>
      </section>

      {/* Alerta de Deuda si existe */}
      {totalDebt > 0 && (
        <section className="px-6 mb-8">
          <div className="bg-rose-500 rounded-3xl p-6 text-white shadow-xl shadow-rose-500/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-2xl filled">account_balance_wallet</span>
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest mb-1">Pago Pendiente</h4>
                  <p className="text-2xl font-black tracking-tighter">${totalDebt.toLocaleString()}</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-white text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all border-none">
                PAGAR
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Servicios Principales */}
      <section className="px-6 mb-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            Nuestros Servicios
            <div className="h-px flex-1 bg-slate-100"></div>
        </h3>
        <div className="grid grid-cols-2 gap-5">
          <button 
            onClick={() => onServiceSelect('transport')}
            className="bg-white p-8 rounded-5xl shadow-2xl shadow-slate-200/50 border border-slate-50 text-left group active:scale-95 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="w-14 h-14 bg-blue-50/50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:rotate-6 transition-all relative z-10">
              <span className="material-symbols-outlined text-3xl filled">ambulance</span>
            </div>
            <h4 className="font-black text-slate-900 text-sm tracking-tight uppercase">Transporte</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Traslado Seguro</p>
          </button>

          <button 
            onClick={() => onServiceSelect('workshop')}
            className="bg-white p-8 rounded-5xl shadow-2xl shadow-slate-200/50 border border-slate-50 text-left group active:scale-95 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="w-14 h-14 bg-orange-50/50 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:rotate-6 transition-all relative z-10">
              <span className="material-symbols-outlined text-3xl filled">build</span>
            </div>
            <h4 className="font-black text-slate-900 text-sm tracking-tight uppercase">Taller MMc</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Técnico experto</p>
          </button>
        </div>
      </section>

      {/* Banner Chatbot */}
      <section className="px-6 mb-10">
        <button 
          onClick={onGoToChat}
          className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-4xl p-8 flex items-center justify-between text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group border-none transition-all active:scale-95"
        >
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl text-primary animate-pulse">smart_toy</span>
            </div>
            <div className="text-left">
              <h4 className="font-black text-lg tracking-tight uppercase leading-none mb-1">Arise AI</h4>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80">Asistente Virtual 24/7</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform relative z-10">
             <span className="material-symbols-outlined">arrow_forward</span>
          </div>
        </button>
      </section>

      {/* Actividad Reciente */}
      <section className="px-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            Actividad Reciente
            <div className="h-px w-12 bg-slate-100"></div>
          </h3>
        </div>
        
        <div className="space-y-4">
          {recentRequests.length > 0 ? (
            recentRequests.map(req => {
              const isTransport = req.service_type === 'transport';
              return (
                <button 
                  key={req.id} 
                  onClick={() => onViewDetail(req)}
                  className="w-full bg-white p-5 rounded-3xl border border-slate-50 flex items-center justify-between shadow-xl shadow-slate-200/40 cursor-pointer active:scale-98 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${isTransport ? 'bg-blue-50/50 text-primary' : 'bg-orange-50/50 text-orange-500'} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-2xl filled">
                        {isTransport ? 'ambulance' : 'build'}
                      </span>
                    </div>
                    <div>
                      <h5 className="font-black text-sm text-slate-800 tracking-tight uppercase">
                        {isTransport ? 'Transporte' : 'Workshop'}
                      </h5>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
                        Solicitado el {new Date(req.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className={`text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${
                    req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                    req.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {req.status === 'completed' ? 'Finalizado' : 'En Proceso'}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-16 text-center bg-white rounded-5xl border border-slate-100 shadow-inner">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="material-symbols-outlined text-4xl text-slate-200 group-hover:rotate-12 transition-transform">history_toggle_off</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sin actividad reciente</p>
            </div>
          )}
        </div>
      </section>

      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={userId}
        onUpdate={loadUserData}
      />
    </div>
  );
}
