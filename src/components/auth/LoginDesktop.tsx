import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { generateUUID } from '../../lib/utils';
import { Register } from '../Register';
import { ForgotPassword } from '../ForgotPassword';
import { LoginHeader } from './LoginHeader';
import { LoginForm } from './LoginForm';
import { GoogleLoginBtn } from './GoogleLoginBtn';

interface LoginProps {
    onBack?: () => void;
}

type AuthView = 'login' | 'register' | 'forgot';

export function LoginDesktop({ onBack }: LoginProps) {
    const [view, setView] = useState<AuthView>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (window.location.hash && window.location.hash.includes('access_token')) {
            setIsLoading(true);
        }
    }, []);

    const handleLogin = async (email: string, pass: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: pass
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

    // Shared wrapper for desktop forms to keep them centered and elegant
    const DesktopWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className="flex justify-center items-center min-h-screen bg-slate-50 font-jakarta relative overflow-y-auto">
             {/* Ambient Background for PC - Enhanced */}
             <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full animate-pulse-slow [animation-delay:3s]"></div>
            </div>

            <div className="w-full max-w-4xl bg-white min-h-[600px] rounded-[3rem] relative shadow-2xl flex z-10 border border-slate-100 overflow-hidden">
                 {/* Left Side - Image/Brand */}
                 <div className="w-1/2 bg-slate-900 relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-primary/40"></div>
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                             <img src="/icon-192.png" alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                            Gestión Inteligente <br/> <span className="text-blue-400">DeDoctor & MMC</span>
                        </h2>
                    </div>

                    <div className="relative z-10">
                         <p className="text-slate-400 text-xs font-medium leading-relaxed">
                            Plataforma integral para gestión de flotas, mantenimiento y servicios técnicos. Potenciada por Inteligencia Artificial.
                         </p>
                    </div>
                 </div>

                 {/* Right Side - Form */}
                 <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-12 bg-white relative">
                    {children}
                 </div>
            </div>
        </div>
    );

    if (view === 'register') {
        return (
            <DesktopWrapper>
                <div className="w-full max-w-sm">
                    <Register onBack={() => setView('login')} onSuccess={() => setView('login')} />
                </div>
            </DesktopWrapper>
        );
    }

    if (view === 'forgot') {
        return (
            <DesktopWrapper>
                <div className="w-full max-w-sm">
                     <ForgotPassword onBack={() => setView('login')} />
                </div>
            </DesktopWrapper>
        );
    }

    return (
        <DesktopWrapper>
             <div className="w-full max-w-sm flex flex-col items-center">
                <LoginHeader onBack={onBack} />
                
                <div className="w-full mt-8">
                    <LoginForm 
                        onLogin={handleLogin} 
                        onForgotPassword={() => setView('forgot')} 
                        isLoading={isLoading} 
                    />

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 text-slate-400 font-bold tracking-widest text-[10px]">O continúa con</span>
                        </div>
                    </div>

                    <GoogleLoginBtn onClick={handleGoogleLogin} isLoading={isLoading} />

                     {error && (
                        <div className="mt-6 p-4 bg-rose-50 text-rose-600 text-[11px] font-black uppercase tracking-widest rounded-xl text-center border border-rose-100 animate-shake shadow-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500 font-medium">
                            ¿No tienes cuenta?{' '}
                            <button
                                onClick={() => setView('register')}
                                className="text-primary font-black hover:underline transition-all"
                            >
                                Regístrate aquí
                            </button>
                        </p>
                    </div>

                    {/* Dev Tools */}
                    {import.meta.env.DEV && (
                        <div className="mt-8 flex justify-center opacity-30 hover:opacity-100 transition-opacity">
                             <button
                                onClick={() => {
                                    const mockSession = { access_token: 'tk', user: { id: generateUUID(), email: 'dedoctor.transportes@gmail.com', user_metadata: { full_name: 'Admin Test' } } };
                                    localStorage.setItem('dd_chatbot_test_session', JSON.stringify(mockSession));
                                    window.location.reload();
                                }}
                                className="px-3 py-1 bg-slate-100 text-[9px] font-mono rounded text-slate-500 uppercase font-bold tracking-wider"
                            >
                                Dev Admin
                            </button>
                        </div>
                    )}
                </div>
             </div>
        </DesktopWrapper>
    );
}
