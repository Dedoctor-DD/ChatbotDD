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
        <div className="flex flex-col w-full min-h-full bg-background-light dark:bg-background-dark pb-24">
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center px-6 h-16 justify-center">
                    <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Mi Actividad</h1>
                </div>
            </header>

            <main className="flex-1 p-4 space-y-4 animate-fade-in overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                            <span className="material-symbols-outlined text-gray-300 text-3xl">history</span>
                        </div>
                        <p className="text-sm font-bold text-gray-400">No tienes servicios registrados aún.</p>
                    </div>
                ) : (
                    requests.map((request) => {
                        const status = getStatusInfo(request.status);
                        const isTransport = request.service_type === 'transport';
                        
                        return (
                            <div key={request.id} className="bg-white dark:bg-surface-dark rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col gap-4 active:scale-[0.98] transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isTransport ? 'bg-blue-50 text-primary dark:bg-blue-900/20' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20'}`}>
                                            <span className="material-symbols-outlined filled">{isTransport ? 'ambulance' : 'build'}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                                {isTransport ? 'Traslado Programado' : 'Servicio Técnico'}
                                            </h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                {new Date(request.created_at).toLocaleDateString()} • {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${status.color}`}>
                                        {status.label}
                                    </div>
                                </div>

                                <div className="border-t border-gray-50 dark:border-gray-800 pt-3 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">ID: {request.id.slice(0, 8)}</span>
                                    <button 
                                        onClick={() => onViewDetail(request)}
                                        className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group border-none bg-transparent cursor-pointer"
                                    >
                                        Ver Detalles
                                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">chevron_right</span>
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
