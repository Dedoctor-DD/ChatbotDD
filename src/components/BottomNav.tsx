interface BottomNavProps {
  activeTab: 'chat' | 'admin' | 'home' | 'history' | 'profile' | 'contact';
  onTabChange: (tab: 'chat' | 'admin' | 'home' | 'history' | 'profile' | 'contact') => void;
  isAdmin: boolean;
}

export function BottomNav({ activeTab, onTabChange, isAdmin }: BottomNavProps) {
  const navItems = [
    { id: 'home', icon: 'home', label: 'Inicio', value: 'home' as const },
    { id: 'chat', icon: 'chat_bubble', label: 'Chat', value: 'chat' as const },
    { id: 'history', icon: 'history', label: 'Historial', value: 'history' as const },
    { id: 'contact', icon: 'support_agent', label: 'Ayuda', value: 'contact' as const },
    { id: 'profile', icon: 'person', label: 'Perfil', value: 'profile' as const },
    ...(isAdmin ? [{ id: 'admin', icon: 'admin_panel_settings', label: 'Admin', value: 'admin' as const }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white/95 dark:bg-[#101922]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] z-50">
      <div className={`grid h-16 items-center justify-items-center ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
        {navItems.map((item) => {
          const isActive = activeTab === item.value;
          const colorClass = isActive ? "text-primary" : "text-slate-400 hover:text-primary";
          
          return (
            <button 
              onClick={() => onTabChange(item.value)}
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
