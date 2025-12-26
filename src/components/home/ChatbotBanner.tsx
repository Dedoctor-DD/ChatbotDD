interface ChatbotBannerProps {
    onGoToChat: () => void;
  }
  
  export function ChatbotBanner({ onGoToChat }: ChatbotBannerProps) {
    return (
      <section className="px-6 mb-10">
        <button 
          onClick={onGoToChat}
          className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-4xl p-8 flex items-center justify-between text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group border-none transition-all active:scale-95"
        >
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl text-primary animate-pulse">smart_toy</span>
            </div>
            <div className="text-left">
              <h4 className="font-black text-lg tracking-tight uppercase leading-none mb-1">Arise AI</h4>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80">Asistente Virtual 24/7</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform relative z-10">
             <span className="material-symbols-outlined">arrow_forward</span>
          </div>
        </button>
      </section>
    );
  }
