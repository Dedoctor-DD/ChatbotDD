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
    <div className="flex flex-col min-h-full pb-24">
      {/* Saludo y Perfil Quick Link */}
      <section className="px-6 pt-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              ¡Hola, <span className="text-primary">{userName.split(' ')[0]}</span>!
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">¿Qué haremos hoy?</p>
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-surface-dark shadow-md flex items-center justify-center border border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary text-3xl">account_circle</span>
            )}
          </button>
        </div>
      </section>

      {/* Alerta de Deuda si existe */}
      {totalDebt > 0 && (
        <section className="px-6 mb-6">
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-3xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
                <span className="material-symbols-outlined filled">warning</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Pago Pendiente</h4>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest">${totalDebt.toLocaleString()}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/30">
              PAGAR
            </button>
          </div>
        </section>
      )}

      {/* Servicios Principales */}
      <section className="px-6 mb-8">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Nuestros Servicios</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onServiceSelect('transport')}
            className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-gray-50 dark:border-gray-800 text-left group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl filled">ambulance</span>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Transporte</h4>
            <p className="text-[10px] text-gray-500 mt-1"> Traslados Seguros</p>
          </button>

          <button 
            onClick={() => onServiceSelect('workshop')}
            className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-gray-50 dark:border-gray-800 text-left group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl filled">build</span>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Taller MMc</h4>
            <p className="text-[10px] text-gray-500 mt-1">Reparación Técnica</p>
          </button>
        </div>
      </section>

      {/* Banner Chatbot */}
      <section className="px-6 mb-8">
        <button 
          onClick={onGoToChat}
          className="w-full bg-primary rounded-[2.5rem] p-6 flex items-center justify-between text-white shadow-xl shadow-blue-500/30 relative overflow-hidden group border-none"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">chat_bubble</span>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm">Asistente Virtual</h4>
              <p className="text-[10px] font-medium opacity-80">Solicita ayuda por chat</p>
            </div>
          </div>
          <span className="material-symbols-outlined relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
        </button>
      </section>

      {/* Actividad Reciente */}
      <section className="px-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actividad Reciente</h3>
        </div>
        
        <div className="space-y-3">
          {recentRequests.length > 0 ? (
            recentRequests.map(req => {
              const isTransport = req.service_type === 'transport';
              return (
                <button 
                  key={req.id} 
                  onClick={() => onViewDetail(req)}
                  className="w-full bg-white dark:bg-surface-dark p-4 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm cursor-pointer active:scale-95 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${isTransport ? 'bg-blue-50 text-primary' : 'bg-orange-50 text-orange-500'} rounded-xl flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-xl filled">
                        {isTransport ? 'ambulance' : 'build'}
                      </span>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                        {isTransport ? 'Solicitud Transporte' : 'Servicio Taller'}
                      </h5>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">
                        {new Date(req.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                    req.status === 'completed' ? 'bg-green-100 text-green-700' : 
                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {req.status === 'completed' ? 'Completado' : 'Pendiente'}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-10 text-center bg-gray-50/50 dark:bg-surface-dark/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">history</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sin actividad reciente</p>
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
