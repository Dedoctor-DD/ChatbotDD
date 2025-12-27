import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TariffsManager } from './TariffsManager';
import { GalleryManager } from './admin/GalleryManager';
import { AppointmentsManager } from './admin/AppointmentsManager';
import { DebtManager } from './admin/DebtManager';
import { UsersManager } from './admin/UsersManager';

type AdminTab = 'appointments' | 'debts' | 'content' | 'users';

export function AdminPanel() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('appointments');

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

  const tabs = [
      { id: 'appointments', label: 'Solicitudes', icon: 'calendar_month' },
      { id: 'debts', label: 'Cobranza', icon: 'attach_money' },
      { id: 'users', label: 'Usuarios', icon: 'group' },
      { id: 'content', label: 'Contenido', icon: 'perm_media' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Sub-Header / Tabs */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex-none">
          <div className="px-4 md:px-6 py-3 md:py-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-lg md:text-xl font-black text-slate-900">Panel Admin</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestión Central</p>
                </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 md:mx-0 md:px-0 mask-linear-fade">
                {tabs.map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as AdminTab)}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ${
                          activeTab === tab.id 
                          ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]' 
                          : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-primary/20 hover:text-slate-600'
                      }`}
                    >
                        <span className={`material-symbols-outlined text-base md:text-lg ${activeTab === tab.id ? 'filled' : ''}`}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-24">
        {activeTab === 'appointments' && (
            <div className="animate-fade-in space-y-6">
                <AppointmentsManager />
            </div>
        )}

        {activeTab === 'debts' && (
            <div className="animate-fade-in space-y-6">
                <DebtManager />
            </div>
        )}

        {activeTab === 'users' && (
            <div className="animate-fade-in">
                <UsersManager />
            </div>
        )}

        {activeTab === 'content' && (
            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
                <GalleryManager />
                <TariffsManager />
            </div>
        )}
      </div>
    </div>
  );
}

