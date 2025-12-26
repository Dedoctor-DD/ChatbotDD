interface ServicesGridProps {
    onServiceSelect: (service: 'transport' | 'workshop') => void;
  }
  
  export function ServicesGrid({ onServiceSelect }: ServicesGridProps) {
    return (
      <section className="px-6 mb-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            Nuestros Servicios
            <div className="h-px flex-1 bg-slate-100"></div>
        </h3>
        <div className="grid grid-cols-2 gap-5">
          <button 
            onClick={() => onServiceSelect('transport')}
            className="bg-white p-8 rounded-5xl shadow-2xl shadow-slate-200/50 border border-slate-50 text-left group active:scale-95 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="w-14 h-14 bg-blue-50/50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:rotate-6 transition-all relative z-10">
              <span className="material-symbols-outlined text-3xl filled">ambulance</span>
            </div>
            <h4 className="font-black text-slate-900 text-sm tracking-tight uppercase">Transporte</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Traslado Seguro</p>
          </button>
  
          <button 
            onClick={() => onServiceSelect('workshop')}
            className="bg-white p-8 rounded-5xl shadow-2xl shadow-slate-200/50 border border-slate-50 text-left group active:scale-95 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="w-14 h-14 bg-orange-50/50 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:rotate-6 transition-all relative z-10">
              <span className="material-symbols-outlined text-3xl filled">build</span>
            </div>
            <h4 className="font-black text-slate-900 text-sm tracking-tight uppercase">Taller MMc</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Técnico experto</p>
          </button>
        </div>
      </section>
    );
  }
