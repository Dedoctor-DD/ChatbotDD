import { useState, useEffect } from 'react';
import { PhotoGallery } from './PhotoGallery';
import { HeroSection } from './HeroSection';
import { MissionVisionSection } from './MissionVisionSection';
import { PromoPopup } from './PromoPopup';


interface LandingPageProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowPromo(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex justify-center h-[100dvh] bg-white overflow-hidden font-jakarta relative">
      <PromoPopup isOpen={showPromo} onClose={() => setShowPromo(false)} />
      {/* Ambient Background for PC */}
      <div className="hidden md:block absolute inset-0 z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow [animation-delay:3s]"></div>
      </div>

      <main className="w-full bg-white h-[100dvh] max-h-[100dvh] relative overflow-hidden flex flex-col z-10 transition-all duration-500">
      <header className="w-full bg-white/60 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-lg relative overflow-hidden group">
            <img src="/icon-192.png" alt="DeDoctor" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-[11px] uppercase tracking-[0.2em] leading-tight text-slate-800">
              DeDoctor <span className="text-primary font-black">&</span> MMC
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Grupo de Movilidad</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
            onClick={() => setShowPromo(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-primary transition-all active:scale-95"
            >
            <span className="material-symbols-outlined text-sm">campaign</span>
            <span className="hidden sm:inline">Novedades</span>
            </button>
            <button 
            onClick={onLoginClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition shadow-xl shadow-primary/20 border-none active:scale-95"
            >
            <span className="material-symbols-outlined text-sm">person</span>
            Acceso
            </button>
        </div>
        </div>
      </header>

      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden pt-4 pb-8 scroll-smooth no-scrollbar">
        <div className="flex flex-col px-6 max-w-7xl mx-auto w-full">
          <HeroSection onActionClick={onLoginClick} />
          
          <div id="details">
            <MissionVisionSection />
          </div>

          {/* Photo Gallery Section */}
          <section className="mb-8 md:mb-16">
             <header className="mb-6 md:mb-8 px-2">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">Nuestra <span className="text-primary">Flota</span></h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Excelencia en cada unidad</p>
             </header>
             <PhotoGallery />
          </section>


        </div>





        <footer className="w-full border-t border-slate-50 bg-white mt-10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col items-center gap-6">
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-100 active:scale-90 shadow-sm overflow-hidden group">
                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">social_leaderboard</span>
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://wa.me/56933003113" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-100 active:scale-90 shadow-sm overflow-hidden group">
                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">chat</span>
                <span className="sr-only">WhatsApp</span>
              </a>
            </div>
            <div className="text-center">
              <p className="text-[0.65rem] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">
                © {new Date().getFullYear()} Grupo DeDoctor & MMC
              </p>
              <p className="text-[0.6rem] text-slate-300 font-bold uppercase tracking-widest">
                Comprometidos con la Movilidad Inclusiva
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
    </div>
  );
}
