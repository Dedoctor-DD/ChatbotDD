import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users, Truck, Wrench, Clock, CheckCircle, XCircle, RefreshCw, DollarSign, Search,
  MapPin, Phone, LayoutDashboard, Menu, AlertCircle, ChevronRight, Edit3, User
} from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Helper for counts
  const pendingCount = requests.filter(r => r.status === 'draft' || r.status === 'pending').length;

  // Nav Item Component
  const NavItem = ({ view, icon: Icon, label, count }: any) => (
    <button
      onClick={() => { setActiveView(view); setSidebarOpen(false); setSelectedClient(null); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeView === view
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
        : 'text-gray-600 hover:bg-white hover:text-blue-600'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${activeView === view ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100/50 overflow-hidden font-sans text-gray-800">

      {/* MOBILE SIDEBAR BACKDROP */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* SIDEBAR */}
      <aside className={`
            fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#F8F9FC] border-r border-gray-200 p-4 flex flex-col transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Inicio" />
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Gestión</div>
          <NavItem view="pending" icon={Clock} label="Pendientes" count={pendingCount} />
          <NavItem view="transport" icon={Truck} label="Transporte" />
          <NavItem view="workshop" icon={Wrench} label="Taller" />
          <NavItem view="clients" icon={Users} label="Clientes" />
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Configuración</div>
          <NavItem view="pricing" icon={DollarSign} label="Tarifas" />
        </nav>

        <div className="pt-4 border-t border-gray-200 mt-4">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">A</div>
            <div>
              <p className="text-sm font-bold text-gray-700">Administrador</p>
              <p className="text-xs text-gray-500">En línea</p>
            </div>
          </div>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-gray-50/50">
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">
              {activeView === 'dashboard' ? 'Panel de Control' :
                activeView === 'pending' ? 'Solicitudes Pendientes' :
                  activeView === 'transport' ? 'Transporte' :
                    activeView === 'workshop' ? 'Taller' :
                      activeView === 'clients' ? 'Clientes' : 'Tarifas'}
            </h2>
          </div>
          <button
            onClick={loadData}
            className={`p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all ${loading ? 'animate-spin text-blue-500' : ''}`}
            title="Actualizar datos"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">

          {/* 1. DASHBOARD VIEW */}
          {activeView === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* KPI CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pendientes</p>
                    <h3 className="text-3xl font-bold text-gray-800">{pendingCount}</h3>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">En Proceso</p>
                    <h3 className="text-3xl font-bold text-gray-800">{requests.filter(r => r.status === 'confirmed').length}</h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Clientes</p>
                    <h3 className="text-3xl font-bold text-gray-800">{profiles.length}</h3>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* RECENT PENDING REQUESTS TABLE WIDGET */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    Atención Requerida (Últimos Pendientes)
                  </h3>
                  <button onClick={() => setActiveView('pending')} className="text-xs font-bold text-blue-600 hover:underline flex items-center">
                    Ver todos <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {requests.filter(r => r.status === 'pending').slice(0, 5).map(req => (
                    <div key={req.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => setActiveView('pending')}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${req.service_type === 'transport' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                          {req.service_type === 'transport' ? <Truck className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {req.service_type === 'transport' ? 'Solicitud Transporte' : 'Solicitud Taller'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(req.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Pendiente</span>
                    </div>
                  ))}
                  {requests.filter(r => r.status === 'pending').length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No hay solicitudes pendientes por ahora. ¡Todo al día!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. PRICING VIEW */}
          {activeView === 'pricing' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-5xl mx-auto">
              {/* Table Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Gestión de Tarifas</h3>
                <span className="text-xs text-gray-400">Precios actualizados en tiempo real</span>
              </div>
              {/* Table Content (Same as before) */}
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
                      <td className="p-4 text-right">
                        {editingTariff === t.id ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleUpdateTariff(t.id)} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"><CheckCircle className="w-5 h-5" /></button>
                            <button onClick={() => setEditingTariff(null)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"><XCircle className="w-5 h-5" /></button>
                          </div>
                        ) : (
                          <button onClick={() => startEditingTariff(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 className="w-5 h-5" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. CLIENT DETAIL VIEW (Nested) */}
          {selectedClient && (
            <div className="max-w-5xl mx-auto space-y-6">
              <button onClick={() => setSelectedClient(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                ← Volver a Lista
              </button>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedClient.full_name || 'Sin Nombre'}</h3>
                    <div className="space-y-1 text-gray-500">
                      <p className="flex items-center gap-2"><div className="w-4 h-4"><Users className="w-4 h-4" /></div> {selectedClient.email}</p>
                      <p className="flex items-center gap-2"><div className="w-4 h-4"><Phone className="w-4 h-4" /></div> {selectedClient.phone || 'Sin teléfono'}</p>
                      <p className="flex items-center gap-2"><div className="w-4 h-4"><MapPin className="w-4 h-4" /></div> {selectedClient.address || 'Sin dirección'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">ID: {selectedClient.id.substring(0, 8)}</span>
                  </div>
                </div>
              </div>
              {/* Debt Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-800">Historial Financiero</h3>
                  <button onClick={() => setShowDebtForm(!showDebtForm)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg shadow-red-500/30">
                    <DollarSign className="w-4 h-4" /> Nueva Deuda
                  </button>
                </div>

                {showDebtForm && (
                  <div className="bg-gray-50 p-6 border-b border-gray-100">
                    <h4 className="font-medium mb-3 text-gray-700">Registrar Nueva Deuda</h4>
                    <form onSubmit={handleAddDebt} className="flex flex-col gap-3">
                      <input type="text" placeholder="Descripción" className="p-3 border rounded-xl" value={newDebt.description} onChange={e => setNewDebt({ ...newDebt, description: e.target.value })} required />
                      <div className="flex gap-3">
                        <input type="number" placeholder="Monto" className="p-3 border rounded-xl flex-1" value={newDebt.amount} onChange={e => setNewDebt({ ...newDebt, amount: e.target.value })} required />
                        <input type="date" className="p-3 border rounded-xl flex-1" value={newDebt.due_date} onChange={e => setNewDebt({ ...newDebt, due_date: e.target.value })} />
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button type="button" onClick={() => setShowDebtForm(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-200 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Guardar</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Debt Table */}
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="p-4 text-left">Fecha</th>
                      <th className="p-4 text-left">Descripción</th>
                      <th className="p-4 text-right">Monto</th>
                      <th className="p-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientDebts.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400">Sin historial registrado.</td></tr>
                    ) : (
                      clientDebts.map(debt => (
                        <tr key={debt.id} className="hover:bg-gray-50/50">
                          <td className="p-4 text-gray-600">{new Date(debt.created_at).toLocaleDateString()}</td>
                          <td className="p-4 font-medium text-gray-900">{debt.description}</td>
                          <td className="p-4 text-right font-bold text-gray-900">${debt.amount.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${debt.status === 'paid' ? 'bg-green-100 text-green-700' : debt.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {debt.status === 'paid' ? 'PAGADO' : debt.status === 'pending' ? 'PENDIENTE' : 'CANCELADO'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. CLIENT LIST VIEW */}
          {activeView === 'clients' && !selectedClient && (
            <div className="max-w-5xl mx-auto">
              <div className="mb-6 relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  className="w-full pl-12 p-3.5 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none shadow-sm transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid gap-4">
                {filteredClients.map(client => (
                  <div key={client.id} onClick={() => handleClientSelect(client)} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 font-bold text-lg group-hover:bg-purple-100 transition-colors">
                        {client.full_name?.charAt(0) || <User className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{client.full_name || 'Sin Nombre'}</h3>
                        <p className="text-gray-500 text-sm">{client.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-purple-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. REQUEST LISTS (Shared for Transport, Workshop, Pending) */}
          {(activeView === 'transport' || activeView === 'workshop' || activeView === 'pending') && (
            <div className="grid gap-4 max-w-5xl mx-auto">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LayoutDashboard className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">No hay solicitudes en esta sección.</p>
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Request Header */}
                    <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${request.service_type === 'transport' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                          {request.service_type === 'transport' ? <Truck className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                        </div>
                        <div>
                          <span className="font-bold text-gray-800">{request.service_type === 'transport' ? 'Transporte' : 'Taller'}</span>
                          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                            {new Date(request.created_at).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border
                                            ${request.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          request.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                            request.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                              request.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                        {getStatusIcon(request.status)}
                        <span className="uppercase tracking-wider text-[10px]">
                          {request.status === 'confirmed' ? 'CONFIRMADO' :
                            request.status === 'completed' ? 'COMPLETADO' :
                              request.status === 'pending' ? 'PENDIENTE' :
                                request.status === 'cancelled' ? 'CANCELADO' : 'BORRADOR'}
                        </span>
                      </div>
                    </div>

                    {/* Request Content */}
                    <div className="p-5">
                      {request.collected_data && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                          {Object.entries(request.collected_data)
                            .filter(([k]) => k !== 'image_url')
                            .map(([k, v]) => (
                              <div key={k} className="flex flex-col border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{k.replace(/_/g, ' ')}</span>
                                <span className="text-gray-800 font-medium">{String(v)}</span>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Image Attachment Display */}
                      {request.collected_data?.image_url && (
                        <div className="mt-5 pt-5 border-t border-gray-100">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            📷 Evidencia Adjunta
                          </p>
                          <a
                            href={request.collected_data.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block relative group overflow-hidden rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all w-full md:w-64"
                          >
                            <img
                              src={request.collected_data.image_url}
                              alt="Evidencia"
                              className="w-full h-40 object-cover"
                            />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Request Actions */}
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                      {request.status === 'pending' && <button onClick={() => updateStatus(request.id, 'confirmed')} className="flex-1 md:flex-none bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">✔ Confirmar</button>}
                      {request.status === 'confirmed' && <button onClick={() => updateStatus(request.id, 'completed')} className="flex-1 md:flex-none bg-green-600 text-white hover:bg-green-700 px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2">✔ Finalizar</button>}
                      {(request.status !== 'cancelled' && request.status !== 'completed') && <button onClick={() => updateStatus(request.id, 'cancelled')} className="flex-1 md:flex-none bg-white border border-red-200 text-red-600 hover:bg-red-50 px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">✖ Cancelar</button>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

