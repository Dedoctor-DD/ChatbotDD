


export const MissionVisionSection = () => (
  <section id="mission" className="space-y-12 py-16 bg-white relative">
    <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-2 px-6">
      {/* Misión */}
      <div className="group bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-50 transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/10">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 text-primary group-hover:scale-110 transition-transform duration-500">
          <span className="material-symbols-outlined text-4xl filled">security</span>
        </div>
        <h4 className="font-black text-xl text-slate-900 mb-4 tracking-tight uppercase">Misión DeDoctor</h4>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">
          Protocolos de transporte diseñados para preservar la dignidad y seguridad de cada paciente, garantizando excelencia en cada kilómetro.
        </p>
      </div>

      {/* Visión */}
      <div className="group bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-50 transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/10">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 text-primary group-hover:scale-110 transition-transform duration-500">
          <span className="material-symbols-outlined text-4xl filled">visibility</span>
        </div>
        <h4 className="font-black text-xl text-slate-900 mb-4 tracking-tight uppercase">Visión DeDoctor</h4>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">
          Ser la referencia nacional en movilidad segura y accesible, liderando la transformación del transporte para personas con movilidad reducida.
        </p>
      </div>
    </div>
  </section>
);
