import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Calendar, Check, X } from 'lucide-react';
import type { Appointment } from '../../types';

export function AppointmentsManager() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppointments();
        
        // Subscribe to changes
        const channel = supabase
            .channel('admin-appointments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
                loadAppointments();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const loadAppointments = async () => {
        const { data } = await supabase
            .from('appointments')
            .select('*, profiles(full_name, phone)') // Fetch user details if linked properly, otherwise rely on ID
            .order('scheduled_at', { ascending: true }); // Soonest first
        
        if (data) setAppointments(data as any);
        setLoading(false);
    };

    const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
        const updateData: any = { status };
        if (status === 'confirmed') {
             updateData.payment_status = 'paid_verified';
        }
        await supabase.from('appointments').update(updateData).eq('id', id);
        // Optimistic update
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status, payment_status: status === 'confirmed' ? 'paid_verified' : a.payment_status } : a));
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString('es-CL', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    // Calculate slots used (booked or confirmed)
    const slotsUsed = appointments.filter(a => a.status !== 'cancelled').length;

    return (
        <div className="bg-white p-4 md:p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="font-black text-slate-800">Gestión de Citas</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Solicitudes</p>
                        <span className="bg-blue-50 text-primary text-[10px] font-black px-2 py-0.5 rounded-md border border-blue-100">
                           {slotsUsed}/10 Cupos
                        </span>
                    </div>
                 </div>
                 <div className="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                    <Calendar size={20} />
                 </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                {loading ? (
                    <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <p className="text-xs font-bold uppercase tracking-widest">No hay citas agendadas</p>
                    </div>
                ) : (
                    appointments.map(apt => (
                        <div key={apt.id} className="relative bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] overflow-hidden transition-all duration-300 hover:shadow-xl group">
                            {/* Decorative Background Element */}
                            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 ${
                                apt.service_type === 'transport' ? 'bg-blue-500' : 'bg-amber-500'
                            }`} />

                            <div className="p-5 relative">
                                {/* Header: Status & Service Icon */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border ${
                                                apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                apt.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {apt.status === 'pending' ? 'Solicitud' : apt.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                                            </span>
                                            {(apt as any).payment_status === 'paid_verified' && (
                                                <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20">
                                                    Pagado
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-black text-slate-900 text-lg tracking-tight mt-1 truncate max-w-[200px]">{formatDate(apt.scheduled_at)}</h4>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                                        apt.service_type === 'transport' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'
                                    }`}>
                                        <span className="material-symbols-outlined">{apt.service_type === 'transport' ? 'emergency_share' : 'build'}</span>
                                    </div>
                                </div>

                                {/* User Details */}
                                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-50 mb-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 text-xs shadow-sm">
                                        {(apt as any).profiles?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-black text-slate-800 truncate">{(apt as any).profiles?.full_name || 'Usuario Anonimo'}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{(apt as any).profiles?.phone || 'Sin número'}</p>
                                    </div>
                                    {(apt as any).payment_proof_url && (
                                        <a href={(apt as any).payment_proof_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-blue-500 shadow-sm active:scale-90 transition-all">
                                            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                        </a>
                                    )}
                                </div>

                                {apt.service_type === 'transport' && apt.origin && (
                                    <div className="grid grid-cols-1 gap-2 mb-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-white p-2.5 rounded-xl border border-slate-50 relative group/info">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                            <span className="truncate flex-1">{apt.origin.includes('maps?q=') ? 'Ubicación GPS Compartida' : apt.origin}</span>
                                            {apt.origin.includes('maps?q=') && (
                                                <a href={apt.origin} target="_blank" rel="noopener noreferrer" className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shadow-sm hover:bg-blue-600 hover:text-white transition-all">
                                                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-white p-2.5 rounded-xl border border-slate-50 relative">
                                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                            <span className="truncate flex-1">{apt.destination?.includes('maps?q=') ? 'Ubicación GPS Destino' : apt.destination || '---'}</span>
                                            {apt.destination?.includes('maps?q=') && (
                                                <a href={apt.destination} target="_blank" rel="noopener noreferrer" className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shadow-sm hover:bg-blue-600 hover:text-white transition-all">
                                                    <span className="material-symbols-outlined text-[16px]">map</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Admin Actions */}
                                {apt.status === 'pending' ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => updateStatus(apt.id, 'confirmed')}
                                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check size={16} strokeWidth={4} /> Confirmar
                                        </button>
                                        <button 
                                            onClick={() => updateStatus(apt.id, 'cancelled')}
                                            className="px-5 py-4 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 active:scale-95 transition-all"
                                        >
                                            <X size={16} strokeWidth={4} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-2">
                                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">Cita {apt.status === 'confirmed' ? 'Cerrada' : 'Anulada'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
