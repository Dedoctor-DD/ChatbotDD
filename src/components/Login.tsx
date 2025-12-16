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
        <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-slate-700/50">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/5 rotate-3">
                    <LogIn className="w-8 h-8 text-blue-500" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">Bienvenido</h2>
                <p className="text-slate-400 mb-8 text-sm leading-relaxed px-4">
                    Tu asistente virtual inteligente para servicios de transporte y mantenimiento.
                </p>

                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mb-6 active:scale-[0.98]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                            <span>Conectando...</span>
                        </>
                    ) : (
                        <>
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google logo"
                                className="w-5 h-5 shrink-0"
                            />
                            <span>Continuar con Google</span>
                        </>
                    )}
                </button>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider font-medium">
                        <span className="px-3 bg-slate-900/0 backdrop-blur-sm text-slate-500 rounded-full">O prueba sin cuenta</span>
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
                                    role: 'admin'
                                }
                            }
                        };
                        localStorage.setItem('dd_chatbot_test_session', JSON.stringify(testSession));
                        window.location.reload();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700 text-slate-300 font-medium py-3 px-4 rounded-xl transition-all text-sm hover:border-slate-500 group active:scale-[0.98]"
                >
                    <span className="group-hover:rotate-12 transition-transform duration-300 text-base">🧪</span>
                    <span>Ingresar modo pruebas</span>
                </button>

                {error && (
                    <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-shake">
                        <p className="text-xs text-red-400 font-medium">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
