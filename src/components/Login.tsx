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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LogIn className="w-8 h-8 text-blue-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido a DD Chatbot</h2>
                <p className="text-gray-500 mb-8">Inicia sesión con Google para comenzar a usar DD Chatbot.</p>

                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
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
                
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
