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
    <nav className="w-full max-w-md md:max-w-xl mx-auto bg-white/80 backdrop-blur-2xl border-t border-slate-100 pb-[env(safe-area-inset-bottom)] z-[70] md:rounded-b-[3rem] sticky bottom-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      {/* Arise Sub-menu */}
      {showAriseMenu && (
        <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-[220px] bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-100 p-2 animate-slide-up overflow-hidden z-[80]">
          <button 
            onClick={() => {
              onNewChat?.();
              onTabChange('chat');
              setShowAriseMenu(false);
            }}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-primary/10 rounded-2xl transition-all group active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:rotate-12">
               <span className="material-symbols-outlined text-xl filled">add_circle</span>
            </div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Nuevo Chat</span>
          </button>
          <div className="h-px bg-slate-100/50 my-1 mx-2" />
          <button 
            onClick={() => {
              onTabChange('history');
              setShowAriseMenu(false);
            }}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 rounded-2xl transition-all group active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
               <span className="material-symbols-outlined text-xl">history</span>
            </div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Historial</span>
          </button>
        </div>
      )}

      <div className={`grid h-20 items-center justify-items-center ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} px-2`}>
        {navItems.map((item) => {
          const isActive = activeTab === item.value;
          
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
              className={`flex flex-col items-center justify-center gap-1.5 w-full h-full bg-transparent border-none transition-all duration-300 group cursor-pointer relative ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <div className={`flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                <span className={`material-symbols-outlined text-[26px] ${isActive ? 'filled' : ''} transition-all duration-300`}>
                  {item.icon}
                </span>
                <span className={`text-[8px] font-black uppercase tracking-[0.1em] mt-0.5 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                  {item.label}
                </span>
              </div>
              
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
