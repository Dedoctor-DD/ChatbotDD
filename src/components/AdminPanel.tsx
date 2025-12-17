import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users, Truck, Wrench, Clock, CheckCircle, XCircle, RefreshCw, DollarSign, Search,
  MapPin, Phone, LayoutDashboard, Menu, AlertCircle, ChevronRight, Edit3, User
} from 'lucide-react';

import type { ServiceRequest, Profile, Debt, Tariff } from '../types';

export function AdminPanel() {
  const [activeView, setActiveView] = useState<'dashboard' | 'transport' | 'workshop' | 'pending' | 'clients' | 'pricing'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]); // New State
  const [loading, setLoading] = useState(true);
  const [editingTariff, setEditingTariff] = useState<string | null>(null); // Track which row is being edited
  const [tempTariffValues, setTempTariffValues] = useState<Record<string, Partial<Tariff>>>({}); // Temp values for editing

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
          price: typeof updates.price === 'string' ? parseInt(updates.price) : updates.price,
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
    <div className="flex h-full bg-gray-50/50 overflow-hidden font-sans text-gray-800 relative">

      {/* BOTTOM SHEET MENU (Replaces Sidebar) */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)}></div>
          <div className={`
                    fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] 
                    flex flex-col max-h-[85vh] transition-transform duration-300 ease-out transform
                    ${sidebarOpen ? 'translate-y-0' : 'translate-y-full'}
                `}>
            <div className="p-2 flex justify-center">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full my-2"></div>
            </div>

            <div className="px-6 pb-6 pt-2 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">D</div>
                  Menú Admin
                </h2>
                <button onClick={() => setSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-2">
                <NavItem view="dashboard" icon={LayoutDashboard} label="Panel Principal" />
                <div className="my-2 border-t border-gray-100"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Solicitudes</p>
                <NavItem view="pending" icon={Clock} label="Pendientes" count={pendingCount} />
                <NavItem view="transport" icon={Truck} label="Transporte" />
                <NavItem view="workshop" icon={Wrench} label="Taller" />

                <div className="my-2 border-t border-gray-100"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Administración</p>
                <NavItem view="clients" icon={Users} label="Gestión de Clientes" />
                <NavItem view="pricing" icon={DollarSign} label="Tarifas y Precios" />
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shadow-inner">A</div>
                <div>
                  <p className="text-sm font-bold text-gray-700">Administrador</p>
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">● En línea</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-gray-50">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 lg:px-8 h-[80px] shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Toggle */}
            <button 
               onClick={() => setSidebarOpen(true)} 
               className="lg:hidden p-2.5 -ml-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
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
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-32 make-scroll-smooth">

          {/* 1. DASHBOARD VIEW */}
          {activeView === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* KPI CARDS */}
              {/* KPI CARDS - POLISHED & CENTERED */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Pendientes */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="pl-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pendientes</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight ml-[-2px]">{pendingCount}</h3>
                  </div>
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <Clock className="w-7 h-7" />
                  </div>
                </div>
                
                {/* Card 2: En Proceso */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="pl-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">En Proceso</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight ml-[-2px]">
                      {requests.filter(r => r.status === 'confirmed' || r.status === 'in_process').length}
                    </h3>
                  </div>
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                </div>

                {/* Card 3: Clientes */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="pl-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clientes</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight ml-[-2px]">{profiles.length}</h3>
                  </div>
                  <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7" />
                  </div>
                </div>
              </div>

              {/* RECENT PENDING REQUESTS WIDGET */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-2xl text-red-500">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Atención Requerida</h3>
                      <p className="text-sm text-slate-500 font-medium">Últimas solicitudes sin asignar</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveView('pending')} 
                    className="group flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-full text-sm font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all active:scale-95"
                  >
                    Ver bandeja completa 
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                <div className="divide-y divide-slate-50">
                  {requests.filter(r => r.status === 'pending').slice(0, 5).map(req => (
                    <div 
                      key={req.id} 
                      onClick={() => setActiveView('pending')}
                      className="p-5 md:p-6 hover:bg-blue-50/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${req.service_type === 'transport' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                          {req.service_type === 'transport' ? <Truck className="w-7 h-7" /> : <Wrench className="w-7 h-7" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base mb-1 group-hover:text-blue-700 transition-colors">
                            {req.service_type === 'transport' ? 'Solicitud de Transporte' : 'Solicitud de Taller'}
                          </p>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                             <Clock className="w-3.5 h-3.5" />
                             {new Date(req.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                         <span className="px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold shadow-sm shadow-orange-100">Pendiente</span>
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <ChevronRight className="w-5 h-5" />
                         </div>
                      </div>
                    </div>
                  ))}
                  
                  {requests.filter(r => r.status === 'pending').length === 0 && (
                    <div className="py-16 text-center">
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                         <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <p className="text-slate-500 font-medium text-lg">¡Todo limpio!</p>
                      <p className="text-slate-400 text-sm">No tienes solicitudes pendientes.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. PRICING VIEW - POLISHED */}
          {activeView === 'pricing' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden max-w-5xl mx-auto">
              <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-xl text-slate-800">Gestión de Tarifas</h3>
                  <p className="text-sm text-slate-400 mt-1">Precios actualizados en tiempo real</p>
                </div>
                <div className="bg-slate-100 px-4 py-2 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {tariffs.length} Tarifas Activas
                </div>
              </div>

              <div className="overflow-x-auto block w-full p-2">
                <table className="w-full text-sm text-left min-w-[700px]">
                  <thead className="text-slate-400 font-bold uppercase tracking-wider text-xs border-b border-slate-100">
                    <tr>
                      <th className="p-6 font-bold text-slate-400">Categoría</th>
                      <th className="p-6 font-bold text-slate-400">Sub-Categoría</th>
                      <th className="p-6 font-bold text-slate-400">Descripción</th>
                      <th className="p-6 font-bold text-slate-400">Precio</th>
                      <th className="p-6 text-right font-bold text-slate-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tariffs.map((t) => (
                      <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="p-6 font-bold text-slate-700 capitalize">{t.category}</td>
                        <td className="p-6 text-slate-500 font-medium">{t.sub_category.replace(/_/g, ' ')}</td>
                        <td className="p-6 max-w-xs">
                          {editingTariff === t.id ? (
                            <textarea
                              className="w-full p-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none shadow-inner"
                              value={tempTariffValues[t.id]?.description || ''}
                              onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], description: e.target.value } })}
                              rows={2}
                            />
                          ) : (
                            <span className="text-slate-500 block truncate font-medium" title={t.description}>{t.description || '-'}</span>
                          )}
                        </td>
                        <td className="p-6">
                          {editingTariff === t.id ? (
                            <div className="relative">
                              <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                              <input
                                type="number"
                                className="w-36 pl-8 p-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-slate-800 shadow-inner"
                                value={tempTariffValues[t.id]?.price || 0}
                                onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], price: Number(e.target.value) } })}
                              />
                            </div>
                          ) : (
                            <span className="text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 font-bold shadow-sm inline-block min-w-[80px] text-center">
                              ${t.price.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="p-6 text-right">
                          {editingTariff === t.id ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleUpdateTariff(t.id)} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95"><CheckCircle className="w-5 h-5" /></button>
                              <button onClick={() => setEditingTariff(null)} className="p-2.5 bg-white border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-all active:scale-95"><XCircle className="w-5 h-5" /></button>
                            </div>
                          ) : (
                            <button onClick={() => startEditingTariff(t)} className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"><Edit3 className="w-5 h-5" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. CLIENT DETAIL VIEW - POLISHED */}
          {selectedClient && (
            <div className="max-w-5xl mx-auto space-y-6">
              <button 
                onClick={() => setSelectedClient(null)} 
                className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100 w-fit hover:shadow-md active:scale-95"
              >
                <div className="p-1 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-colors">
                   <ChevronRight className="w-3 h-3 rotate-180" />
                </div>
                <span className="font-bold text-sm">Volver a Clientes</span>
              </button>
              
              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Users className="w-64 h-64 text-slate-900" />
                </div>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-6">
                     <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        {selectedClient.full_name?.charAt(0) || <User className="w-10 h-10" />}
                     </div>
                     <div>
                      <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">{selectedClient.full_name || 'Sin Nombre'}</h3>
                      <div className="space-y-2">
                        <p className="flex items-center gap-3 text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                          <span className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-sm text-blue-500"><Users className="w-3 h-3" /></span> 
                          {selectedClient.email}
                        </p>
                        <p className="flex items-center gap-3 text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                          <span className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-sm text-green-500"><Phone className="w-3 h-3" /></span> 
                          {selectedClient.phone || 'Sin teléfono'}
                        </p>
                        <p className="flex items-center gap-3 text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                           <span className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-sm text-purple-500"><MapPin className="w-3 h-3" /></span>
                           {selectedClient.address || 'Sin dirección'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full">
                       ID: {selectedClient.id.substring(0, 8)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Debt Section */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                        <DollarSign className="w-4 h-4" />
                     </div>
                     Historial Financiero
                  </h3>
                  <button onClick={() => setShowDebtForm(!showDebtForm)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 font-bold text-sm">
                    {showDebtForm ? 'Cancelar' : 'Nueva Deuda'}
                  </button>
                </div>

                {showDebtForm && (
                  <div className="bg-slate-50/50 p-6 border-b border-slate-100 animate-in slide-in-from-top-4 fade-in duration-200">
                    <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide">Registrar Cargo</h4>
                    <form onSubmit={handleAddDebt} className="flex flex-col gap-4">
                      <input 
                         type="text" 
                         placeholder="Descripción del cargo..." 
                         className="p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none w-full bg-white font-medium" 
                         value={newDebt.description} 
                         onChange={e => setNewDebt({ ...newDebt, description: e.target.value })} 
                         required 
                      />
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                           <span className="absolute left-4 top-4 text-slate-400 font-bold">$</span>
                           <input 
                              type="number" 
                              placeholder="Monto" 
                              className="w-full pl-8 p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white font-bold" 
                              value={newDebt.amount} 
                              onChange={e => setNewDebt({ ...newDebt, amount: e.target.value })} 
                              required 
                           />
                        </div>
                        <input 
                           type="date" 
                           className="flex-1 p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white font-medium text-slate-600" 
                           value={newDebt.due_date} 
                           onChange={e => setNewDebt({ ...newDebt, due_date: e.target.value })} 
                        />
                      </div>
                      <div className="flex justify-end gap-3 mt-2">
                        <button type="button" onClick={() => setShowDebtForm(false)} className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-2xl font-bold transition-colors">Cancelar</button>
                        <button type="submit" className="bg-red-500 text-white px-8 py-3 rounded-2xl hover:bg-red-600 font-bold shadow-lg shadow-red-500/25 transition-transform active:scale-95">Guardar Cargo</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Debt Table */}
                <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                     <thead className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-xs">
                       <tr>
                         <th className="p-5 text-left pl-8">Fecha</th>
                         <th className="p-5 text-left">Descripción</th>
                         <th className="p-5 text-right">Monto</th>
                         <th className="p-5 text-center pr-8">Estado</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {clientDebts.length === 0 ? (
                         <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-medium">Sin historial registrado para este cliente.</td></tr>
                       ) : (
                         clientDebts.map(debt => (
                           <tr key={debt.id} className="hover:bg-blue-50/30 transition-colors">
                             <td className="p-5 text-slate-500 font-medium pl-8">{new Date(debt.created_at).toLocaleDateString()}</td>
                             <td className="p-5 font-bold text-slate-700">{debt.description}</td>
                             <td className="p-5 text-right font-black text-slate-800">${debt.amount.toLocaleString()}</td>
                             <td className="p-5 text-center pr-8">
                               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border shadow-sm ${debt.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : debt.status === 'cancelled' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>
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
            </div>
          )}

          {/* 4. CLIENT LIST VIEW - POLISHED */}
          {activeView === 'clients' && !selectedClient && (
            <div className="max-w-5xl mx-auto">
              <div className="mb-8 relative">
                <Search className="absolute left-5 top-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar clientes por nombre o email..."
                  className="w-full pl-14 p-4 border border-slate-200 rounded-full focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none shadow-sm transition-all hover:shadow-md bg-white font-medium text-slate-700"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid gap-4">
                {filteredClients.map(client => (
                  <div 
                    key={client.id} 
                    onClick={() => handleClientSelect(client)} 
                    className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-lg hover:border-purple-100 hover:translate-y-[-2px] transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 font-bold text-lg group-hover:bg-purple-500 group-hover:text-white transition-all shadow-sm">
                        {client.full_name?.charAt(0) || <User className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{client.full_name || 'Sin Nombre'}</h3>
                        <p className="text-slate-400 text-sm font-medium">{client.email}</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-purple-50 group-hover:text-purple-600 transition-all">
                       <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. REQUEST LISTS (Shared for Transport, Workshop, Pending) - POLISHED */}
          {(activeView === 'transport' || activeView === 'workshop' || activeView === 'pending') && (
            <div className="grid gap-6 max-w-5xl mx-auto">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LayoutDashboard className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold text-lg">No hay solicitudes aquí.</p>
                  <p className="text-slate-400 text-sm">Esperando nuevos servicios...</p>
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
                    {/* Request Header */}
                    <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
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
                    <div className="p-6 md:p-8">
                      {request.collected_data && (
                        <div className="bg-slate-50 rounded-3xl p-6">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <div className="w-10 h-1px bg-slate-200"></div> Datos del Servicio
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
                              {Object.entries(request.collected_data)
                                .filter(([k]) => k !== 'image_url')
                                .map(([k, v]) => (
                                  <div key={k} className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{k.replace(/_/g, ' ')}</span>
                                    <span className="text-slate-800 font-medium text-base">{String(v)}</span>
                                  </div>
                                ))}
                           </div>
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

