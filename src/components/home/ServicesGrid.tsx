interface ServicesGridProps {
  onServiceSelect: (service: 'transport' | 'workshop') => void;
}

export function ServicesGrid({ onServiceSelect }: ServicesGridProps) {
  return (
    <section className="px-6 mb-12">
      <div className="flex items-center justify-between mb-8 group/title">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
          Servicios Disponibles
          <div className="h-px w-12 bg-slate-200 group-hover/title:w-20 transition-all duration-500"></div>
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <button 
          onClick={() => onServiceSelect('transport')}
          className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 text-left group btn-haptic relative overflow-hidden flex flex-col items-start"
        >
          {/* Surface Detail */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors duration-500 blur-2xl"></div>
          
          <div className="size-16 bg-blue-50/80 rounded-3xl flex items-center justify-center text-secondary mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-all ring-1 ring-blue-100 shadow-lg shadow-blue-500/5">
            <span className="material-symbols-outlined text-3xl filled">emergency_share</span>
          </div>
          
          <div className="mt-auto">
            <h4 className="font-black text-slate-900 text-sm md:text-base leading-tight uppercase tracking-tight mb-1">Traslados</h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-80">Logística Médica</p>
          </div>
          
          <div className="mt-6 flex items-center gap-1.5">
            <div className="size-1 bg-secondary rounded-full"></div>
            <p className="text-[8px] font-black text-secondary uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">Sistema Activo</p>
          </div>
        </button>

        <button 
          onClick={() => onServiceSelect('workshop')}
          className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 text-left group btn-haptic relative overflow-hidden flex flex-col items-start"
        >
          {/* Surface Detail */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors duration-500 blur-2xl"></div>
          
          <div className="size-16 bg-amber-50/80 rounded-3xl flex items-center justify-center text-amber-600 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all ring-1 ring-amber-100 shadow-lg shadow-amber-500/5">
            <span className="material-symbols-outlined text-3xl filled">engineering</span>
          </div>
          
          <div className="mt-auto">
            <h4 className="font-black text-slate-900 text-sm md:text-base leading-tight uppercase tracking-tight mb-1">Taller MMc</h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-80">Soporte Técnico</p>
          </div>

          <div className="mt-6 flex items-center gap-1.5">
            <div className="size-1 bg-amber-500 rounded-full"></div>
            <p className="text-[8px] font-black text-amber-600 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">Ingeniería</p>
          </div>
        </button>
      </div>
    </section>
  );
}
