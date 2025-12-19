import { useState, useEffect, type ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users, Truck, Wrench, Clock, DollarSign, Search,
  LayoutDashboard, ChevronRight, Edit3, User,
  ExternalLink, Plus, Upload, Link as LinkIcon, Trash2, Save, X, Globe
} from 'lucide-react';

import type { ServiceRequest, Profile, Tariff } from '../types';

interface Partner {
    id: string;
    name: string;
    logo_url: string;
    website_url: string;
    display_order: number;
    is_active: boolean;
}

export function AdminPanel() {
  const [activeView, setActiveView] = useState<'dashboard' | 'transport' | 'workshop' | 'pending' | 'clients' | 'pricing' | 'partners'>('dashboard');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]); 
  const [partners, setPartners] = useState<Partner[]>([]);

  // Partner Modal State
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<Partial<Partner> | null>(null);

  const [editingTariff, setEditingTariff] = useState<string | null>(null); 
  const [tempTariffValues, setTempTariffValues] = useState<Record<string, Partial<Tariff>>>({});

  // Client Management State
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const { data: reqData } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });
      setRequests(reqData || []);

      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setProfiles(profData || []);

      const { data: tariffData } = await supabase
        .from('tariffs')
        .select('*')
        .order('category', { ascending: true })
        .order('sub_category', { ascending: true });
      setTariffs(tariffData || []);

      const { data: partnerData } = await supabase
        .from('partners')
        .select('*')
        .order('display_order', { ascending: true });
      setPartners(partnerData || []);

    } catch (error) {
      console.error('Error loading data:', error);
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
          price: typeof updates.price === 'string' ? parseInt(updates.price as string) : updates.price,
          description: updates.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;

      setEditingTariff(null);
      loadData();
    } catch (error) {
      console.error('Error updating tariff:', error);
    }
  };

  const startEditingTariff = (t: Tariff) => {
    setEditingTariff(t.id);
    setTempTariffValues({
      ...tempTariffValues,
      [t.id]: { price: t.price, description: t.description }
    });
  };

  const handleClientSelect = (client: Profile) => {
    setSelectedClient(client);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // PARTNER MANAGEMENT LOGIC
  const openPartnerModal = (partner?: Partner) => {
      if (partner) {
          setCurrentPartner({ ...partner });
      } else {
          setCurrentPartner({
              name: '',
              logo_url: '',
              website_url: '',
              display_order: partners.length + 1,
              is_active: true
          });
      }
      setIsPartnerModalOpen(true);
  };

  const handleUploadLogo = async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `logos/${fileName}`;

          const { error: uploadError } = await supabase.storage
              .from('partners')
              .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
              .from('partners')
              .getPublicUrl(filePath);

          setCurrentPartner(prev => prev ? { ...prev, logo_url: publicUrl } : null);
      } catch (error) {
          console.error('Error uploading logo:', error);
          alert('Error al subir el logo');
      } finally {
          setIsUploading(false);
      }
  };

  const handleSavePartner = async () => {
      if (!currentPartner?.name || !currentPartner?.logo_url) {
          alert('Nombre y logo son obligatorios');
          return;
      }

      try {
          if (currentPartner.id) {
              const { error } = await supabase
                  .from('partners')
                  .update({
                      name: currentPartner.name,
                      logo_url: currentPartner.logo_url,
                      website_url: currentPartner.website_url,
                      display_order: currentPartner.display_order,
                      is_active: currentPartner.is_active
                  })
                  .eq('id', currentPartner.id);
              if (error) throw error;
          } else {
              const { error } = await supabase
                  .from('partners')
                  .insert({
                      name: currentPartner.name,
                      logo_url: currentPartner.logo_url,
                      website_url: currentPartner.website_url,
                      display_order: currentPartner.display_order,
                      is_active: currentPartner.is_active
                  });
              if (error) throw error;
          }
          setIsPartnerModalOpen(false);
          loadData();
      } catch (error) {
          console.error('Error saving partner:', error);
          alert('Error al guardar el socio');
      }
  };

  const handleDeletePartner = async (id: string) => {
      if (!confirm('¿Estás seguro de eliminar este socio?')) return;
      try {
          const { error } = await supabase.from('partners').delete().eq('id', id);
          if (error) throw error;
          loadData();
      } catch (error) {
          console.error('Error deleting partner:', error);
          alert('Error al eliminar el socio');
      }
  };

  const filteredRequests = activeView === 'transport' ? requests.filter(r => r.service_type === 'transport' && r.status !== 'draft' && r.status !== 'pending')
    : activeView === 'workshop' ? requests.filter(r => r.service_type === 'workshop' && r.status !== 'draft' && r.status !== 'pending')
      : activeView === 'pending' ? requests.filter(r => r.status === 'draft' || r.status === 'pending')
        : requests;

  const filteredClients = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status === 'draft' || r.status === 'pending').length;

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans text-gray-800 relative overflow-hidden">
        
        {/* ADMIN NAVIGATION TABS */}
        <div className="bg-slate-50/95 backdrop-blur-sm z-30 sticky top-0 py-3 px-4 shadow-sm border-b border-slate-200/50 flex items-center gap-3 overflow-x-auto no-scrollbar snap-x">
             <div className="flex items-center gap-2 flex-1 pr-4">
                 {[
                   { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
                   { id: 'pending', label: 'Solicitudes', icon: Clock, count: pendingCount },
                   { id: 'transport', label: 'Transporte', icon: Truck },
                   { id: 'workshop', label: 'Taller', icon: Wrench },
                   { id: 'clients', label: 'Clientes', icon: Users },
                   { id: 'pricing', label: 'Tarifas', icon: DollarSign },
                   { id: 'partners', label: 'Socios', icon: ExternalLink },
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
                      <tab.icon className={`w-4 h-4 ${activeView === tab.id ? 'text-sky-500' : 'text-slate-400'}`} />
                      <span className="hidden md:inline">{tab.label}</span>
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
          <div className="w-full max-w-7xl mx-auto p-4 md:p-8">

            {/* 1. DASHBOARD VIEW */}
            {activeView === 'dashboard' && (
              <div className="space-y-12">
                <div className="glass-card rounded-[40px] p-10 relative overflow-hidden group">
                   <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                      <div>
                          <h1 className="text-4xl md:text-5xl font-black mb-3 text-slate-800 tracking-tight">Panel Administrativo</h1>
                          <p className="text-slate-500 font-semibold text-lg md:text-xl">
                            Gestiona operaciones y solicitudes en tiempo real.
                          </p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <button 
                          onClick={() => setActiveView('pending')} 
                          className="bg-sky-600 text-white px-8 py-4 rounded-[20px] font-black text-sm shadow-xl shadow-sky-600/20 transition-all flex items-center gap-3 hover:translate-y-[-2px] active:scale-95"
                        >
                           <Clock className="w-5 h-5" /> 
                           <span>{pendingCount} Pendientes</span>
                        </button>
                      </div>
                   </div>
                   <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-sky-400/10 rounded-full blur-[100px] opacity-60 group-hover:opacity-80 transition-opacity"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                   <div onClick={() => setActiveView('transport')} className="premium-card p-8 group cursor-pointer border-none bg-white">
                      <div className="flex justify-between items-start mb-6">
                         <div className="w-16 h-16 bg-sky-50 rounded-[24px] flex items-center justify-center text-sky-500 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner"><Truck className="w-8 h-8" /></div>
                         <span className="text-4xl font-black text-slate-800 tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">{requests.filter(r => r.service_type === 'transport').length}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-700 mb-1">Transporte</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Rutas y Logística</p>
                   </div>
                   
                   <div onClick={() => setActiveView('workshop')} className="premium-card p-8 group cursor-pointer border-none bg-white">
                      <div className="flex justify-between items-start mb-6">
                         <div className="w-16 h-16 bg-rose-50 rounded-[24px] flex items-center justify-center text-rose-500 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner"><Wrench className="w-8 h-8" /></div>
                         <span className="text-4xl font-black text-slate-800 tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">{requests.filter(r => r.service_type === 'workshop').length}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-700 mb-1">Taller Técnico</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Mantenimiento</p>
                   </div>

                   <div onClick={() => setActiveView('clients')} className="premium-card p-8 group cursor-pointer border-none bg-white">
                      <div className="flex justify-between items-start mb-6">
                         <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center text-indigo-500 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner"><Users className="w-8 h-8" /></div>
                         <span className="text-4xl font-black text-slate-800 tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">{profiles.length}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-700 mb-1">Clientes</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Base de Usuarios</p>
                   </div>

                   <div onClick={() => setActiveView('pricing')} className="premium-card p-8 group cursor-pointer border-none bg-white">
                      <div className="flex justify-between items-start mb-6">
                         <div className="w-16 h-16 bg-emerald-50 rounded-[24px] flex items-center justify-center text-emerald-500 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner"><DollarSign className="w-8 h-8" /></div>
                         <span className="text-4xl font-black text-slate-800 tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">{tariffs.length}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-700 mb-1">Finanzas</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Tarifas y Precios</p>
                   </div>
                </div>
              </div>
            )}

            {/* 2. PRICING VIEW */}
            {activeView === 'pricing' && (
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                   <div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Tarifas</h2>
                      <p className="text-slate-500 font-semibold">{tariffs.length} configuraciones activas</p>
                   </div>
                   <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl">
                      <DollarSign className="w-8 h-8" />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tariffs.map((t) => (
                    <div key={t.id} className="premium-card p-8 bg-white border-none cursor-default group">
                      <div className="flex justify-between items-start mb-6">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${t.category === 'transport' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                           {t.category === 'transport' ? 'Transporte' : 'Taller'}
                         </span>
                         {editingTariff === t.id ? (
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-400 font-black">$</span>
                              <input type="number" className="w-32 pl-7 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-slate-800 focus:ring-2 focus:ring-sky-500/20" value={tempTariffValues[t.id]?.price || 0} onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], price: Number(e.target.value) } })} />
                            </div>
                         ) : (
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">${t.price.toLocaleString()}</span>
                         )}
                      </div>
                      <h4 className="text-slate-800 font-black text-lg mb-2 capitalize">{t.sub_category.replace(/_/g, ' ')}</h4>
                      {editingTariff === t.id ? (
                        <textarea className="w-full mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-sky-500/20" value={tempTariffValues[t.id]?.description || ''} onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], description: e.target.value } })} rows={3} />
                      ) : (
                        <p className="text-slate-400 font-semibold text-sm leading-relaxed mb-6">{t.description || 'Sin descripción detallada disponible.'}</p>
                      )}
                      
                      <div className="flex justify-end pt-6 border-t border-slate-50">
                         {editingTariff === t.id ? (
                            <div className="flex gap-3">
                               <button onClick={() => setEditingTariff(null)} className="px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                               <button onClick={() => handleUpdateTariff(t.id)} className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition-all">Guardar</button>
                            </div>
                         ) : (
                            <button onClick={() => startEditingTariff(t)} className="flex items-center gap-2 text-slate-400 hover:text-sky-600 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-transparent hover:border-sky-100 hover:bg-sky-50 transition-all">
                              <Edit3 className="w-4 h-4" /> 
                              <span>Editar</span>
                            </button>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. CLIENT MANAGEMENT */}
            {activeView === 'clients' && !selectedClient && (
              <div className="max-w-5xl mx-auto">
                <div className="mb-8 relative"><Search className="absolute left-5 top-4 w-5 h-5 text-slate-400" /><input type="text" placeholder="Buscar clientes..." className="w-full pl-14 p-4 border rounded-full outline-none bg-white font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <div className="grid gap-4">
                  {filteredClients.map(client => (
                    <div key={client.id} onClick={() => handleClientSelect(client)} className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-lg transition-all cursor-pointer flex justify-between items-center group">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 font-bold text-lg group-hover:bg-purple-500 group-hover:text-white transition-all shadow-sm">{client.full_name?.charAt(0) || <User className="w-6 h-6" />}</div>
                        <div><h3 className="font-bold text-slate-800 text-lg">{client.full_name || 'Sin Nombre'}</h3><p className="text-slate-400 text-sm">{client.email}</p></div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-purple-600 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedClient && (
              <div className="max-w-5xl mx-auto space-y-6">
                <button onClick={() => setSelectedClient(null)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 bg-white px-5 py-2.5 rounded-full shadow-sm border font-bold text-sm transition-all active:scale-95"><ChevronRight className="w-3 h-3 rotate-180" /> Volver a Clientes</button>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex gap-6">
                   <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20">{selectedClient.full_name?.charAt(0)}</div>
                   <div>
                     <h3 className="text-3xl font-black text-slate-800 tracking-tight">{selectedClient.full_name}</h3>
                     <p className="text-slate-500 font-medium">{selectedClient.email}</p>
                   </div>
                </div>
              </div>
            )}

            {/* 4. REQUEST LISTS */}
            {(activeView === 'transport' || activeView === 'workshop' || activeView === 'pending') && (
              <div className="grid gap-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-between px-4 mb-2">
                   <h2 className="text-2xl font-black text-slate-800 tracking-tight capitalize">{activeView}</h2>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{filteredRequests.length} Resultados</span>
                </div>

                {filteredRequests.length === 0 ? (
                  <div className="text-center py-24 premium-card border-dashed bg-white/50 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <LayoutDashboard className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-extrabold text-xs uppercase tracking-widest">No hay solicitudes en esta categoría.</p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div key={request.id} className="premium-card overflow-hidden bg-white border-none group">
                      <div className="p-8 md:p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-[24px] shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 ${request.service_type === 'transport' ? 'bg-sky-50 text-sky-600' : 'bg-rose-50 text-rose-600'}`}>
                             {request.service_type === 'transport' ? <Truck className="w-8 h-8" /> : <Wrench className="w-8 h-8" />}
                          </div>
                          <div>
                            <h3 className="font-black text-xl text-slate-800 tracking-tight mb-1">{request.service_type === 'transport' ? 'Transporte' : 'Servicio Técnico'}</h3>
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                 <Clock className="w-3.5 h-3.5" />
                                 {new Date(request.created_at).toLocaleDateString()} • {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${
                          request.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          request.status === 'in_process' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                          request.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' :
                          request.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-yellow-50 text-yellow-600 border-yellow-100'
                        }`}>
                          {request.status === 'pending' ? 'Por Confirmar' : request.status.replace('_', ' ')}
                        </div>
                      </div>
                      
                      <div className="p-8 md:p-10 bg-slate-50/30">
                         {request.collected_data && (
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                              {Object.entries(request.collected_data).filter(([k]) => k !== 'image_url' && k !== 'attachment_id' && k !== 'attachment_ids').map(([k, v]) => (
                                <div key={k} className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 border-b border-transparent group-hover:border-slate-100 pb-1 transition-all">{k.replace(/_/g, ' ')}</span>
                                  <span className="text-slate-700 font-bold text-sm leading-tight">{String(v)}</span>
                                </div>
                              ))}
                           </div>
                         )}
                         
                         {/* Images / Attachments */}
                         {(request.collected_data?.image_urls || request.collected_data?.image_url) && (
                            <div className="mt-8 pt-8 border-t border-slate-100/50">
                               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-4">Adjuntos</span>
                               <div className="flex flex-wrap gap-4">
                                  {Array.isArray(request.collected_data.image_urls) ? 
                                    request.collected_data.image_urls.map((url: string, i: number) => (
                                      <a key={i} href={url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 hover:border-sky-300 transition-all shadow-sm">
                                         <img src={url} className="w-full h-full object-cover" alt="attachment" />
                                      </a>
                                    )) : 
                                    <a href={request.collected_data.image_url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 hover:border-sky-300 transition-all shadow-sm">
                                       <img src={request.collected_data.image_url} className="w-full h-full object-cover" alt="attachment" />
                                    </a>
                                  }
                               </div>
                            </div>
                         )}
                      </div>

                      <div className="px-8 py-6 bg-white border-t border-slate-50 flex flex-wrap gap-3 justify-end items-center">
                        {request.status === 'pending' && <button onClick={() => updateStatus(request.id, 'confirmed')} className="bg-sky-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-sky-600/20 active:scale-95 transition-all hover:bg-sky-700">Confirmar</button>}
                        {request.status === 'confirmed' && <button onClick={() => updateStatus(request.id, 'in_process')} className="bg-purple-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-600/20 active:scale-95 transition-all hover:bg-purple-700">En Proceso</button>}
                        {(request.status === 'confirmed' || request.status === 'in_process') && <button onClick={() => updateStatus(request.id, 'completed')} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all hover:bg-emerald-700">Completar</button>}
                        {request.status !== 'cancelled' && request.status !== 'completed' && <button onClick={() => updateStatus(request.id, 'cancelled')} className="text-rose-400 hover:text-rose-600 text-xs font-black uppercase tracking-widest px-6 py-3 hover:bg-rose-50 rounded-2xl transition-all">Cancelar</button>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. PARTNERS MANAGEMENT */}
            {activeView === 'partners' && (
              <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="text-center md:text-left">
                       <h2 className="text-3xl font-black text-slate-800 mb-1">Gestión de Socios</h2>
                       <p className="text-slate-500 font-medium whitespace-nowrap">Administra los logos de las empresas en el Login y sus enlaces.</p>
                   </div>
                   <button onClick={() => openPartnerModal()} className="bg-sky-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-sky-500/20 flex items-center gap-2 hover:bg-sky-600 transition-all active:scale-95"><Plus className="w-5 h-5" /> Nuevo Socio</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {partners.map((p) => (
                    <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                      <div className="w-full h-32 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center p-6 grayscale group-hover:grayscale-0 transition-all overflow-hidden relative">
                        <img src={p.logo_url} alt={p.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="flex justify-between items-start mb-2">
                          <h3 className="font-black text-slate-800 text-lg leading-tight">{p.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${p.is_active ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                            {p.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                      </div>
                      <div className="flex items-center gap-2 text-sky-500 text-xs font-bold mb-4 opacity-70">
                          <Globe className="w-3 h-3" />
                          <span className="truncate">{p.website_url || 'Sin enlace'}</span>
                      </div>
                      <div className="mt-auto flex gap-2 pt-4 border-t border-slate-50">
                        <button onClick={() => openPartnerModal(p)} className="flex-1 py-2.5 rounded-xl bg-slate-50 text-[10px] font-black uppercase text-slate-500 hover:bg-sky-50 hover:text-sky-600 transition-all flex items-center justify-center gap-2">
                             <Edit3 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button onClick={() => handleDeletePartner(p.id)} className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all">
                             <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {partners.length === 0 && (
                      <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <ExternalLink className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-slate-400 font-bold">No hay socios registrados.</p>
                      </div>
                  )}
                </div>

                {/* MODAL PARA SOCIOS */}
                {isPartnerModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800">{currentPartner?.id ? 'Editar Socio' : 'Nuevo Socio'}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configura la imagen y enlace</p>
                                </div>
                                <button onClick={() => setIsPartnerModalOpen(false)} className="p-2.5 hover:bg-slate-50 rounded-full text-slate-300 hover:text-slate-600 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Logo Upload */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Logo de la Empresa</label>
                                    <div className="relative group">
                                        <div className={`w-full h-40 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 ${currentPartner?.logo_url ? 'border-sky-200 bg-sky-50/20' : 'border-slate-100 bg-slate-50/50 hover:border-sky-300 hover:bg-sky-50/50'}`}>
                                            {isUploading ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-xs font-bold text-sky-500 mt-3 uppercase tracking-widest">Subiendo...</span>
                                                </div>
                                            ) : currentPartner?.logo_url ? (
                                                <>
                                                    <img src={currentPartner.logo_url} className="max-h-full object-contain mb-2" alt="Preview" />
                                                    <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-3xl">
                                                        <label className="cursor-pointer bg-sky-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-sky-500/20">Cambiar Logo</label>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-slate-300 mb-2" />
                                                    <p className="text-xs text-slate-400 font-bold">Arrastra o haz clic para subir</p>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleUploadLogo} disabled={isUploading} />
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nombre del Socio</label>
                                        <input 
                                            type="text" 
                                            value={currentPartner?.name || ''} 
                                            onChange={e => setCurrentPartner(p => p ? {...p, name: e.target.value} : null)}
                                            placeholder="Ej: Teletón"
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all font-bold text-slate-600" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">URL de Redirección (Opcional)</label>
                                        <div className="relative flex items-center">
                                            <LinkIcon className="absolute left-4 w-4 h-4 text-slate-300" />
                                            <input 
                                                type="url" 
                                                value={currentPartner?.website_url || ''} 
                                                onChange={e => setCurrentPartner(p => p ? {...p, website_url: e.target.value} : null)}
                                                placeholder="https://ejemplo.com"
                                                className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all font-bold text-slate-600" 
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Orden</label>
                                            <input 
                                                type="number" 
                                                value={currentPartner?.display_order || 0} 
                                                onChange={e => setCurrentPartner(p => p ? {...p, display_order: parseInt(e.target.value)} : null)}
                                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-600" 
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-end pb-3">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentPartner?.is_active || false}
                                                    onChange={e => setCurrentPartner(p => p ? {...p, is_active: e.target.checked} : null)}
                                                    className="w-5 h-5 rounded-lg border-slate-200 text-sky-500 focus:ring-sky-500" 
                                                />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Estado Activo</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex gap-3">
                                <button 
                                    onClick={() => setIsPartnerModalOpen(false)}
                                    className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-xs font-black uppercase text-slate-400 hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSavePartner}
                                    disabled={isUploading}
                                    className="flex-1 py-4 rounded-2xl bg-sky-500 text-white text-xs font-black uppercase shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" /> Guardar Socio
                                </button>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            )}
          </div>
        </main>
    </div>
  );
}
