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
                        <div key={debt.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:border-rose-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                            {/* User & Description */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 text-rose-500 flex items-center justify-center font-black text-lg shadow-inner">
                                    {debt.profiles?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base leading-none mb-1">{debt.profiles?.full_name || 'Usuario Desconocido'}</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{debt.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                         <span className="material-symbols-outlined text-[12px] text-slate-300">calendar_today</span>
                                         <span className="text-[10px] text-slate-400 font-bold">{new Date(debt.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Price & Action */}
                            <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                                <div>
                                    <p className="text-xs text-slate-400 md:hidden font-bold uppercase tracking-widest mb-0.5">Monto</p>
                                    <p className="text-lg font-black text-rose-600 tracking-tight">
                                        ${debt.amount.toLocaleString('es-CL')}
                                    </p>
                                </div>
                                <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">notifications</span>
                                    Notificar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
