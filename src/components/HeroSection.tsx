
interface HeroSectionProps {
  onActionClick: () => void;
}

export const HeroSection = ({ onActionClick }: HeroSectionProps) => (
  <section id="hero" className="flex flex-col items-center text-center mb-16 pt-6">
    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/5 text-primary text-[0.7rem] font-black tracking-[0.2em] uppercase mb-8 shadow-sm border border-primary/10 animate-fade-in">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      Alianza Estratégica en Movilidad
    </div>
    <h2 className="text-3xl md:text-5xl font-black leading-tight text-slate-900 mb-6 tracking-tight">
      Te movemos. <br />
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-indigo-600">
        Te cuidamos.
      </span>
    </h2>
    <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-8 max-w-xl mx-auto font-medium px-4">
      Unimos la excelencia logística de <span className="text-slate-900 font-bold border-b-2 border-primary/20">
        Transportes DeDoctor
      </span> con la precisión técnica del <span className="text-slate-900 font-bold border-b-2 border-primary/20">
        Taller MMC
      </span> para ofrecerte seguridad total.
    </p>
    <div className="w-full max-w-sm space-y-4">
      <button
        onClick={onActionClick}
        className="w-full py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transform active:scale-95 transition-all flex items-center justify-center gap-3 border-none cursor-pointer group"
      >
        Solicitar Servicio Ahora
        <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </button>
      <button
        onClick={() => document.getElementById('mission')?.scrollIntoView({ behavior: 'smooth' })}
        className="w-full py-4 bg-white text-slate-400 hover:text-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm border border-slate-100 hover:border-primary/30 transform active:scale-95 transition-all cursor-pointer"
      >
        Explorar Misión & Visión
      </button>
    </div>
  </section>
);
