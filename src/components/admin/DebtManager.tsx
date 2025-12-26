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
                <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-100 text-center">
                    <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                    <p className="text-slate-400 font-bold text-xs">No hay deudas pendientes</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {debts.map((debt) => (
                        <div key={debt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-rose-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center font-black text-xs">
                                    {debt.profiles?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800">{debt.profiles?.full_name || 'Usuario Desconocido'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{debt.description}</p>
                                    <div className="flex gap-2 mt-1">
                                         <span className="text-[10px] text-slate-400">{new Date(debt.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-rose-500 mb-1">
                                    ${debt.amount.toLocaleString('es-CL')}
                                </p>
                                <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-colors">
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
