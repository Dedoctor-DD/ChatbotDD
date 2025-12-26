import { useState } from 'react';

interface LoginFormProps {
    onLogin: (email: string, pass: string) => Promise<void>;
    onForgotPassword: () => void;
    isLoading: boolean;
}

export function LoginForm({ onLogin, onForgotPassword, isLoading }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
             <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <input
                    required
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div>
                 <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                    <button type="button" onClick={onForgotPassword} className="text-[10px] font-bold text-primary hover:underline">
                        ¿Olvidaste tu clave?
                    </button>
                 </div>
                <input
                    required
                    type="password"
                    placeholder="************"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 border-none disabled:opacity-70 active:scale-95"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    'Iniciar Sesión'
                )}
            </button>
        </form>
    );
}
