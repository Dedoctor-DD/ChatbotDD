import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Instagram, Facebook, Globe, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { generateUUID } from '../lib/utils';
import { GlobalNavbar } from './GlobalNavbar';

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
            const { data, error } = await supabase
                .from('partners')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            if (data) {
                setPartners([...data, ...data]);
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
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-start font-sans tracking-tight">
            {/* Animated Premium Background */}
            <div className="absolute inset-0 bg-slate-50">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/20 blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 blur-[100px] animate-pulse-slow [animation-delay:2s]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            </div>

            <GlobalNavbar onBack={onBack} showBackButton={!!onBack} />

            <div className="container relative z-10 px-4 pb-12 flex flex-col items-center" style={{ paddingTop: '150px' }}>
                
                {/* Main Glass Card */}
                <div className="w-full max-w-[420px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10 transform hover:scale-[1.005] transition-transform duration-500 ease-out flex flex-col items-center relative overflow-hidden group">
                    
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>

                    {/* Logo Area */}
                    <div className="w-24 h-24 mb-8 relative">
                        <div className="absolute inset-0 bg-blue-500/10 rounded-3xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                        <div className="absolute inset-0 bg-white rounded-3xl shadow-lg flex items-center justify-center border border-slate-100 overflow-hidden">
                             <img src="/logo.jpg" alt="DD Logo" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <div className="text-center mb-10 relative z-10">
                        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
                            Hola, Bienvenido
                            <span className="text-blue-600">.</span>
                        </h1>
                        <p className="text-slate-500 font-medium leading-relaxed text-sm px-4">
                            Accede a tu panel personal de <br/>
                            <span className="text-slate-800 font-bold">Transportes DeDoctor</span> & <span className="text-slate-800 font-bold">Taller MMC</span>
                        </p>
                    </div>

                    {/* Google Login Button - Redesigned */}
                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden bg-slate-900 hover:bg-slate-800 text-white transition-all duration-300 rounded-2xl p-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative flex items-center justify-between bg-slate-900 group-hover:bg-opacity-0 rounded-xl px-5 py-4 transition-all h-full">
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-2 rounded-lg shrink-0">
                                    {isLoading ? (
                                       <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                                    ) : (
                                       <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Continuar con</span>
                                    <span className="text-base font-bold text-white tracking-wide">Google Secure</span>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                    </button>

                    {/* Trust Badges */}
                    <div className="flex items-center justify-center gap-6 mt-8 pt-8 border-t border-slate-200/60 w-full">
                        <div className="flex flex-col items-center gap-2 group/icon cursor-default">
                             <div className="p-2 rounded-full bg-emerald-50 text-emerald-600 group-hover/icon:scale-110 transition-transform">
                                <ShieldCheck className="w-4 h-4" />
                             </div>
                             <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Datos Seguros</span>
                        </div>
                         <div className="w-px h-8 bg-slate-200"></div>
                        <div className="flex flex-col items-center gap-2 group/icon cursor-default">
                             <div className="p-2 rounded-full bg-amber-50 text-amber-500 group-hover/icon:scale-110 transition-transform">
                                <Zap className="w-4 h-4" />
                             </div>
                             <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Acceso Rápido</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 text-red-500 text-xs font-bold rounded-xl w-full text-center border border-red-100 animate-fade-in">
                            {error}
                        </div>
                    )}
                </div>

                {/* Dev/Test Tools */}
                {import.meta.env.DEV && (
                    <div className="mt-8 flex gap-3 opacity-60 hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => {
                                const mockSession = {
                                    access_token: 'mock_token_' + Date.now(),
                                    user: {
                                        id: generateUUID(),
                                        email: 'invitado@dedoctor.com',
                                        user_metadata: { full_name: 'Invitado de Prueba' }
                                    }
                                };
                                localStorage.setItem('dd_chatbot_test_session', JSON.stringify(mockSession));
                                window.location.reload();
                            }}
                            className="px-4 py-2 font-mono text-[10px] bg-slate-200 rounded-lg text-slate-600 hover:bg-slate-300"
                        >
                            DEV: Guest
                        </button>
                        <button
                            onClick={() => {
                                const mockSession = {
                                    access_token: 'mock_token_admin_' + Date.now(),
                                    user: {
                                        id: generateUUID(),
                                        email: 'dedoctor.transportes@gmail.com',
                                        user_metadata: { full_name: 'Admin Test', role: 'admin' }
                                    }
                                };
                                localStorage.setItem('dd_chatbot_test_session', JSON.stringify(mockSession));
                                window.location.reload();
                            }}
                            className="px-4 py-2 font-mono text-[10px] bg-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-300"
                        >
                            DEV: Admin
                        </button>
                    </div>
                )}

                {/* Footer Links */}
                <div className="mt-16 text-center">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-6">Confían en Dedoctor & MMC</p>
                    {partners.length > 0 && (
                        <div className="flex gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                             {partners.slice(0, 4).map((p, i) => (
                                 <img key={i} src={p.logo_url} alt={p.name} className="h-6 object-contain" title={p.name} />
                             ))}
                        </div>
                    )}
                    
                    <div className="flex gap-4 justify-center mt-10 mb-4">
                        <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-blue-600 hover:text-white transition-all"><Instagram className="w-4 h-4"/></a>
                        <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-blue-600 hover:text-white transition-all"><Facebook className="w-4 h-4"/></a>
                        <a href="https://dedoctor.cl" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-blue-600 hover:text-white transition-all"><Globe className="w-4 h-4"/></a>
                    </div>
                    <p className="text-[10px] text-slate-300 font-semibold">© 2025 Dedoctor Group. Secure Portal.</p>
                </div>

            </div>
        </div>
    );
}


