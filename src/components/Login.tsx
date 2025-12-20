import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Instagram, Facebook, Globe, Twitter } from 'lucide-react';
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
                // Duplicate data for infinite scroll effect if we have enough items
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" style={{ paddingTop: '100px' }}>
            {/* Global Navigation Bar */}
            <GlobalNavbar onBack={onBack} showBackButton={!!onBack} />

            <div className="flex flex-col items-center justify-center px-4 py-8">
                <div className="login-card z-20 max-w-md w-full">
                    <div className="login-logo-box">
                        <img src="/logo.jpg" alt="Logo" />
                    </div>

                    <h2 className="login-title">Dedoctor DD</h2>
                    <p className="login-subtitle">
                        Tu asistente virtual inteligente para transportes y mantenimiento.
                    </p>

                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="login-btn btn-google"
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner"></div>
                                <span>Conectando...</span>
                            </>
                        ) : (
                            <>
                                <img
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt="Google"
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <span>Continuar con Google</span>
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-xs text-red-400 font-medium">{error}</p>
                        </div>
                    )}

                    {import.meta.env.DEV && (
                        <div className="mt-6 flex flex-col gap-3">
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
                                className="login-btn-test text-[11px] uppercase font-black tracking-widest text-slate-600 hover:text-sky-600 transition-all py-3 border border-slate-200 rounded-xl bg-white hover:bg-sky-50 hover:border-sky-200 shadow-sm"
                            >
                                👻 Acceso Invitado
                            </button>

                            <button
                                onClick={() => {
                                    const mockSession = {
                                        access_token: 'mock_token_admin_' + Date.now(),
                                        user: {
                                            id: generateUUID(),
                                            email: 'dedoctor.transportes@gmail.com',
                                            user_metadata: { full_name: 'Administrador (Test)', role: 'admin' }
                                        }
                                    };
                                    localStorage.setItem('dd_chatbot_test_session', JSON.stringify(mockSession));
                                    window.location.reload();
                                }}
                                className="login-btn-test text-[11px] uppercase font-black tracking-widest text-slate-600 hover:text-purple-600 transition-all py-3 border border-slate-200 rounded-xl bg-white hover:bg-purple-50 hover:border-purple-200 shadow-sm"
                            >
                                👮 Acceso Admin
                            </button>
                        </div>
                    )}
                </div>

                {/* Partners Section - Compacta */}
                {partners.length > 0 && (
                    <div className="mt-12 w-full max-w-2xl text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
                            Empresas que confían en nosotros
                        </p>
                        
                        <div className="logoloop logoloop--fade logoloop--scale-hover">
                            <div className="logoloop__track">
                                <div className="logoloop__list">
                                    {partners.map((partner, idx) => (
                                        <div key={`${partner.id}-${idx}`} className="logoloop__item">
                                            <a href={partner.website_url || '#'} className="logoloop__link" target="_blank" rel="noopener noreferrer">
                                                <img src={partner.logo_url} alt={partner.name} title={partner.name} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Social Links - Compactos */}
                <div className="mt-8 flex gap-4 items-center justify-center">
                    <a href="https://instagram.com/dedoctor" className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-pink-500 hover:scale-110 transition-all">
                        <Instagram className="w-4 h-4" />
                    </a>
                    <a href="https://facebook.com/dedoctor" className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-blue-600 hover:scale-110 transition-all">
                        <Facebook className="w-4 h-4" />
                    </a>
                    <a href="https://twitter.com/dedoctor" className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-sky-500 hover:scale-110 transition-all">
                        <Twitter className="w-4 h-4" />
                    </a>
                    <a href="https://dedoctor.cl" className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all">
                        <Globe className="w-4 h-4" />
                    </a>
                </div>
                
                <p className="mt-6 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    © 2025 Dedoctor. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}


