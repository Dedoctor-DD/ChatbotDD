interface BottomNavProps {
  activeTab: 'chat' | 'admin' | 'home' | 'history' | 'profile' | 'contact';
  onTabChange: (tab: 'chat' | 'admin' | 'home' | 'history' | 'profile' | 'contact') => void;
  isAdmin: boolean;
  onNewChat?: () => void;
}

import { useState } from 'react';

export function BottomNav({ activeTab, onTabChange, isAdmin, onNewChat }: BottomNavProps) {
  const [showAriseMenu, setShowAriseMenu] = useState(false);

  const navItems = [
    { id: 'home', icon: 'home', label: 'Inicio', value: 'home' as const },
    { id: 'chat', icon: 'bolt', label: 'Arise', value: 'chat' as const },
    { id: 'contact', icon: 'support_agent', label: 'Ayuda', value: 'contact' as const },
    { id: 'profile', icon: 'person', label: 'Perfil', value: 'profile' as const },
    ...(isAdmin ? [{ id: 'admin', icon: 'admin_panel_settings', label: 'Admin', value: 'admin' as const }] : []),
  ];

  return (
    <nav className="fixed md:absolute bottom-0 left-0 right-0 w-full max-w-md md:max-w-2xl mx-auto bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] z-[70] md:rounded-b-[3rem]">
      {/* Arise Sub-menu */}
      {showAriseMenu && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[200px] bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-2 animate-slide-up overflow-hidden z-[80]">
          <button 
            onClick={() => {
              onNewChat?.();
              onTabChange('chat');
              setShowAriseMenu(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 rounded-2xl transition-colors group"
          >
            <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
            <span className="text-xs font-black text-gray-700 dark:text-gray-200">Nuevo Chat</span>
          </button>
          <div className="h-px bg-gray-50 dark:bg-gray-800 my-1 mx-2" />
          <button 
            onClick={() => {
              onTabChange('history');
              setShowAriseMenu(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 rounded-2xl transition-colors group"
          >
            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors text-xl">history</span>
            <span className="text-xs font-black text-gray-700 dark:text-gray-200">Ver Historial</span>
          </button>
        </div>
      )}

      <div className={`grid h-16 items-center justify-items-center ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {navItems.map((item) => {
          const isActive = activeTab === item.value;
          const colorClass = isActive ? "text-primary" : "text-slate-400 hover:text-primary";
          
          return (
            <button 
              onClick={() => {
                if (item.value === 'chat') {
                  setShowAriseMenu(!showAriseMenu);
                } else {
                  onTabChange(item.value);
                  setShowAriseMenu(false);
                }
              }}
              key={item.id} 
              className={`flex flex-col items-center justify-center gap-1 w-full h-full bg-transparent border-none ${colorClass} transition-colors group cursor-pointer`}
            >
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'filled' : ''} group-hover:scale-110 transition-transform`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-bold ${isActive ? 'font-black' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
