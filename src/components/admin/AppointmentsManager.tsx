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
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-50 h-[500px] flex flex-col">
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
                        <div key={apt.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex gap-2 mb-2">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                            apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                            apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {apt.status === 'pending' ? 'Pendiente' : apt.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                                        </span>
                                        {(apt as any).payment_status === 'paid_reported' && (
                                            <span className="bg-[#009EE3]/10 text-[#009EE3] text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-[#009EE3]/20 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[10px]">payments</span> Pago Reportado
                                            </span>
                                        )}
                                        {(apt as any).payment_status === 'paid_verified' && (
                                            <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-emerald-200">
                                                Pago OK
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm">{formatDate(apt.scheduled_at)}</h4>
                                    <p className="text-xs text-slate-500 uppercase font-black tracking-wider mt-1">
                                        {apt.service_type === 'transport' ? '🚑 Traslado' : '🔧 Taller'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {(apt as any).profiles?.full_name && (
                                        <p className="text-xs font-bold text-slate-700 mb-0.5">{(apt as any).profiles.full_name}</p>
                                    )}
                                    <p className="text-[10px] text-slate-400 font-mono">{(apt as any).profiles?.phone || 'Sin teléfono'}</p>
                                </div>
                            </div>
                            
                            {apt.notes && (
                                <div className="bg-white p-2 rounded-lg text-[10px] text-slate-500 italic border border-slate-100 mb-2">
                                    "{apt.notes}"
                                </div>
                            )}

                            {/* Trip Details */}
                            {apt.service_type === 'transport' && apt.origin && (
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="bg-blue-50/50 p-2 rounded-lg text-[10px] border border-blue-50">
                                        <div className="font-bold text-blue-500 uppercase tracking-wider mb-0.5">Origen</div>
                                        <div className="text-slate-600 truncate" title={apt.origin}>{apt.origin}</div>
                                    </div>
                                    <div className="bg-rose-50/50 p-2 rounded-lg text-[10px] border border-rose-50">
                                        <div className="font-bold text-rose-500 uppercase tracking-wider mb-0.5">Destino</div>
                                        <div className="text-slate-600 truncate" title={apt.destination}>{apt.destination}</div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-1">
                                {(apt as any).payment_proof_url && (
                                    <a
                                        href={(apt as any).payment_proof_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-2 px-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                                        title="Ver Comprobante"
                                    >
                                        <span className="material-symbols-outlined text-sm">image</span>
                                    </a>
                                )}

                                {apt.status === 'pending' && (
                                    <>
                                        <button 
                                            onClick={() => updateStatus(apt.id, 'confirmed')}
                                            className="flex-1 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                                        >
                                            <Check size={14} strokeWidth={4} /> Confirmar Cupo
                                        </button>
                                        <button 
                                            onClick={() => updateStatus(apt.id, 'cancelled')}
                                            className="py-2 px-3 bg-rose-100 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-rose-200 transition-colors"
                                        >
                                            <X size={14} strokeWidth={4} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
