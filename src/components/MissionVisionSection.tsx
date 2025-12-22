

export const MissionVisionSection = () => (
  <section id="mission" className="space-y-8 py-12 bg-background-light dark:bg-background-dark">
    <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2">
      {/* Misión */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-lg border border-gray-50 dark:border-gray-800 text-center">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto text-primary">
          <span className="material-symbols-outlined text-3xl">security</span>
        </div>
        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Misión DeDoctor</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Protocolos de transporte diseñados para preservar la dignidad y seguridad de cada paciente.
        </p>
      </div>
      {/* Visión */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-lg border border-gray-50 dark:border-gray-800 text-center">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto text-primary">
          <span className="material-symbols-outlined text-3xl">visibility</span>
        </div>
        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Visión DeDoctor</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Ser la referencia nacional en movilidad segura y accesible para personas con movilidad reducida.
        </p>
      </div>
    </div>
  </section>
);
