import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users, Truck, Wrench, Clock, CheckCircle, XCircle, RefreshCw, DollarSign, Search,
  MapPin, Phone, LayoutDashboard, AlertCircle, ChevronRight, Edit3, User
} from 'lucide-react';

import type { ServiceRequest, Profile, Debt, Tariff } from '../types';

export function AdminPanel() {
  const [activeView, setActiveView] = useState<'dashboard' | 'transport' | 'workshop' | 'pending' | 'clients' | 'pricing'>('dashboard');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]); 
  const [loading, setLoading] = useState(true);
  const [editingTariff, setEditingTariff] = useState<string | null>(null); 
  const [tempTariffValues, setTempTariffValues] = useState<Record<string, Partial<Tariff>>>({});

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
      const { data: reqData, error: reqError } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;
      setRequests(reqData || []);

      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profError) throw profError;
      setProfiles(profData || []);

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



  const filteredRequests = activeView === 'transport' ? requests.filter(r => r.service_type === 'transport')
    : activeView === 'workshop' ? requests.filter(r => r.service_type === 'workshop')
      : activeView === 'pending' ? requests.filter(r => r.status === 'confirmed' || r.status === 'draft' || r.status === 'pending')
        : requests;

  const filteredClients = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status === 'draft' || r.status === 'pending').length;



  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans text-gray-800 relative overflow-hidden">
        
        {/* ADMIN NAVIGATION TABS (Sticky below Global Header) */}
        <div className="bg-slate-50/95 backdrop-blur-sm z-30 sticky top-0 py-3 px-4 shadow-sm border-b border-slate-200/50 flex items-center gap-3 overflow-x-auto no-scrollbar snap-x">
             {/* Refresh Button - Integrated */}
             <button
                onClick={loadData}
                className={`p-2.5 rounded-xl bg-white text-slate-400 hover:text-sky-500 hover:shadow-sm border border-slate-100 hover:border-sky-100 transition-all flex-none snap-start ${loading ? 'animate-spin text-sky-500' : ''}`}
                title="Actualizar"
             >
                <RefreshCw className="w-4 h-4" />
             </button>

             <div className="w-px h-6 bg-slate-200 flex-none mx-1"></div>

             {/* Navigation Tabs */}
             <div className="flex items-center gap-2 flex-1 pr-4">
                 {[
                   { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
                   { id: 'pending', label: 'Solicitudes', icon: Clock, count: pendingCount },
                   { id: 'transport', label: 'Transporte', icon: Truck },
                   { id: 'workshop', label: 'Taller', icon: Wrench },
                   { id: 'clients', label: 'Clientes', icon: Users },
                   { id: 'pricing', label: 'Tarifas', icon: DollarSign }
                 ].map((tab) => (
                   <button
                      key={tab.id}
                      onClick={() => { setActiveView(tab.id as any); setSelectedClient(null); }}
                      className={`
                         relative px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap snap-start select-none
                         ${activeView === tab.id 
                           ? 'bg-white text-sky-600 shadow-sm ring-1 ring-sky-100' 
                           : 'text-slate-400 hover:text-sky-500 hover:bg-white/50'}
                      `}
                   >
                      <tab.icon className={`w-3.5 h-3.5 ${activeView === tab.id ? 'text-sky-500' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`
                          ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full
                          ${activeView === tab.id ? 'bg-sky-100 text-sky-600' : 'bg-red-100 text-red-500'}
                        `}>
                          {tab.count}
                        </span>
                      )}
                   </button>
                 ))}
             </div>
        </div>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 scroll-smooth pb-32">

        {/* SCROLLABLE MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-32 make-scroll-smooth">

          {/* 1. DASHBOARD VIEW */}
          {activeView === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              
              {/* WELCOME BANNER - SOFT STYLE */}
              <div className="bg-white rounded-[2rem] p-8 border border-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden">
                 <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black mb-2 text-slate-700 tracking-tight">Panel Administrativo</h1>
                        <p className="text-slate-400 font-medium max-w-lg text-lg">Bienvenido de nuevo. Tienes <span className="text-sky-500 font-bold">{pendingCount} solicitudes nuevas</span> hoy.</p>
                    </div>
                    
                    <button 
                       onClick={() => setActiveView('pending')}
                       className="bg-sky-100 hover:bg-sky-200 text-sky-600 px-6 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-3 transform hover:scale-105"
                    >
                       <Clock className="w-5 h-5" />
                       Gestionar Pendientes
                    </button>
                 </div>
                 {/* Decorative soft circles */}
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-sky-50/50 rounded-full blur-3xl opacity-60"></div>
                 <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-50/50 rounded-full blur-2xl opacity-60"></div>
              </div>

              {/* NAVIGATION HUB (Quick Access + KPIs) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
                 {/* Transporte Card */}
                 <div 
                    onClick={() => setActiveView('transport')}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-sky-200 transition-all cursor-pointer group relative overflow-hidden"
                 >
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm group-hover:shadow-sky-100">
                          <Truck className="w-7 h-7" />
                       </div>
                       <span className="text-3xl font-black text-slate-700 tracking-tighter">{requests.filter(r => r.service_type === 'transport').length}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-600 group-hover:text-sky-500 transition-colors">Transporte</h3>
                        <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">Rutas y Viajes</p>
                    </div>
                 </div>

                 {/* Taller Card */}
                 <div 
                    onClick={() => setActiveView('workshop')}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer group relative overflow-hidden"
                 >
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm group-hover:shadow-orange-100">
                          <Wrench className="w-7 h-7" />
                       </div>
                       <span className="text-3xl font-black text-slate-700 tracking-tighter">{requests.filter(r => r.service_type === 'workshop').length}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-600 group-hover:text-orange-500 transition-colors">Taller</h3>
                        <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">Mantenimiento</p>
                    </div>
                 </div>

                 {/* Clientes Card */}
                 <div 
                    onClick={() => setActiveView('clients')}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group relative overflow-hidden"
                 >
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm group-hover:shadow-purple-200">
                          <Users className="w-7 h-7" />
                       </div>
                       <span className="text-3xl font-black text-slate-800 tracking-tighter">{profiles.length}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-700 group-hover:text-purple-600 transition-colors">Clientes</h3>
                        <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">Base de Datos</p>
                    </div>
                 </div>
                 
                 {/* Tarifas Card */}
                 <div 
                    onClick={() => setActiveView('pricing')}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all cursor-pointer group relative overflow-hidden"
                 >
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm group-hover:shadow-green-200">
                          <DollarSign className="w-7 h-7" />
                       </div>
                       <span className="text-3xl font-black text-slate-800 tracking-tighter">{tariffs.length}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-700 group-hover:text-green-600 transition-colors">Tarifas</h3>
                        <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">Precios</p>
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
                      className="p-5 md:p-7 hover:bg-blue-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-5 cursor-pointer group"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${req.service_type === 'transport' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                          {req.service_type === 'transport' ? <Truck className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-lg mb-1 group-hover:text-blue-700 transition-colors">
                            {req.service_type === 'transport' ? 'Transporte' : 'Taller'}
                          </p>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md w-fit">
                             <Clock className="w-3 h-3" />
                             {new Date(req.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-14 sm:pl-0">
                         <span className="px-4 py-1.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-[10px] font-black uppercase tracking-widest">Pendiente</span>
                         <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm">
                            <ChevronRight className="w-5 h-5" />
                         </div>
                      </div>
                    </div>
                  ))}
                  
                  {requests.filter(r => r.status === 'pending').length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                         <CheckCircle className="w-10 h-10 text-emerald-500/80" />
                      </div>
                      <p className="text-slate-800 font-black text-xl mb-1">¡Todo al día!</p>
                      <p className="text-slate-400 font-medium text-sm">No hay solicitudes pendientes de revisión.</p>
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

              <div className="p-4 md:p-6 flex flex-col gap-4">
                {tariffs.map((t) => (
                  <div key={t.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    {/* Header: Category & Price */}
                    <div className="flex justify-between items-start mb-4">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${t.category === 'transport' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                          {t.category}
                       </span>

                       {editingTariff === t.id ? (
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">$</span>
                            <input
                              type="number"
                              className="w-24 pl-6 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none font-bold text-slate-800 text-sm"
                              value={tempTariffValues[t.id]?.price || 0}
                              onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], price: Number(e.target.value) } })}
                            />
                          </div>
                       ) : (
                          <span className="text-emerald-600 font-black text-lg">
                            ${t.price.toLocaleString()}
                          </span>
                       )}
                    </div>

                    {/* Content */}
                    <div className="space-y-3 mb-4">
                       <div>
                          <h4 className="text-slate-700 font-bold text-base leading-tight">
                            {t.sub_category.replace(/_/g, ' ')}
                          </h4>
                          {editingTariff === t.id ? (
                            <textarea
                              className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition-all resize-none text-xs"
                              value={tempTariffValues[t.id]?.description || ''}
                              onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], description: e.target.value } })}
                              rows={2}
                            />
                          ) : (
                            <p className="text-slate-400 text-sm mt-1 font-medium leading-relaxed">
                              {t.description || 'Sin descripción'}
                            </p>
                          )}
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-3 border-t border-slate-50">
                       {editingTariff === t.id ? (
                          <div className="flex gap-2">
                             <button onClick={() => handleUpdateTariff(t.id)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 text-xs font-bold flex items-center gap-1">
                               <CheckCircle className="w-4 h-4" /> Guardar
                             </button>
                             <button onClick={() => setEditingTariff(null)} className="px-4 py-2 bg-white border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-all active:scale-95 text-xs font-bold">
                               Cancelar
                             </button>
                          </div>
                       ) : (
                          <button onClick={() => startEditingTariff(t)} className="flex items-center gap-2 text-slate-400 hover:text-sky-600 transition-colors text-xs font-bold py-1 px-3 rounded-lg hover:bg-sky-50">
                             <Edit3 className="w-4 h-4" /> Editar Tarifa
                          </button>
                       )}
                    </div>
                  </div>
                ))}
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
                     <thead className="bg-slate-50/80 text-slate-600 font-extrabold uppercase tracking-wider text-xs border-b border-slate-200">
                       <tr>
                         <th className="p-5 text-left pl-8">Fecha</th>
                         <th className="p-5 text-left">Descripción</th>
                         <th className="p-5 text-right">Monto</th>
                         <th className="p-5 text-center pr-8">Estado</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {clientDebts.length === 0 ? (
                         <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-medium">Sin historial registrado para este cliente.</td></tr>
                       ) : (
                         clientDebts.map(debt => (
                           <tr key={debt.id} className="hover:bg-blue-50/30 transition-colors">
                             <td className="p-5 text-slate-600 font-bold pl-8">{new Date(debt.created_at).toLocaleDateString()}</td>
                             <td className="p-5 font-bold text-slate-800">{debt.description}</td>
                             <td className="p-5 text-right font-black text-slate-900">${debt.amount.toLocaleString()}</td>
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
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all shadow-sm">
                       <ChevronRight className="w-6 h-6" />
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
                    <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30 text-center md:text-left">
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className={`p-4 rounded-2xl shadow-sm border ${request.service_type === 'transport' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                          {request.service_type === 'transport' ? <Truck className="w-8 h-8" /> : <Wrench className="w-8 h-8" />}
                        </div>
                        <div className="flex flex-col items-center md:items-start">
                          <h3 className="font-black text-xl text-slate-800 mb-1">
                            {request.service_type === 'transport' ? 'Transporte' : 'Mantenimiento'}
                          </h3>
                          <p className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-100/50 shadow-sm flex items-center gap-2">
                             <Clock className="w-3.5 h-3.5 text-slate-400" />
                             {new Date(request.created_at).toLocaleDateString()} <span className="text-slate-300 mx-1">•</span> {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto justify-center">
                        <div className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm ${
                          request.status === 'confirmed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          request.status === 'in_process' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          request.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                          request.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-yellow-101 text-yellow-700 border-yellow-200'
                        }`}>
                          {request.status === 'confirmed' ? 'Confirmado' :
                           request.status === 'in_process' ? 'En Proceso' :
                           request.status === 'completed' ? 'Completado' :
                           request.status === 'cancelled' ? 'Cancelado' :
                           'Pendiente'}
                        </div>
                        
                        {/* Status Actions */}
                        {request.status === 'pending' && (
                          <div className="flex gap-2 ml-auto">
                             <button 
                               onClick={(e) => { e.stopPropagation(); updateStatus(request.id, 'confirmed'); }} 
                               className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
                               title="Confirmar Solicitud"
                             >
                               <CheckCircle className="w-5 h-5" />
                             </button>
                             <button 
                               onClick={(e) => { e.stopPropagation(); updateStatus(request.id, 'cancelled'); }} 
                               className="w-10 h-10 flex items-center justify-center bg-white text-rose-500 border border-rose-100 rounded-xl hover:bg-rose-50 hover:border-rose-200 hover:scale-105 active:scale-95 transition-all"
                               title="Cancelar Solicitud"
                             >
                               <XCircle className="w-5 h-5" />
                             </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Request Content */}
                    <div className="p-6 md:p-8">
                      {request.collected_data && (
                        <div className="bg-slate-50/80 rounded-[2rem] p-8 border border-slate-100/50">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-center gap-3 opacity-70">
                             <div className="w-8 h-0.5 bg-slate-300 rounded-full"></div> 
                             Datos del Servicio
                             <div className="w-8 h-0.5 bg-slate-300 rounded-full"></div>
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-sm">
                              {Object.entries(request.collected_data)
                                .filter(([k]) => k !== 'image_url')
                                .map(([k, v]) => (
                                  <div key={k} className="flex flex-col items-center text-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">{k.replace(/_/g, ' ')}</span>
                                    <span className="text-slate-700 font-bold text-lg leading-relaxed">{String(v)}</span>
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
                    <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex gap-3 justify-end items-center">
                       {request.status === 'confirmed' && <p className="text-xs font-bold text-blue-600 mr-auto flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> En espera de finalización</p>}
                       
                      {request.status === 'pending' && (
                         <button onClick={() => updateStatus(request.id, 'confirmed')} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                           <CheckCircle className="w-5 h-5" /> Confirmar Solicitud
                         </button>
                      )}
                      
                      {request.status === 'confirmed' && (
                        <button onClick={() => updateStatus(request.id, 'completed')} className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                           <CheckCircle className="w-5 h-5" /> Marcar Completado
                        </button>
                      )}

                      {(request.status !== 'cancelled' && request.status !== 'completed') && (
                        <button onClick={() => updateStatus(request.id, 'cancelled')} className="md:flex-none bg-white border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95">
                           Cancelar
                        </button>
                      )}
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

