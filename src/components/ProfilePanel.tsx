
export interface ProfilePanelProps {
    name: string;
    email: string;
    logoutHandler: () => void;
    onThemeToggle: () => void;
}

export function ProfilePanel({ name, email, logoutHandler, onThemeToggle }: ProfilePanelProps) {
    return (
        <div className="flex flex-col w-full min-h-full bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center px-6 h-16 justify-center">
                    <h1 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Mi Perfil</h1>
                </div>
            </header>

            <main className="flex-1 flex flex-col p-6 animate-fade-in pb-10">
                {/* Profile Card */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group mb-4">
                        <div className="bg-primary/10 rounded-full h-28 w-28 flex items-center justify-center border-4 border-white shadow-xl">
                             <span className="material-symbols-outlined text-primary text-5xl">person</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{name}</h2>
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Usuario Verificado</p>
                    </div>
                </div>

                {/* Info Sections */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-3">Cuenta</h3>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <span className="material-symbols-outlined text-xl">mail</span>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Email Registrado</p>
                                    <p className="text-sm font-bold text-gray-800">{email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-8">
                    <button 
                        onClick={logoutHandler}
                        className="w-full h-14 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-center gap-3 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Cerrar Sesión
                    </button>
                </div>
                <div className="mt-4">
                    <button 
                        onClick={onThemeToggle}
                        className="w-full h-14 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center gap-3 text-gray-600 font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">dark_mode</span>
                        Cambiar Tema
                    </button>
                </div>
            </main>
        </div>
    );
}
