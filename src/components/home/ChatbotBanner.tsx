interface ChatbotBannerProps {
  onGoToChat: () => void;
}

export function ChatbotBanner({ onGoToChat }: ChatbotBannerProps) {
  return (
    <section className="px-6 mb-12">
      <button 
        onClick={onGoToChat}
        className="w-full bg-slate-900 rounded-[2.5rem] p-10 flex items-center justify-between text-white premium-shadow relative overflow-hidden group btn-haptic border border-white/5"
      >
        {/* Animated Orbs */}
        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-secondary/10 rounded-full blur-[100px] group-hover:bg-secondary/20 transition-all duration-1000"></div>
        <div className="absolute bottom-[-50%] left-[-10%] w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
             <div className="size-20 bg-white/5 backdrop-blur-2xl rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <span className="material-symbols-outlined text-4xl text-secondary selection:bg-none animate-float filled">smart_toy</span>
             </div>
             {/* Active Status Dot */}
             <div className="absolute -top-1 -right-1 size-4 bg-slate-900 rounded-full p-1 border border-white/10">
                <div className="size-full bg-emerald-500 rounded-full animate-pulse"></div>
             </div>
          </div>
          
          <div className="text-left space-y-1">
            <h4 className="font-black text-2xl tracking-tighter leading-none">Arise AI</h4>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] opacity-90">Sistemas Hiper-activos</span>
               <div className="size-1 bg-white/20 rounded-full"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">24/7/365</span>
            </div>
          </div>
        </div>

        <div className="size-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-slate-900 transition-all shadow-xl">
           <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">bolt</span>
        </div>
      </button>
    </section>
  );
}
