import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, User, Truck, Wrench, Clock, CheckCircle, XCircle, RefreshCw, DollarSign, Search, MapPin, Phone } from 'lucide-react';

interface ServiceRequest {
  id: string;
  session_id: string;
  service_type: 'transport' | 'workshop';
  status: 'draft' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
  collected_data: any;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  admin_notes: string;
  created_at: string;
}

interface Debt {
  id: string;
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  due_date: string;
  created_at: string;
}

export function AdminPanel() {
  const [activeView, setActiveView] = useState<'dashboard' | 'transport' | 'workshop' | 'pending' | 'clients' | 'pricing'>('dashboard');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tariffs, setTariffs] = useState<any[]>([]); // New State
  const [loading, setLoading] = useState(true);
  const [editingTariff, setEditingTariff] = useState<string | null>(null); // Track which row is being edited
  const [tempTariffValues, setTempTariffValues] = useState<any>({}); // Temp values for editing

  // Client Management State
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [clientDebts, setClientDebts] = useState<Debt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [newDebt, setNewDebt] = useState({ description: '', amount: '', due_date: '' });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Requests
      const { data: reqData, error: reqError } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;
      setRequests(reqData || []);

      // Load Profiles
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profError) throw profError;
      setProfiles(profData || []);

      // Load Tariffs
      const { data: tariffData, error: tariffError } = await supabase
        .from('tariffs')
        .select('*')
        .order('category', { ascending: true })
        .order('sub_category', { ascending: true });

      if (tariffError) throw tariffError;
      setTariffs(tariffData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTariff = async (id: string) => {
    try {
      const updates = tempTariffValues[id];
      if (!updates) {
        setEditingTariff(null);
        return;
      }

      const { error } = await supabase
        .from('tariffs')
        .update({
          price: parseInt(updates.price),
          description: updates.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setEditingTariff(null);
      setTempTariffValues((prev: any) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      loadData();
      alert('Tarifa actualizada correctamente');
    } catch (error) {
      console.error('Error updating tariff:', error);
      alert('Error al actualizar tarifa');
    }
  };

  const startEditingTariff = (t: any) => {
    setEditingTariff(t.id);
    setTempTariffValues({
      ...tempTariffValues,
      [t.id]: { price: t.price, description: t.description }
    });
  };

  // ... (other functions: loadClientDebts, handleClientSelect, updateStatus, handleAddDebt, getStatusIcon, filteredRequests, filteredClients, DashboardBtn) ...


  const loadClientDebts = async (userId: string) => {
    const { data } = await supabase
      .from('client_debts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setClientDebts(data);
  };

  const handleClientSelect = async (client: Profile) => {
    setSelectedClient(client);
    await loadClientDebts(client.id);
  };

  const updateStatus = async (id: string, newStatus: 'confirmed' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      alert('Error al actualizar el estado');
    }
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      const { error } = await supabase
        .from('client_debts')
        .insert({
          user_id: selectedClient.id,
          description: newDebt.description,
          amount: parseFloat(newDebt.amount),
          due_date: newDebt.due_date,
          status: 'pending'
        });

      if (error) throw error;

      await loadClientDebts(selectedClient.id);
      setShowDebtForm(false);
      setNewDebt({ description: '', amount: '', due_date: '' });
      alert('Deuda registrada correctamente');
    } catch (error) {
      console.error('Error creating debt:', error);
      alert('Error al crear la deuda');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredRequests = activeView === 'transport' ? requests.filter(r => r.service_type === 'transport')
    : activeView === 'workshop' ? requests.filter(r => r.service_type === 'workshop')
      : activeView === 'pending' ? requests.filter(r => r.status === 'confirmed' || r.status === 'draft' || r.status === 'pending')
        : requests;

  const filteredClients = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DashboardBtn = ({ icon: Icon, title, count, onClick, colorClass, bgClass }: any) => (
    <button onClick={onClick} className={`dashboard-btn ${bgClass}`}>
      <div className={`icon-circle ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="btn-info">
        <h3>{title}</h3>
        <span className="count-badge">{count}</span>
      </div>
    </button>
  );

  // VIEW: CLIENT DETAILS
  if (selectedClient) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <div className="header-left">
            <button onClick={() => setSelectedClient(null)} className="back-btn">← Volver a Lista</button>
            <h2 className="admin-title">Detalle de Cliente</h2>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">{selectedClient.full_name || 'Sin Nombre'}</h3>
              <p className="text-gray-500 mb-1 flex items-center gap-2"><div className="w-4 h-4"><Users className="w-4 h-4" /></div> {selectedClient.email}</p>
              <p className="text-gray-500 mb-1 flex items-center gap-2"><div className="w-4 h-4"><Phone className="w-4 h-4" /></div> {selectedClient.phone || 'Sin teléfono'}</p>
              <p className="text-gray-500 flex items-center gap-2"><div className="w-4 h-4"><MapPin className="w-4 h-4" /></div> {selectedClient.address || 'Sin dirección'}</p>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-400">ID: {selectedClient.id.substring(0, 8)}</span>
            </div>
          </div>
        </div>

        <div className="debt-section">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Historial de Deudas y Pagos</h3>
            <button
              onClick={() => setShowDebtForm(!showDebtForm)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Nueva Deuda
            </button>
          </div>

          {showDebtForm && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium mb-3">Registrar Nueva Deuda</h4>
              <form onSubmit={handleAddDebt} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Descripción (ej: Reparación de motor)"
                  className="p-2 border rounded"
                  value={newDebt.description}
                  onChange={e => setNewDebt({ ...newDebt, description: e.target.value })}
                  required
                />
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Monto"
                    className="p-2 border rounded flex-1"
                    value={newDebt.amount}
                    onChange={e => setNewDebt({ ...newDebt, amount: e.target.value })}
                    required
                  />
                  <input
                    type="date"
                    className="p-2 border rounded flex-1"
                    value={newDebt.due_date}
                    onChange={e => setNewDebt({ ...newDebt, due_date: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowDebtForm(false)} className="px-3 py-1 text-gray-500">Cancelar</button>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Guardar</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">Descripción</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {clientDebts.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-400">Este cliente no tiene deudas registradas.</td></tr>
                ) : (
                  clientDebts.map(debt => (
                    <tr key={debt.id} className="border-t">
                      <td className="p-3">{new Date(debt.created_at).toLocaleDateString()}</td>
                      <td className="p-3">{debt.description}</td>
                      <td className="p-3 text-right font-medium">${debt.amount.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${debt.status === 'paid' ? 'bg-green-100 text-green-700' :
                          debt.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {debt.status === 'paid' ? 'Pagado' : debt.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          {activeView !== 'dashboard' && (
            <button onClick={() => setActiveView('dashboard')} className="back-btn">← Volver</button>
          )}
          <h2 className="admin-title">
            {activeView === 'dashboard' ? 'Panel de Control' :
              activeView === 'clients' ? 'Gestión de Clientes' :
                activeView === 'transport' ? 'Transporte' :
                  activeView === 'workshop' ? 'Taller' : 'Pendientes y Confirmados'}
          </h2>
        </div>
        <button onClick={loadData} className="refresh-btn">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && activeView !== 'dashboard' && (
        <div className="p-8 text-center text-gray-400">Cargando...</div>
      )}

      {/* DASHBOARD */}
      {activeView === 'dashboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          <DashboardBtn
            icon={Truck}
            title="Transporte"
            count={requests.filter(r => r.service_type === 'transport').length}
            onClick={() => setActiveView('transport')}
            colorClass="text-white"
            bgClass="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
          />
          <DashboardBtn
            icon={Wrench}
            title="Taller"
            count={requests.filter(r => r.service_type === 'workshop').length}
            onClick={() => setActiveView('workshop')}
            colorClass="text-white"
            bgClass="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
          />
          <DashboardBtn
            icon={Clock}
            title="Pendientes"
            count={requests.filter(r => r.status === 'draft' || r.status === 'pending').length}
            onClick={() => setActiveView('pending')}
            colorClass="text-white"
            bgClass="bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-lg shadow-yellow-500/30"
          />
          <DashboardBtn
            icon={Users}
            title="Clientes"
            count={profiles.length}
            onClick={() => setActiveView('clients')}
            colorClass="text-white"
            bgClass="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30"
          />
          <DashboardBtn
            icon={DollarSign}
            title="Tarifas"
            count={tariffs.length}
            onClick={() => setActiveView('pricing')}
            colorClass="text-white"
            bgClass="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
          />
        </div>
      )}

      {/* PRICING VIEW */}
      {activeView === 'pricing' && (
        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Gestión de Tarifas</h3>
              <span className="text-xs text-gray-400">Precios actualizados en tiempo real</span>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Sub-Categoría</th>
                  <th className="p-4">Descripción</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tariffs.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 capitalize">{t.category}</td>
                    <td className="p-4 text-gray-600">{t.sub_category.replace(/_/g, ' ')}</td>

                    {/* Description Check */}
                    <td className="p-4 max-w-xs">
                      {editingTariff === t.id ? (
                        <textarea
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={tempTariffValues[t.id]?.description || ''}
                          onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], description: e.target.value } })}
                          rows={2}
                        />
                      ) : (
                        <span className="text-gray-500 block truncate" title={t.description}>{t.description || '-'}</span>
                      )}
                    </td>

                    {/* Price Check */}
                    <td className="p-4 font-bold text-gray-900">
                      {editingTariff === t.id ? (
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-400">$</span>
                          <input
                            type="number"
                            className="w-32 pl-6 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={tempTariffValues[t.id]?.price || 0}
                            onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], price: e.target.value } })}
                          />
                        </div>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">${t.price.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      {editingTariff === t.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateTariff(t.id)}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                            title="Guardar"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditingTariff(null)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Cancelar"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditingTariff(t)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLIENTS LIST */}
      {activeView === 'clients' && (
        <div className="p-4">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid gap-3">
            {filteredClients.map(client => (
              <div key={client.id} onClick={() => handleClientSelect(client)} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg shadow-inner">
                    {client.full_name?.charAt(0) || <User className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{client.full_name || 'Usuario sin nombre'}</h3>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                </div>
                <div className="text-gray-300">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REQUESTS LISTS (Transport, Workshop, Pending) */}
      {(activeView !== 'dashboard' && activeView !== 'clients') && (
        <div className="requests-list p-4 grid gap-4">
          {filteredRequests.length === 0 ? (
            <div className="empty-state text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No hay solicitudes en esta categoría.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    {request.service_type === 'transport' ?
                      <div className="p-1.5 bg-blue-100 rounded-lg"><Truck className="w-4 h-4 text-blue-600" /></div> :
                      <div className="p-1.5 bg-orange-100 rounded-lg"><Wrench className="w-4 h-4 text-orange-600" /></div>
                    }
                    <span className="font-semibold text-gray-700">{request.service_type === 'transport' ? 'Transporte' : 'Mantenimiento'}</span>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1
                     ${request.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      request.status === 'completed' ? 'bg-green-100 text-green-700' :
                        request.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          request.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    {getStatusIcon(request.status)}
                    <span className="uppercase tracking-wider text-[10px]">
                      {request.status === 'confirmed' ? 'CONFIRMADO' :
                        request.status === 'completed' ? 'COMPLETADO' :
                          request.status === 'pending' ? 'PENDIENTE' :
                            request.status === 'cancelled' ? 'CANCELADO' : 'BORRADOR'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-3 uppercase font-semibold tracking-wide">
                    {new Date(request.created_at).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {request.collected_data && (
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {Object.entries(request.collected_data)
                        .filter(([k]) => k !== 'image_url') // Don't show image URL as text
                        .map(([k, v]) => (
                          <div key={k} className="flex flex-col sm:flex-row sm:justify-between border-b last:border-0 border-gray-200 pb-2 last:pb-0 mb-2 last:mb-0">
                            <span className="font-semibold text-gray-500 capitalize">{k.replace(/_/g, ' ')}:</span>
                            <span className="text-gray-900">{String(v)}</span>
                          </div>
                        ))}

                      {/* Image Attachment Display */}
                      {request.collected_data.image_url && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-600 flex items-center gap-1">
                              📷 Evidencia/Foto Adjunta
                            </span>
                          </div>
                          <a
                            href={request.collected_data.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative group overflow-hidden rounded-lg border border-gray-300"
                          >
                            <img
                              src={request.collected_data.image_url}
                              alt="Evidencia"
                              className="w-full h-48 sm:h-64 object-cover transform group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                Clic para ver completa
                              </span>
                            </div>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                  {request.status === 'pending' && <button onClick={() => updateStatus(request.id, 'confirmed')} className="flex-1 sm:flex-none border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">✔ Confirmar</button>}
                  {request.status === 'confirmed' && <button onClick={() => updateStatus(request.id, 'completed')} className="flex-1 sm:flex-none border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">✔ Completar</button>}
                  {(request.status !== 'cancelled' && request.status !== 'completed') && <button onClick={() => updateStatus(request.id, 'cancelled')} className="flex-1 sm:flex-none border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">✖ Cancelar</button>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

