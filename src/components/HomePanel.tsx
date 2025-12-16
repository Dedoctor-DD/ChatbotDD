import { Truck, Wrench, MessageSquare, User } from 'lucide-react';

interface HomePanelProps {
  onServiceSelect: (service: 'transport' | 'workshop') => void;
  onGoToChat: () => void;
  userName: string;
  userEmail: string;
}

export function HomePanel({ onServiceSelect, onGoToChat, userName, userEmail }: HomePanelProps) {
  return (
    <div className="home-panel">
      <div className="home-header">
        <div className="user-greeting">
          <div className="user-avatar-large">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="welcome-title">¡Hola, {userName}!</h1>
            <p className="welcome-subtitle">{userEmail}</p>
          </div>
        </div>
      </div>

      <div className="services-section">
        <h2 className="section-title">¿En qué podemos ayudarte hoy?</h2>
        
        <div className="services-grid">
          <button
            onClick={() => onServiceSelect('transport')}
            className="service-card transport"
          >
            <div className="service-icon transport">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="service-title">Solicitar Transporte</h3>
            <p className="service-description">
              Solicita un servicio de transporte accesible para tus necesidades
            </p>
          </button>

          <button
            onClick={() => onServiceSelect('workshop')}
            className="service-card workshop"
          >
            <div className="service-icon workshop">
              <Wrench className="w-8 h-8" />
            </div>
            <h3 className="service-title">Mantenimiento de Silla</h3>
            <p className="service-description">
              Solicita reparación o mantenimiento de tu silla de ruedas
            </p>
          </button>
        </div>
      </div>

      <div className="quick-actions-section">
        <button
          onClick={onGoToChat}
          className="chat-quick-btn"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Ir al Chat</span>
        </button>
      </div>
    </div>
  );
}

