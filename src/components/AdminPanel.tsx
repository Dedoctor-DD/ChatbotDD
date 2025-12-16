import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Truck, Wrench, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ServiceRequest {
  id: string;
  session_id: string;
  service_type: 'transport' | 'workshop';
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  collected_data: any;
  created_at: string;
  updated_at: string;
}

export function AdminPanel() {
  /* New State for Admin Dashboard View */
  const [activeView, setActiveView] = useState<'dashboard' | 'transport' | 'workshop' | 'pending'>('dashboard');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, []); // Reload when component mounts

  const loadRequests = async () => {
    try {
      // Load all requests initially
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: 'confirmed' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      confirmed: 'Confirmado',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  // Filter logic based on View
  const getFilteredRequests = () => {
    if (activeView === 'transport') return requests.filter(r => r.service_type === 'transport');
    if (activeView === 'workshop') return requests.filter(r => r.service_type === 'workshop');
    if (activeView === 'pending') return requests.filter(r => r.status === 'confirmed' || r.status === 'draft');
    return requests;
  };

  const filteredRequests = getFilteredRequests();

  // Dashboard Button Component
  const DashboardBtn = ({ icon: Icon, title, count, onClick, colorClass, bgClass }: any) => (
    <button onClick={onClick} className={`dashboard-btn ${bgClass}`}>
      <div className={`icon-circle ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="btn-info">
        <h3>{title}</h3>
        <span className="count-badge">{count} Solicitudes</span>
      </div>
    </button>
  );

  return (
    <div className="admin-panel">

      {/* Dynamic Header */}
      <div className="admin-header">
        <div className="header-left">
          {activeView !== 'dashboard' && (
            <button onClick={() => setActiveView('dashboard')} className="back-btn">
              ← Volver
            </button>
          )}
          <h2 className="admin-title">
            {activeView === 'dashboard' ? 'Panel de Control' :
              activeView === 'transport' ? 'Transporte 🚌' :
                activeView === 'workshop' ? 'Taller 🔧' : 'Pendientes ⏳'}
          </h2>
        </div>
        <button onClick={loadRequests} className="refresh-btn">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* DASHBOARD VIEW */}
      {activeView === 'dashboard' && (
        <div className="dashboard-grid">
          <DashboardBtn
            icon={Truck}
            title="Transporte"
            count={requests.filter(r => r.service_type === 'transport').length}
            onClick={() => setActiveView('transport')}
            colorClass="bg-blue-500"
            bgClass="bg-blue-50"
          />
          <DashboardBtn
            icon={Wrench}
            title="Sillas de Ruedas"
            count={requests.filter(r => r.service_type === 'workshop').length}
            onClick={() => setActiveView('workshop')}
            colorClass="bg-orange-500"
            bgClass="bg-orange-50"
          />
          <DashboardBtn
            icon={Clock}
            title="Pendientes"
            count={requests.filter(r => r.status === 'draft' || r.status === 'confirmed').length}
            onClick={() => setActiveView('pending')}
            colorClass="bg-yellow-500"
            bgClass="bg-yellow-50"
          />
        </div>
      )}

      {/* LIST VIEW (If not dashboard) */}
      {activeView !== 'dashboard' && (
        <div className="requests-list">
          {/* ... existing list logic ... */}
          {loading ? (
            <div className="loading-state">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <p>Cargando solicitudes...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">
              <Users className="w-12 h-12 text-gray-400" />
              <p>No hay solicitudes en esta categoría.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="request-type">
                    {request.service_type === 'transport' ? (
                      <Truck className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Wrench className="w-5 h-5 text-orange-500" />
                    )}
                    <span className="request-type-label">
                      {request.service_type === 'transport' ? 'Transporte' : 'Mantenimiento'}
                    </span>
                  </div>
                  <div className="request-status">
                    {getStatusIcon(request.status)}
                    <span className="status-text">{getStatusLabel(request.status)}</span>
                  </div>
                </div>

                <div className="request-body">
                  <div className="request-info">
                    <p className="request-date">
                      {new Date(request.created_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="request-session">ID: {request.session_id.substring(0, 8)}...</p>
                  </div>

                  {request.collected_data && Object.keys(request.collected_data).length > 0 && (
                    <div className="request-data">
                      <h4 className="data-title">Datos recopilados:</h4>
                      <div className="data-grid">
                        {Object.entries(request.collected_data).map(([key, value]) => (
                          <div key={key} className="data-item">
                            <span className="data-key">{key}:</span>
                            <span className="data-value">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="request-actions">
                  {request.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => updateStatus(request.id, 'completed')}
                        className="action-btn success"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar como Completado
                      </button>
                      <button
                        onClick={() => updateStatus(request.id, 'cancelled')}
                        className="action-btn danger"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </button>
                    </>
                  )}
                  {request.status === 'draft' && (
                    <button
                      onClick={() => updateStatus(request.id, 'confirmed')}
                      className="action-btn primary"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirmar Solicitud
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  );
}

