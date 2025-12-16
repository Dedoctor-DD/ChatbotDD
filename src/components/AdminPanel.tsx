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
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadRequests();
    // Refrescar cada 30 segundos
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadRequests = async () => {
    try {
      let query = supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

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

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2 className="admin-title">Panel de Administración</h2>
        <button
          onClick={loadRequests}
          className="refresh-btn"
          title="Actualizar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filtros */}
      <div className="admin-filters">
        {(['all', 'confirmed', 'completed', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
          >
            {f === 'all' ? 'Todos' : getStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* Lista de solicitudes */}
      <div className="requests-list">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p>Cargando solicitudes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <Users className="w-12 h-12 text-gray-400" />
            <p>No hay solicitudes {filter !== 'all' ? `con estado "${getStatusLabel(filter)}"` : ''}</p>
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

