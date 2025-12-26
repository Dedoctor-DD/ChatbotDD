interface LoginHeaderProps {
    onBack?: () => void;
}

export function LoginHeader({ onBack }: LoginHeaderProps) {
    return (
        <>
            <header className="w-full max-w-md flex justify-between items-center px-6 py-5 sticky top-0 z-50">
                <button
                  onClick={onBack}
                  className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-gray-600">arrow_back</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Portal Seguro</span>
                </div>
                <div className="w-10"></div>
            </header>

            <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-6 border border-gray-100 overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
                     <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                    Bienvenido<span className="text-primary">.</span>
                </h1>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mt-2">Identifícate para continuar</p>
            </div>
        </>
    );
}
