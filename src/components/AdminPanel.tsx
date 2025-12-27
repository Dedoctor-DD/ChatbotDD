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
      { id: 'appointments', label: 'Citas', icon: 'calendar_today' },
      { id: 'debts', label: 'Deudas', icon: 'payments' },
      { id: 'users', label: 'Usuarios', icon: 'group' },
      { id: 'content', label: 'Precios', icon: 'settings_b_roll' },
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
            
            {/* Premium Navigation: Centered Pill Style on Mobile */}
            <div className="relative">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 pt-1 -mx-4 px-4 scroll-smooth snap-x">
                    {tabs.map(tab => (
                        <button 
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as AdminTab)}
                          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-tighter whitespace-nowrap transition-all duration-500 relative snap-center ${
                              activeTab === tab.id 
                              ? 'bg-slate-900 text-white shadow-[0_10px_25px_-5px_rgba(15,23,42,0.3)] scale-[1.02]' 
                              : 'bg-white/50 text-slate-400 border border-slate-100/50 hover:bg-white hover:text-slate-600'
                          }`}
                        >
                            <span className={`material-symbols-outlined text-[16px] ${activeTab === tab.id ? 'animate-pulse' : ''}`}>
                                {tab.icon}
                            </span>
                            <span className="tracking-widest">{tab.label}</span>
                            {activeTab === tab.id && (
                                <span className="absolute inset-0 rounded-full border-2 border-slate-900/10 animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
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

