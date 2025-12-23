import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface RegisterProps {
    onBack: () => void;
    onSuccess: () => void;
}

export function Register({ onBack, onSuccess }: RegisterProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.confirm_password) {
            setError('Las contraseñas no coinciden');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name,
                    }
                }
            });

            if (error) throw error;

            // Successful registration
            onSuccess();
        } catch (err: any) {
            console.error('Error registering:', err);
            setError(err.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md px-6 pt-6 flex flex-col items-center flex-1 animate-fade-in">
             <div className="mb-8 text-center">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                    Crear Cuenta<span className="text-primary">.</span>
                </h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Únete a la movilidad inclusiva</p>
            </div>

            <div className="w-full bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-blue-500/10 border border-gray-50">
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                        <input
                            required
                            type="text"
                            placeholder="Ej: Juan Pérez"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                        <input
                            required
                            type="email"
                            placeholder="tucorreo@ejemplo.com"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                        <input
                            required
                            type="password"
                            placeholder="******"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div>
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                        <input
                            required
                            type="password"
                            placeholder="******"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.confirm_password}
                            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
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
                            'Registrarme'
                        )}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-400 font-bold tracking-widest text-[10px]">O regístrate con</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        // Re-use Google Login logic
                        const handleGoogle = async () => {
                            try {
                                const { error } = await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: window.location.origin,
                                    }
                                });
                                if (error) throw error;
                            } catch (err: any) {
                                console.error('Error logging in with Google:', err);
                                setError(err.message || 'Error al conectar con Google');
                            }
                        };
                        handleGoogle();
                    }}
                    className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest border border-gray-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70 active:scale-95 group mb-4"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Google</span>
                </button>

                 <div className="text-center">
                    <button 
                        type="button"
                        onClick={onBack}
                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                    >
                        ¿Ya tienes cuenta? Inicia Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
