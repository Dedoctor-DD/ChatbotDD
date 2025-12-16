import { Truck, Wrench, MessageSquare, User } from 'lucide-react';

interface HomePanelProps {
  onServiceSelect: (service: 'transport' | 'workshop') => void;
  onGoToChat: () => void;
  userName: string;
  userEmail: string;
}

export function HomePanel({ onServiceSelect, onGoToChat, userName, userEmail }: HomePanelProps) {
  return (
    <div className="home-panel w-full max-w-2xl mx-auto">
      <div className="home-header mb-6">
        <div className="user-greeting flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="user-avatar-large shrink-0">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="welcome-title text-2xl font-bold">¡Hola, {userName}!</h1>
            <p className="welcome-subtitle text-sm opacity-80">{userEmail}</p>
          </div>
        </div>
      </div>

      <div className="services-section mb-8">
        <h2 className="section-title text-center mb-6 text-lg font-medium opacity-90">¿En qué podemos ayudarte hoy?</h2>

        <div className="services-grid">
          <button
            onClick={() => onServiceSelect('transport')}
            className="service-card transport"
          >
            <div className="service-icon transport">
              <Truck />
            </div>
            <div className="service-content">
              <h3 className="service-title">Solicitar Transporte</h3>
              <p className="service-description">
                Servicio accesible puerta a puerta
              </p>
            </div>
          </button>

          <button
            onClick={() => onServiceSelect('workshop')}
            className="service-card workshop"
          >
            <div className="service-icon workshop">
              <Wrench />
            </div>
            <div className="service-content">
              <h3 className="service-title">Mantenimiento</h3>
              <p className="service-description">
                Reparación de silla de ruedas
              </p>
            </div>
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

