import { Home, MessageSquare, Users } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'chat' | 'admin' | 'home';
  onTabChange: (tab: 'chat' | 'admin' | 'home') => void;
  isAdmin: boolean;
}

export function BottomNav({ activeTab, onTabChange, isAdmin }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button
        onClick={() => onTabChange('home')}
        className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
      >
        <Home className="nav-icon" />
        <span className="nav-label">Inicio</span>
      </button>

      <button
        onClick={() => onTabChange('chat')}
        className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
      >
        <MessageSquare className="nav-icon" />
        <span className="nav-label">Chat</span>
      </button>

      {isAdmin && (
        <button
          onClick={() => onTabChange('admin')}
          className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
        >
          <Users className="nav-icon" />
          <span className="nav-label">Admin</span>
        </button>
      )}
    </nav>
  );
}
