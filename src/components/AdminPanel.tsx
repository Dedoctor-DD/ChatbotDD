import { useAuth } from '../hooks/useAuth';
import { TariffsManager } from './TariffsManager';
import { GalleryManager } from './admin/GalleryManager';
import { AppointmentsManager } from './admin/AppointmentsManager';

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
    <div className="p-6 pb-24 md:pb-6 overflow-y-auto h-full">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900">Panel de Administración</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión de Plataforma</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        {/* Columna 1: Solicitudes y Agendamientos */}
        <div className="space-y-6">
            <AppointmentsManager />
        </div>
        
        {/* Columna 2: Gestión de Contenido */}
        <div className="space-y-6">
            <GalleryManager />
            <TariffsManager />
        </div>

        {/* Columna 3: Stats (Placeholder por ahora) */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-50 h-fit">
           <h3 className="font-black text-slate-800 mb-4">Métricas Rápidas</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Usuarios</p>
                 <p className="text-2xl font-black text-slate-900">--</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Servicios Mes</p>
                 <p className="text-2xl font-black text-primary">--</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

