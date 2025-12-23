import { useAuth } from '../hooks/useAuth';
import { TariffsManager } from './TariffsManager';

export function AdminPanel() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-sm text-gray-500">No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900">Panel de Administración</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión de Plataforma</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-50 h-fit">
          <h3 className="font-black text-slate-800 mb-4">Resumen</h3>
          <p className="text-sm text-slate-500">Aquí podrás ver estadísticas y gestionar solicitudes (Próximamente).</p>
        </div>
        
        {/* Gestor de Tarifas */}
        <TariffsManager />
      </div>
    </div>
  );
}
