import { useState, useEffect } from 'react';
import { Truck, Wrench, MessageSquare, User, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HomePanelProps {
  onServiceSelect: (service: 'transport' | 'workshop') => void;
  onGoToChat: () => void;
  userName: string;
  userEmail: string;
  userId: string;
}

import type { Debt, ServiceRequest } from '../types';

export function HomePanel({ onServiceSelect, onGoToChat, userName, userEmail, userId }: HomePanelProps) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [recentRequests, setRecentRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
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

  if (loading) {
    return (
      <div className="home-panel w-full max-w-2xl mx-auto pb-20 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="home-panel w-full max-w-2xl mx-auto pb-20">
      <div className="home-header mb-8 mt-4 px-2">
        <div className="user-greeting flex flex-col md:flex-row items-center gap-6 text-center md:text-left bg-transparent p-0 border-none shadow-none">
          <div className="user-avatar-large shrink-0 relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 rounded-full shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-4 border-white">
               <User className="w-8 h-8 text-blue-600" />
            </div>
            {debts.length > 0 && (
              <div className="absolute top-0 right-0 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                <span className="text-[10px] font-black text-white">!</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="welcome-title text-3xl font-black text-slate-800 tracking-tight mb-1">¡Hola, {userName.split(' ')[0]}!</h1>
            <p className="welcome-subtitle text-slate-500 font-medium leading-tight">¿Listo para tu próximo servicio?</p>
            <p className="text-xs text-slate-400 font-medium mt-1 bg-slate-100 px-2 py-0.5 rounded-md inline-block">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* ALERT: DEBTS */}
      {/* ALERT: DEBTS PREMIUM CARD */}
      {totalDebt > 0 && (
        <div className="mb-6 bg-white rounded-[2rem] p-6 shadow-[0_10px_40px_-10px_rgba(239,68,68,0.15)] border border-red-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50 transition-transform group-hover:scale-110"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-100 text-red-500 rounded-2xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-slate-800 text-lg">Pagos Pendientes</h3>
                   <p className="text-xs text-slate-500 font-medium">{debts.length} cargo(s) en tu cuenta</p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-2xl font-black text-slate-800">${totalDebt.toLocaleString()}</span>
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full inline-block mt-1">Por pagar</span>
              </div>
            </div>
            
            <div className="space-y-2 mt-2">
              {debts.map(debt => (
                <div key={debt.id} className="flex justify-between items-center text-sm bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-600 font-medium pl-1">{debt.description}</span>
                  <span className="font-bold text-red-500 bg-white px-3 py-1 rounded-xl shadow-sm border border-red-50">${debt.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 bg-red-500 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-red-500/25 hover:bg-red-600 active:scale-95 transition-all">
               Resolver Pagos
            </button>
          </div>
        </div>
      )}

      <div className="services-section mb-10 px-2">
        <h2 className="section-title text-left mb-4 text-sm font-bold uppercase tracking-wider text-slate-400 pl-2">Servicios Disponibles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onServiceSelect('transport')}
            className="group bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-lg hover:border-blue-100 hover:translate-y-[-2px] text-left relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 relative z-10 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Truck className="w-8 h-8" />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-700 transition-colors">Transporte</h3>
              <p className="text-slate-500 text-sm leading-tight mt-1">
                Viajes seguros puerta a puerta
              </p>
            </div>
          </button>

          <button
            onClick={() => onServiceSelect('workshop')}
            className="group bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-lg hover:border-orange-100 hover:translate-y-[-2px] text-left relative overflow-hidden"
          >
             <div className="absolute right-0 top-0 w-32 h-32 bg-orange-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 relative z-10 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Wrench className="w-8 h-8" />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg text-slate-800 group-hover:text-orange-700 transition-colors">Mantenimiento</h3>
              <p className="text-slate-500 text-sm leading-tight mt-1">
                Reparación y chequeo técnico
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="mb-24 px-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 pl-2">Actividad Reciente</h3>

        {recentRequests.length > 0 ? (
          <div className="space-y-3">
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
                <div key={req.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 flex items-center justify-between hover:shadow-md transition-all cursor-pointer shadow-sm group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${req.service_type === 'transport' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {req.service_type === 'transport' ? <Truck className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                        {req.service_type === 'transport' ? 'Transporte' : 'Taller'}
                      </p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        {new Date(req.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${statusClass}`}>
                    {statusLabel}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 border-dashed rounded-[2rem] p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold text-sm mb-1">Sin actividad reciente</p>
            <p className="text-xs text-slate-400">Tus solicitudes aparecerán aquí</p>
          </div>
        )}
      </div>

      {/* QUICK ACTION - INTEGRATED */}
      <div className="mt-6 mb-8 px-2">
        <button
          onClick={onGoToChat}
          className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-[2rem] shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-3"
        >
          {/* Decorative shapes */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mt-12 opacity-50"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16 opacity-50 transition-transform group-hover:scale-150 duration-700"></div>

          <div className="relative z-10 bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/10 group-hover:rotate-6 transition-transform">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="relative z-10 font-black text-lg tracking-wide">Iniciar Nueva Conversación</span>
        </button>
      </div>
    </div>
  );
}
