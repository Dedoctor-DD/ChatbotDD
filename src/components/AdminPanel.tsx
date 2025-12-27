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
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100 flex-none animate-slide-down">
          <div className="px-4 md:px-6 py-3 md:py-5">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Panel Admin</h2>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Gestión Central</p>
                </div>
            </div>
            
            {/* Scrollable Tabs Wrapper with Mask */}
            <div className="relative group">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
                    {tabs.map(tab => (
                        <button 
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as AdminTab)}
                          className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 active:scale-95 ${
                              activeTab === tab.id 
                              ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' 
                              : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-200'
                          }`}
                        >
                            <span className={`material-symbols-outlined text-base md:text-lg ${activeTab === tab.id ? 'filled' : ''}`}>{tab.icon}</span>
                            <span className={activeTab === tab.id ? 'block' : 'hidden md:block'}>{tab.label}</span>
                            {/* Mobile only indicator for inactive tabs */}
                            {activeTab !== tab.id && <span className="md:hidden opacity-50 block">{tab.label.substring(0, 3)}..</span>}
                        </button>
                    ))}
                </div>
                {/* Visual fading indicators */}
                <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
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

