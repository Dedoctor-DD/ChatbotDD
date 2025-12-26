import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

import type { ServiceRequest } from '../types';

interface HistoryPanelProps {
    onViewDetail: (request: ServiceRequest) => void;
}

export function HistoryPanel({ onViewDetail }: HistoryPanelProps) {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const { data } = await supabase
                .from('service_requests')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (data) setRequests(data);
            setLoading(false);
        };
        fetchHistory();
    }, []);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending': return { label: 'Pendiente', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' };
            case 'confirmed': return { label: 'Confirmado', color: 'bg-blue-50 text-blue-600 border-blue-100' };
            case 'in_process': return { label: 'En Proceso', color: 'bg-purple-50 text-purple-600 border-purple-100' };
            case 'completed': return { label: 'Completado', color: 'bg-green-50 text-green-600 border-green-100' };
            case 'cancelled': return { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-100' };
            default: return { label: status, color: 'bg-gray-50 text-gray-600 border-gray-100' };
        }
    };

    return (
        <div className="flex flex-col w-full min-h-full bg-slate-50/30 pb-24 md:pb-6">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 h-20 flex items-center justify-between">
                <div>
                   <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">Mi Historial</h1>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Actividad y Servicios</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                   <span className="material-symbols-outlined text-xl">history</span>
                </div>
            </header>

            <main className="flex-1 p-6 space-y-5 animate-fade-in overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 px-8 bg-white rounded-[3rem] border border-slate-100 shadow-inner">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-slate-200 text-5xl">folder_off</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">Sin actividad</h3>
                        <p className="text-xs font-medium text-slate-400 leading-relaxed">Aún no has solicitado servicios técnicos o de transporte.</p>
                    </div>
                ) : (
                    requests.map((request) => {
                        const status = getStatusInfo(request.status);
                        const isTransport = request.service_type === 'transport';
                        
                        return (
                            <div key={request.id} className="bg-white rounded-[2.5rem] border border-slate-50 shadow-2xl shadow-slate-200/50 p-6 flex flex-col gap-4 active:scale-[0.98] transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${isTransport ? 'bg-blue-50/50 text-primary' : 'bg-orange-50/50 text-orange-600'}`}>
                                            <span className="material-symbols-outlined text-3xl filled">{isTransport ? 'ambulance' : 'build'}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-base tracking-tight uppercase">
                                                {isTransport ? 'Traslado' : 'Taller Técnico'}
                                            </h4>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                                {new Date(request.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm ${status.color}`}>
                                        {status.label}
                                    </div>
                                </div>

                                <div className="h-px bg-slate-50 w-full"></div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">#{request.id.slice(0, 8)}</span>
                                    </div>
                                    <button 
                                        onClick={() => onViewDetail(request)}
                                        className="bg-slate-50 hover:bg-primary hover:text-white text-primary text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 group border-none cursor-pointer"
                                    >
                                        Ver Detalles
                                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </main>
        </div>
    );
}
