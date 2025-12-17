import { useState, useEffect } from 'react';
import { Truck, Wrench, MessageSquare, User, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HomePanelProps {
  onServiceSelect: (service: 'transport' | 'workshop') => void;
  onGoToChat: () => void;
  userName: string;
  userEmail: string;
  userId: string;
}

interface Debt {
  id: string;
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  due_date: string;
}

interface RecentRequest {
  id: string;
  service_type: 'transport' | 'workshop';
  status: string;
  created_at: string;
}

export function HomePanel({ onServiceSelect, onGoToChat, userName, userEmail, userId }: HomePanelProps) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      // Load Pending Debts
      const { data: debtsData } = await supabase
        .from('client_debts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (debtsData) setDebts(debtsData);

      // Load Recent Requests (Limit 3)
      const { data: reqData } = await supabase
        .from('service_requests')
        .select('id, service_type, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (reqData) setRecentRequests(reqData);

    } catch (e) {
      console.error('Error loading user data', e);
    } finally {
      setLoading(false);
    }
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);

  if (loading) {
    return (
      <div className="home-panel w-full max-w-2xl mx-auto pb-20 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="home-panel w-full max-w-2xl mx-auto pb-20">
      <div className="home-header mb-6">
        <div className="user-greeting flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="user-avatar-large shrink-0 relative">
            <User className="w-12 h-12 text-white" />
            {debts.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-indigo-600">
                <span className="text-[10px] font-bold text-white">!</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="welcome-title text-2xl font-bold">¡Hola, {userName}!</h1>
            <p className="welcome-subtitle text-sm opacity-80">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* ALERT: DEBTS */}
      {totalDebt > 0 && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-red-100">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold">Pagos Pendientes</h3>
            </div>
            <span className="text-xl font-bold text-white">${totalDebt.toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-300 mb-3">Tienes {debts.length} cargo(s) pendiente(s) en tu cuenta.</p>
          <div className="space-y-2">
            {debts.map(debt => (
              <div key={debt.id} className="flex justify-between items-center text-sm bg-black/20 p-2 rounded">
                <span className="text-gray-300">{debt.description}</span>
                <span className="font-mono text-red-300">${debt.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* RECENT ACTIVITY */}
      <div className="mb-8">
        <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-3 ml-1">Estado de Solicitudes</h3>

        {recentRequests.length > 0 ? (
          <div className="space-y-3">
            {recentRequests.map(req => {
              // Status Logic mapping
              let statusLabel = 'Pendiente';
              let statusClass = 'bg-yellow-500/20 text-yellow-400';

              if (req.status === 'confirmed') {
                statusLabel = 'Confirmado';
                statusClass = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
              } else if (req.status === 'in_process') {
                statusLabel = 'En Proceso';
                statusClass = 'bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse';
              } else if (req.status === 'completed') {
                statusLabel = 'Completado';
                statusClass = 'bg-green-500/20 text-green-400';
              } else if (req.status === 'cancelled') {
                statusLabel = 'Cancelado';
                statusClass = 'bg-red-500/20 text-red-400';
              }

              return (
                <div key={req.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${req.service_type === 'transport' ? 'bg-blue-600/20 text-blue-400' : 'bg-orange-600/20 text-orange-400'}`}>
                      {req.service_type === 'transport' ? <Truck className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        {req.service_type === 'transport' ? 'Solicitud de Transporte' : 'Solicitud de Taller'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(req.created_at).toLocaleDateString()} • {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                    {statusLabel}
                  </div>
                  {/* REPEAT BUTTON (Only for Transport / Completed or Confirmed) */}
                  {req.service_type === 'transport' && (req.status === 'completed' || req.status === 'confirmed') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Logic to repeat would go here - for now just go to chat with context?
                        // Or better, pass a prop up.
                        // onGoToChatWithContext(req);
                        onGoToChat(); // Simple redirect for now, user asked for analysis
                      }}
                      className="ml-2 p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-full transition-colors"
                      title="Repetir este viaje"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-50 border border-transparent rounded-[2rem] p-8 text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Truck className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-sm mb-1">No tienes solicitudes recientes</p>
            <p className="text-xs text-gray-400">Tus viajes aparecerán aquí</p>
          </div>
        )}
      </div>

      <div className="quick-actions-section">
        <button
          onClick={onGoToChat}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full p-4 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] group"
        >
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-wide">Iniciar Conversación</span>
        </button>
      </div>
    </div>
  );
}

