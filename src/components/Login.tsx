import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bot, Loader2 } from 'lucide-react';

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

                <div className="login-divider">
                    <span className="divider-text" style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '0 8px', borderRadius: '4px' }}>
                        opciones de prueba
                    </span>
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
                    className="login-btn btn-test"
                >
                    <span>🧪 Ingresar sin cuenta (Demo)</span>
                </button>

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-xs text-red-400 font-medium">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
