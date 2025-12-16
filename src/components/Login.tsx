import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bot } from 'lucide-react';

export function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verificar si hay una sesión activa o si estamos volviendo de OAuth
    useEffect(() => {
        // Si hay un hash con access_token, estamos volviendo de Google
        if (window.location.hash && window.location.hash.includes('access_token')) {
            setIsLoading(true);
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
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
        } catch (err: any) {
            console.error('Error logging in:', err);
            setError(err.message || 'Error al iniciar sesión con Google');
            setIsLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            {/* Background Orbs */}
            <div className="login-bg-glow glow-blue"></div>
            <div className="login-bg-glow glow-indigo"></div>

            <div className="login-card">
                <div className="login-logo-box">
                    <Bot className="w-8 h-8 text-blue-400" />
                </div>

                <h2 className="login-title">DD Chatbot</h2>
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

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            localStorage.clear();
                            sessionStorage.clear();
                            window.location.hash = '';
                            window.location.reload();
                        }}
                        className="text-xs text-gray-400 hover:text-white transition-colors underline"
                    >
                        ¿Problemas de conexión? Borrar datos
                    </button>
                </div>
            </div>
        </div>
    );
}
