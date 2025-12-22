import { supabase } from '../lib/supabase';

interface ProfilePanelProps {
    userName: string;
    userEmail: string;
    onLogout: () => void;
}

export function ProfilePanel({ userName, userEmail, onLogout }: ProfilePanelProps) {
    return (
        <div className="flex flex-col w-full min-h-full bg-background-light dark:bg-background-dark pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center px-6 h-16 justify-center">
                    <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Mi Perfil</h1>
                </div>
            </header>

            <main className="flex-1 flex flex-col p-6 animate-fade-in">
                {/* Profile Card */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group mb-4">
                        <div className="bg-primary/10 rounded-full h-28 w-28 flex items-center justify-center border-4 border-white dark:border-surface-dark shadow-xl">
                             <span className="material-symbols-outlined text-primary text-5xl">person</span>
                        </div>
                        <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-surface-dark flex items-center justify-center active:scale-95 transition-transform">
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{userName}</h2>
                        <p className="text-xs text-primary font-black uppercase tracking-widest mt-1">Miembro Activo</p>
                    </div>
                </div>

                {/* Info Sections */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-2">Información de Cuenta</h3>
                    
                    <div className="bg-white dark:bg-surface-dark rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 dark:border-gray-800/50 flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                                <span className="material-symbols-outlined text-xl">mail</span>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Email</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{userEmail}</p>
                            </div>
                        </div>

                        <div className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                                <span className="material-symbols-outlined text-xl">verified_user</span>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Estado</p>
                                <p className="text-sm font-bold text-green-600">Verificado</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings / Actions */}
                <div className="mt-8 space-y-3">
                    <button className="w-full h-14 bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-3">
                             <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">settings</span>
                             <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Ajustes</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                    </button>

                    <button className="w-full h-14 bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-3">
                             <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">help</span>
                             <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Soporte</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                    </button>
                    
                    <button 
                        onClick={onLogout}
                        className="w-full h-14 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 flex items-center justify-center gap-3 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all mt-4"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Cerrar Sesión
                    </button>
                </div>
            </main>
        </div>
    );
}
