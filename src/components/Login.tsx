import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateUUID } from '../lib/utils';

interface Partner {
    id: string;
    name: string;
    logo_url: string;
    website_url: string;
}

interface LoginProps {
    onBack?: () => void;
}

export function Login({ onBack }: LoginProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [partners, setPartners] = useState<Partner[]>([]);

    useEffect(() => {
        if (window.location.hash && window.location.hash.includes('access_token')) {
            setIsLoading(true);
        }
        loadPartners();
    }, []);

    const loadPartners = async () => {
        try {
            const { data } = await supabase
                .from('partners')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
            
            if (data) {
                setPartners([...data]);
            }
        } catch (err) {
            console.error('Error loading partners:', err);
        }
    };

    const handleLogin = async () => {
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
        } catch (err: any) {
            console.error('Error logging in:', err);
            setError(err.message || 'Error al iniciar sesión');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark relative overflow-hidden flex flex-col items-center">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 blur-[100px] rounded-full animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-primary/5 blur-[100px] rounded-full animate-pulse-slow [animation-delay:1.5s]"></div>

            <header className="w-full max-w-md flex justify-between items-center px-6 py-5 sticky top-0 z-50">
                <button 
                  onClick={onBack}
                  className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-md flex items-center justify-center border border-gray-100 dark:border-gray-800"
                >
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Portal Seguro</span>
                </div>
                <div className="w-10"></div>
            </header>

            <main className="w-full max-w-md px-6 pt-10 flex flex-col items-center flex-1">
                {/* Brand Identity */}
                <div className="mb-12 text-center">
                    <div className="w-20 h-20 bg-white dark:bg-surface-dark rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-6 border border-gray-100 dark:border-gray-800 overflow-hidden transform rotate-3">
                         <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                        Bienvenido<span className="text-primary">.</span>
                    </h1>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mt-2">Identifícate para continuar</p>
                </div>

                {/* Login Card */}
                <div className="w-full bg-white dark:bg-surface-dark rounded-[2.5rem] p-8 shadow-2xl shadow-blue-500/10 border border-gray-50 dark:border-gray-800">
                    <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                        Accede a tu cuenta de <span className="font-bold text-gray-800 dark:text-white">DeDoctor & MMC</span> para gestionar tus traslados y servicios técnicos.
                    </p>

                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full h-16 bg-primary hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/40 transition-all flex items-center justify-center gap-4 border-none disabled:opacity-70 group overflow-hidden relative"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <div className="p-2 bg-white rounded-lg shrink-0">
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                </div>
                                <span className="relative z-10">Entrar con Google</span>
                                <span className="material-symbols-outlined relative z-10 text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-xl text-center border border-rose-100 dark:border-rose-800">
                            {error}
                        </div>
                    )}

                    {/* Trust Indicators */}
                    <div className="grid grid-cols-2 gap-4 mt-10 pt-8 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col items-center gap-1.5">
                            <span className="material-symbols-outlined text-green-500 filled">verified_user</span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Encriptado SSL</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                            <span className="material-symbols-outlined text-blue-500 filled">bolt</span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Acceso Directo</span>
                        </div>
                    </div>
                </div>

                {/* Partner Logos */}
                <div className="mt-16 w-full opacity-40">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] text-center mb-6">Operando con los más altos estándares</p>
                    <div className="flex flex-wrap justify-center gap-8 grayscale">
                        {partners.slice(0, 3).map((p, i) => (
                            <img key={i} src={p.logo_url} alt={p.name} className="h-5 object-contain" />
                        ))}
                    </div>
                </div>

                {/* Dev Tools */}
                {import.meta.env.DEV && (
                    <div className="fixed bottom-6 flex gap-2">
                        <button
                            onClick={() => {
                                const mockSession = { access_token: 'tk', user: { id: generateUUID(), email: 'user@test.com', user_metadata: { full_name: 'Usuario Test' } } };
                                localStorage.setItem('dd_chatbot_test_session', JSON.stringify(mockSession));
                                window.location.reload();
                            }}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-[10px] font-mono rounded-lg"
                        >
                            Guest
                        </button>
                        <button
                            onClick={() => {
                                const mockSession = { access_token: 'tk', user: { id: generateUUID(), email: 'dedoctor.transportes@gmail.com', user_metadata: { full_name: 'Admin Test' } } };
                                localStorage.setItem('dd_chatbot_test_session', JSON.stringify(mockSession));
                                window.location.reload();
                            }}
                            className="px-3 py-1.5 bg-blue-200 dark:bg-blue-900 text-[10px] font-mono rounded-lg text-blue-600"
                        >
                            Admin
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}


