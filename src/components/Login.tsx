import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bot, Trash2 } from 'lucide-react';

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
            const redirectUrl = window.location.origin;
            console.log('Initiating OAuth login, redirecting to:', redirectUrl);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
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

                <div className="mt-6 text-center space-y-3">
                    {/* Botones válidos SOLO para desarrollo local */}
                    {import.meta.env.DEV && (
                        <>
                            <button
                                onClick={() => {
                                    const mockSession = {
                                        access_token: 'mock_token',
                                        user: {
                                            id: '11111111-1111-1111-1111-111111111111',
                                            email: 'invitado@dedoctor.com',
                                            user_metadata: {
                                                full_name: 'Invitado de Prueba',
                                                avatar_url: null
                                            }
                                        }
                                    };
                                    localStorage.setItem('dd_chatbot_test_session', JSON.stringify(mockSession));
                                    window.location.reload();
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1 mx-auto"
                            >
                                👻 Modo Invitado (Local)
                            </button>

                            <button
                                onClick={() => {
                                    const mockSession = {
                                        access_token: 'mock_token_admin',
                                        user: {
                                            id: '22222222-2222-2222-2222-222222222222',
                                            email: 'dedoctor.transportes@gmail.com', // Triggers isAdmin
                                            user_metadata: {
                                                full_name: 'Administrador (Test)',
                                                avatar_url: null,
                                                role: 'admin'
                                            }
                                        }
                                    };
                                    localStorage.setItem('dd_chatbot_test_session', JSON.stringify(mockSession));
                                    window.location.reload();
                                }}
                                className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-1 mx-auto"
                            >
                                👮 Modo Admin (Local)
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => {
                            if (window.confirm('¿Estás seguro de que deseas borrar los datos de sesión y caché?')) {
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.hash = '';
                                window.location.reload();
                            }
                        }}
                        className="mt-4 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-medium transition-all flex items-center justify-center gap-2 mx-auto active:scale-95"
                        title="Borrar datos de sesión"
                    >
                        <Trash2 className="w-3 h-3" />
                        <span>Reiniciar / Borrar Datos</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
