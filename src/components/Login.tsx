import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateUUID } from '../lib/utils';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';

interface LoginProps {
    onBack?: () => void;
}

type AuthView = 'login' | 'register' | 'forgot';

export function Login({ onBack }: LoginProps) {
    const [view, setView] = useState<AuthView>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (window.location.hash && window.location.hash.includes('access_token')) {
            setIsLoading(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Credenciales incorrectas';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const redirectUrl = window.location.origin;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                }
            });

            if (error) throw error;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al conectar con Google';
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    if (view === 'register') {
        return (
            <div className="flex justify-center min-h-screen bg-white overflow-x-hidden font-jakarta relative">
                {/* Ambient Background */}
                <div className="hidden md:block fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow"></div>
                    <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow [animation-delay:3s]"></div>
                </div>
                <div className="w-full max-w-md bg-white min-h-screen md:min-h-[90vh] md:my-auto md:rounded-[3rem] relative shadow-2xl flex flex-col items-center z-10 border-x border-gray-100 transition-all duration-500 overflow-hidden">
                    <Register onBack={() => setView('login')} onSuccess={() => setView('login')} />
                </div>
            </div>
        );
    }

    if (view === 'forgot') {
        return (
            <div className="flex justify-center min-h-screen bg-white overflow-hidden font-jakarta relative">
                {/* Ambient Background */}
                 <div className="hidden md:block absolute inset-0 z-0">
                    <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow"></div>
                    <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow [animation-delay:3s]"></div>
                </div>
                <div className="w-full max-w-md bg-white min-h-screen md:min-h-[90vh] md:my-auto md:rounded-[3rem] relative shadow-2xl flex flex-col items-center z-10 border-x border-gray-100 transition-all duration-500 overflow-hidden">
                    <ForgotPassword onBack={() => setView('login')} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center min-h-screen bg-white overflow-x-hidden font-jakarta relative">
            {/* Ambient Background for PC */}
            <div className="hidden md:block fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow [animation-delay:3s]"></div>
            </div>

            <div className="w-full max-w-md bg-white min-h-screen md:min-h-[90vh] md:my-auto md:rounded-[3rem] relative shadow-2xl flex flex-col items-center z-10 border-x border-gray-100 transition-all duration-500 overflow-hidden">
                {/* Ambient Background Inside (Legacy) */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 blur-[100px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-primary/5 blur-[100px] rounded-full animate-pulse-slow [animation-delay:1.5s]"></div>

            <header className="w-full max-w-md flex justify-between items-center px-6 py-5 sticky top-0 z-50">
                <button
                  onClick={onBack}
                  className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-gray-600">arrow_back</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Portal Seguro</span>
                </div>
                <div className="w-10"></div>
            </header>

            <main className="w-full max-w-md px-6 pt-6 flex flex-col items-center flex-1">
                {/* Brand Identity */}
                <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-6 border border-gray-100 overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
                         <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                        Bienvenido<span className="text-primary">.</span>
                    </h1>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mt-2">Identifícate para continuar</p>
                </div>

                {/* Login Card */}
                <div className="w-full bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-blue-500/10 border border-gray-50">
                    <form onSubmit={handleLogin} className="space-y-4 mb-6">
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
                                <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-bold text-primary hover:underline">
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

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-400 font-bold tracking-widest text-[10px]">O continúa con</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest border border-gray-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70 active:scale-95 group"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Google</span>
                    </button>

                    {error && (
                        <div className="mt-4 p-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl text-center border border-rose-100 animate-shake">
                            {error}
                        </div>
                    )}
                    
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-500 font-medium">
                            ¿No tienes cuenta?{' '}
                            <button
                                onClick={() => setView('register')}
                                className="text-primary font-black hover:underline"
                            >
                                Regístrate aquí
                            </button>
                        </p>
                    </div>
                </div>

                {/* Dev Tools - Only in Dev */}
                {import.meta.env.DEV && (
                    <div className="mt-8 mb-4 flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
                         <button
                            onClick={() => {
                                const mockSession = { access_token: 'tk', user: { id: generateUUID(), email: 'dedoctor.transportes@gmail.com', user_metadata: { full_name: 'Admin Test' } } };
                                localStorage.setItem('dd_chatbot_test_session', JSON.stringify(mockSession));
                                window.location.reload();
                            }}
                            className="px-3 py-1.5 bg-blue-100 text-[10px] font-mono rounded-lg text-blue-600 uppercase font-bold tracking-wider"
                        >
                            Dev Admin
                        </button>
                    </div>
                )}
            </main>
        </div>
        </div>
    );
}


