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

export function LoginMobile({ onBack }: LoginProps) {
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

    if (view === 'register') {
        return (
            <div className="flex justify-center h-[100dvh] bg-white overflow-hidden font-jakarta relative">
                <div className="w-full bg-white h-full relative flex flex-col items-center z-10 transition-all duration-500 overflow-y-auto custom-scrollbar">
                    <Register onBack={() => setView('login')} onSuccess={() => setView('login')} />
                </div>
            </div>
        );
    }

    if (view === 'forgot') {
        return (
            <div className="flex justify-center h-[100dvh] bg-white overflow-hidden font-jakarta relative">
                <div className="w-full bg-white h-full relative flex flex-col items-center z-10 transition-all duration-500 overflow-y-auto custom-scrollbar">
                    <ForgotPassword onBack={() => setView('login')} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center h-[100dvh] bg-white overflow-hidden font-jakarta relative">
            <div className="w-full bg-white h-full relative flex flex-col items-center z-10 transition-all duration-500 overflow-y-auto custom-scrollbar pb-safe">
                {/* Ambient Background Inside (Mobile Optimized) */}
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 blur-[80px] rounded-full animate-pulse-slow pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary/5 blur-[80px] rounded-full animate-pulse-slow [animation-delay:1.5s] pointer-events-none"></div>

                <LoginHeader onBack={onBack} />

                <main className="w-full px-6 flex flex-col items-center flex-1 mb-8">
                    {/* Login Card Mobile - Transparent/Flat */}
                    <div className="w-full bg-transparent p-4">
                        <LoginForm 
                            onLogin={handleLogin} 
                            onForgotPassword={() => setView('forgot')} 
                            isLoading={isLoading} 
                        />

                        <div className="relative mb-6 mt-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-400 font-bold tracking-widest text-[10px]">O continúa con</span>
                            </div>
                        </div>

                        <GoogleLoginBtn onClick={handleGoogleLogin} isLoading={isLoading} />

                        {error && (
                            <div className="mt-4 p-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl text-center border border-rose-100 animate-shake">
                                {error}
                            </div>
                        )}
                        
                        <div className="mt-8 text-center pb-8">
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
                        <div className="mt-4 mb-4 flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
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
