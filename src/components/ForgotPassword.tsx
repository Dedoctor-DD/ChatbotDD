import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ForgotPasswordProps {
    onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/#reset-password`, 
            });

            if (error) throw error;

            setMessage('Se ha enviado un correo de recuperación. Revisa tu bandeja de entrada.');
        } catch (err: any) {
            console.error('Error resetting password:', err);
            setError(err.message || 'Error al enviar la solicitud.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md px-6 pt-6 flex flex-col items-center flex-1 animate-fade-in">
             <div className="mb-8 text-center">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                    Recuperar<span className="text-primary">.</span>
                </h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Restablece tu acceso</p>
            </div>

            <div className="w-full bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-blue-500/10 border border-gray-50">
                {message ? (
                    <div className="text-center py-8">
                         <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                        </div>
                        <h3 className="text-lg font-black text-gray-800 mb-2">¡Correo Enviado!</h3>
                        <p className="text-sm text-gray-500 mb-6">{message}</p>
                        <button
                            onClick={onBack}
                            className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline"
                        >
                            Volver al inicio de sesión
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="mb-2">
                             <p className="text-xs text-gray-500 mb-4 text-center">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                            <input
                                required
                                type="email"
                                placeholder="tucorreo@ejemplo.com"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl text-center border border-rose-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-primary hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/40 transition-all flex items-center justify-center gap-2 border-none disabled:opacity-70 mt-4 active:scale-95"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Enviar Enlace'
                            )}
                        </button>
                    </form>
                )}

                 {!message && (
                    <div className="mt-6 text-center">
                        <button 
                            type="button"
                            onClick={onBack}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                        >
                            Cancelar y volver
                        </button>
                    </div>
                 )}
            </div>
        </div>
    );
}
