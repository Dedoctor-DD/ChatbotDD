import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Loader2 } from 'lucide-react';

export function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verificar si hay una sesión activa al cargar
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // Si ya hay sesión, no hacer nada (el App.tsx manejará el redirect)
                console.log('Sesión activa encontrada');
            }
        });
    }, []);

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            if (error) {
                console.error('Error logging in:', error);
                setError(error.message || 'Error al iniciar sesión con Google');
                setIsLoading(false);
            }
            // Si no hay error, el usuario será redirigido a Google
            // No necesitamos hacer setIsLoading(false) aquí porque la página cambiará
        } catch (err: any) {
            console.error('Error logging in:', err);
            setError(err.message || 'Error al iniciar sesión con Google');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 text-center border border-slate-700">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LogIn className="w-8 h-8 text-blue-500" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a DD Chatbot</h2>
                <p className="text-slate-400 mb-8">Inicia sesión con Google para comenzar a usar DD Chatbot.</p>

                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin text-gray-900" />
                            <span>Conectando...</span>
                        </>
                    ) : (
                        <>
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google logo"
                                className="w-5 h-5"
                            />
                            Continuar con Google
                        </>
                    )}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-800 text-slate-500">O ingresa como invitado</span>
                    </div>
                </div>

                <button
                    onClick={() => {
                        const testSession = {
                            user: {
                                id: 'test-user-id',
                                email: 'usuario_prueba@ejemplo.com',
                                user_metadata: {
                                    full_name: 'Usuario de Prueba',
                                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                                    role: 'admin' // Force admin for testing
                                }
                            }
                        };
                        localStorage.setItem('dd_chatbot_test_session', JSON.stringify(testSession));
                        window.location.reload();
                    }}
                    className="w-full flex items-center justify-center gap-3 bg-slate-700 border border-slate-600 hover:bg-slate-600 text-slate-200 font-medium py-3 px-4 rounded-xl transition-all text-sm group"
                >
                    <span className="group-hover:scale-110 transition-transform">🧪</span>
                    Modo Pruebas (Sin Login)
                </button>

                {error && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
