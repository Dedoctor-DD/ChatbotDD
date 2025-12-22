
import { Link } from 'react-router-dom';

export const HeroSection = () => (
  <section id="hero" className="flex flex-col items-center text-center mb-10">
    <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-300 text-[0.65rem] font-bold tracking-widest uppercase mb-6 shadow-sm border border-blue-100 dark:border-blue-800">
      Alianza Estratégica en Movilidad
    </div>
    <h2 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-white mb-6">
      Te movemos. <br />
      <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
        Te cuidamos.
      </span>
    </h2>
    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
      Unimos la excelencia logística de <span className="font-semibold text-gray-800 dark:text-gray-200 underline decoration-primary/30 decoration-2 underline-offset-2">
        Transportes DeDoctor
      </span> con la precisión técnica del <span className="font-semibold text-gray-800 dark:text-gray-200 underline decoration-primary/30 decoration-2 underline-offset-2">
        Taller MMC
      </span>.
    </p>
    <div className="w-full space-y-3">
      <Link
        to="/register-1"
        className="w-full py-4 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/40 transform active:scale-95 transition-all flex items-center justify-center gap-2 text-lg border-none"
      >
        Solicitar Servicio Ahora
        <span className="material-icons-round text-xl">arrow_forward_ios</span>
      </Link>
      <button
        onClick={() => document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' })}
        className="w-full py-4 bg-white dark:bg-surface-dark text-gray-800 dark:text-white rounded-xl font-bold shadow-md border border-gray-100 dark:border-gray-700 transform active:scale-95 transition-all text-sm"
      >
        Explorar Alianza
      </button>
    </div>
  </section>
);
