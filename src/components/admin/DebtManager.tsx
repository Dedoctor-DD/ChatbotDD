import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Debt, Profile } from '../../types';

interface DebtWithProfile extends Debt {
    profiles: Profile;
}

export function DebtManager() {
    const [debts, setDebts] = useState<DebtWithProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDebts();
    }, []);

    const fetchDebts = async () => {
        try {
            const { data, error } = await supabase
                .from('client_debts')
                .select('*, profiles(full_name, email, phone)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setDebts(data as any);
        } catch (error) {
            console.error('Error fetching debts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
         return <div className="p-8 text-center text-slate-400">Cargando deudas...</div>;
    }

    return (
        <div className="space-y-4">
            <header className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">Cobranza Pendiente</h3>
                <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {debts.length} Pendientes
                </span>
            </header>

            {debts.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-100 text-center animate-pulse">
                    <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                    </div>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sin cobranzas pendientes</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {debts.map((debt) => (
                        <div key={debt.id} className="relative bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] overflow-hidden transition-all duration-300 hover:shadow-xl group p-5 flex flex-col gap-4">
                            {/* User & Info Row */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-rose-500/20">
                                    {debt.profiles?.full_name?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-800 text-base leading-tight truncate">{debt.profiles?.full_name || 'Usuario Desconocido'}</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5 truncate">{debt.description}</p>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                         <span className="material-symbols-outlined text-[14px] text-rose-300">event</span>
                                         <span className="text-[10px] text-slate-400 font-bold">{new Date(debt.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider Dot Line */}
                            <div className="border-t border-slate-50 border-dashed" />

                            {/* Bottom Row: Amount & Action */}
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em]">Deuda Total</span>
                                    <span className="text-xl font-black text-rose-600 tracking-tighter">
                                        ${debt.amount.toLocaleString('es-CL')}
                                    </span>
                                </div>
                                <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">send_time_extension</span>
                                    Cobrar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
