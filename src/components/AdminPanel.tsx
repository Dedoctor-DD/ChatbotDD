import { useState, useEffect, type ChangeEvent } from 'react';
import { LayoutDashboard, Clock, Truck, Wrench, Users, DollarSign, User, ExternalLink, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const [activeView, setActiveView] = useState<'dashboard' | 'transport' | 'workshop' | 'pending' | 'clients' | 'pricing' | 'partners' | 'leads'>('dashboard');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]); 
  const [partners, setPartners] = useState<Partner[]>([]);
  const [landingLeads, setLandingLeads] = useState<any[]>([]);

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

      const { data: leadsData } = await supabase
        .from('landing_leads')
        .select('*')
        .order('created_at', { ascending: false });
      setLandingLeads(leadsData || []);

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
  const newLeadsCount = landingLeads.filter(l => l.status === 'new').length;

  const handleDeleteLead = async (id: string) => {
    if (!confirm('¿Eliminar este cliente potencial?')) return;
    try {
      const { error } = await supabase.from('landing_leads').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
       console.error('Error deleting lead:', error);
    }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('landing_leads').update({ status }).eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
       console.error('Error updating lead status:', error);
    }
  };

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
                   { id: 'leads', label: 'Prospectos', icon: User, count: newLeadsCount },
                   { id: 'partners', label: 'Socios', icon: ExternalLink },
                 ].map((tab) => (
                   <button
                      key={tab.id}
                      onClick={() => { setActiveView(tab.id as any); setSelectedClient(null); }}
                      className={`
                         relative px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap snap-start select-none
                         ${activeView === tab.id 
                           ? 'bg-white text-primary shadow-sm ring-1 ring-primary/20' 
                           : 'text-slate-400 hover:text-primary hover:bg-white/50 dark:hover:bg-gray-800/50'}
                      `}
                   >
                       <tab.icon className={`w-4 h-4 ${activeView === tab.id ? 'text-primary' : 'text-slate-400'}`} />
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
                <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border border-gray-100 dark:border-gray-800 rounded-[3rem] p-10 relative overflow-hidden group">
                   <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                      <div>
                          <h1 className="text-4xl md:text-5xl font-black mb-3 text-slate-800 dark:text-white tracking-tight">Panel Administrativo</h1>
                          <p className="text-slate-500 dark:text-gray-400 font-semibold text-lg md:text-xl">
                            Gestiona operaciones y solicitudes en tiempo real.
                          </p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <button 
                          onClick={() => setActiveView('pending')} 
                          className="bg-primary text-white px-8 py-4 rounded-[20px] font-black text-sm shadow-xl shadow-primary/20 transition-all flex items-center gap-3 hover:translate-y-[-2px] active:scale-95 border-none"
                        >
                           <span className="material-symbols-outlined text-lg">schedule</span> 
                           <span>{pendingCount} Pendientes</span>
                        </button>
                      </div>
                   </div>
                   <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] opacity-60 group-hover:opacity-80 transition-opacity"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                   <div onClick={() => setActiveView('transport')} className="bg-white dark:bg-surface-dark p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                      <div className="flex justify-between items-start mb-6">
                          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-[24px] flex items-center justify-center text-primary transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                            <span className="material-symbols-outlined text-3xl filled">ambulance</span>
                          </div>
                          <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">{requests.filter(r => r.service_type === 'transport').length}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-700 dark:text-gray-200 mb-1">Transporte</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Rutas y Logística</p>
                   </div>
                   
                   <div onClick={() => setActiveView('workshop')} className="bg-white dark:bg-surface-dark p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                      <div className="flex justify-between items-start mb-6">
                          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-[24px] flex items-center justify-center text-orange-500 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                            <span className="material-symbols-outlined text-3xl filled">build</span>
                          </div>
                         <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">{requests.filter(r => r.service_type === 'workshop').length}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-700 dark:text-gray-200 mb-1">Taller Técnico</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Mantenimiento</p>
                   </div>

                   <div onClick={() => setActiveView('clients')} className="bg-white dark:bg-surface-dark p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                      <div className="flex justify-between items-start mb-6">
                          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-[24px] flex items-center justify-center text-primary transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                            <span className="material-symbols-outlined text-3xl filled">group</span>
                          </div>
                         <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">{profiles.length}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-700 dark:text-gray-200 mb-1">Clientes</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Base de Usuarios</p>
                   </div>

                   <div onClick={() => setActiveView('pricing')} className="bg-white dark:bg-surface-dark p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                      <div className="flex justify-between items-start mb-6">
                         <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-[24px] flex items-center justify-center text-emerald-500 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                           <span className="material-symbols-outlined text-4xl">attach_money</span>
                         </div>
                         <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">{tariffs.length}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-700 dark:text-gray-200 mb-1">Finanzas</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Tarifas y Precios</p>
                   </div>
                </div>
              </div>
            )}

            {/* 2. PRICING VIEW */}
            {activeView === 'pricing' && (
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                   <div>
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Gestión de Tarifas</h2>
                      <p className="text-slate-500 dark:text-gray-400 font-semibold">{tariffs.length} configuraciones activas</p>
                   </div>
                   <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl">
                      <span className="material-symbols-outlined text-3xl filled">payments</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tariffs.map((t) => (
                    <div key={t.id} className="bg-white dark:bg-surface-dark p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group">
                      <div className="flex justify-between items-start mb-6">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${t.category === 'transport' ? 'bg-blue-50 text-primary border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50' : 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/50'}`}>
                           {t.category === 'transport' ? 'Transporte' : 'Taller'}
                         </span>
                         {editingTariff === t.id ? (
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-400 font-black">$</span>
                              <input type="number" className="w-32 pl-7 p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl font-black text-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none" value={tempTariffValues[t.id]?.price || 0} onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], price: Number(e.target.value) } })} />
                            </div>
                         ) : (
                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">${t.price.toLocaleString()}</span>
                         )}
                      </div>
                      <h4 className="text-slate-800 dark:text-gray-100 font-black text-lg mb-2 capitalize">{t.sub_category.replace(/_/g, ' ')}</h4>
                      {editingTariff === t.id ? (
                        <textarea className="w-full mt-3 p-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none text-gray-700 dark:text-gray-200" value={tempTariffValues[t.id]?.description || ''} onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], description: e.target.value } })} rows={3} />
                      ) : (
                        <p className="text-slate-400 font-semibold text-sm leading-relaxed mb-6">{t.description || 'Sin descripción detallada disponible.'}</p>
                      )}
                      
                      <div className="flex justify-end pt-6 border-t border-slate-50 dark:border-gray-800">
                         {editingTariff === t.id ? (
                            <div className="flex gap-3">
                               <button onClick={() => setEditingTariff(null)} className="px-6 py-2.5 bg-slate-100 dark:bg-gray-800 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                               <button onClick={() => handleUpdateTariff(t.id)} className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all border-none">Guardar</button>
                            </div>
                         ) : (
                            <button onClick={() => startEditingTariff(t)} className="flex items-center gap-2 text-slate-400 hover:text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-transparent hover:border-primary/10 hover:bg-primary/5 transition-all">
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
                <div className="mb-8 relative">
                  <span className="material-symbols-outlined absolute left-5 top-4 text-slate-400">search</span>
                  <input type="text" placeholder="Buscar clientes..." className="w-full pl-14 p-4 border rounded-full outline-none bg-white dark:bg-surface-dark dark:border-gray-800 dark:text-white font-medium shadow-sm transition-all focus:ring-2 focus:ring-primary/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="grid gap-4">
                  {filteredClients.map(client => (
                    <div key={client.id} onClick={() => handleClientSelect(client)} className="p-5 bg-white dark:bg-surface-dark border border-slate-100 dark:border-gray-800 rounded-[2rem] shadow-sm hover:shadow-lg transition-all cursor-pointer flex justify-between items-center group">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                          {client.full_name?.charAt(0) || <span className="material-symbols-outlined">person</span>}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-gray-100 text-lg leading-tight">{client.full_name || 'Sin Nombre'}</h3>
                          <p className="text-slate-400 dark:text-gray-500 text-sm font-medium">{client.email}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-200 dark:text-gray-700 group-hover:text-primary transition-colors">chevron_right</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedClient && (
              <div className="max-w-5xl mx-auto space-y-6">
                <button onClick={() => setSelectedClient(null)} className="flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-primary bg-white dark:bg-surface-dark px-6 py-3 rounded-full shadow-sm border border-slate-100 dark:border-gray-800 font-bold text-sm transition-all active:scale-95 group uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm rotate-180 group-hover:-translate-x-1 transition-transform">chevron_right</span> 
                  Volver a Clientes
                </button>
                <div className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 flex items-center gap-8">
                   <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary/20">
                     {selectedClient.full_name?.charAt(0)}
                   </div>
                   <div>
                     <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{selectedClient.full_name}</h3>
                     <p className="text-slate-500 dark:text-gray-400 font-bold text-lg">{selectedClient.email}</p>
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
                  <div className="text-center py-24 bg-white dark:bg-surface-dark border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem]">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <span className="material-symbols-outlined text-4xl text-slate-200">dashboard</span>
                    </div>
                    <p className="text-slate-400 font-extrabold text-xs uppercase tracking-widest">No hay solicitudes en esta categoría.</p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div key={request.id} className="bg-white dark:bg-surface-dark rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group mb-6">
                      <div className="p-8 md:p-10 border-b border-slate-50 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-[24px] shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 ${request.service_type === 'transport' ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                             {request.service_type === 'transport' ? <span className="material-symbols-outlined text-3xl">truck</span> : <span className="material-symbols-outlined text-3xl">build</span>}
                          </div>
                          <div>
                            <h3 className="font-black text-xl text-slate-800 dark:text-gray-100 tracking-tight mb-1">{request.service_type === 'transport' ? 'Transporte' : 'Servicio Técnico'}</h3>
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                 <span className="material-symbols-outlined text-sm">schedule</span>
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
                      
                      <div className="p-8 md:p-10 bg-slate-50/30 dark:bg-gray-800/20">
                         {request.collected_data && (
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                              {Object.entries(request.collected_data).filter(([k]) => k !== 'image_url' && k !== 'attachment_id' && k !== 'attachment_ids' && k !== 'image_urls').map(([k, v]) => (
                                <div key={k} className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 border-b border-transparent group-hover:border-slate-100 dark:group-hover:border-gray-700 pb-1 transition-all">{k.replace(/_/g, ' ')}</span>
                                  <span className="text-slate-700 dark:text-gray-300 font-bold text-sm leading-tight">{String(v)}</span>
                                </div>
                              ))}
                           </div>
                         )}
                         
                         {/* Images / Attachments */}
                         {(request.collected_data?.image_urls || request.collected_data?.image_url) && (
                            <div className="mt-8 pt-8 border-t border-slate-100/50 dark:border-gray-800">
                               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-4">Adjuntos</span>
                               <div className="flex flex-wrap gap-4">
                                  {Array.isArray(request.collected_data.image_urls) ? 
                                    request.collected_data.image_urls.map((url: string, i: number) => (
                                      <a key={i} href={url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 dark:border-gray-700 hover:border-primary transition-all shadow-sm">
                                         <img src={url} className="w-full h-full object-cover" alt="attachment" />
                                      </a>
                                    )) : 
                                    request.collected_data.image_url && <a href={request.collected_data.image_url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 dark:border-gray-700 hover:border-primary transition-all shadow-sm">
                                       <img src={request.collected_data.image_url} className="w-full h-full object-cover" alt="attachment" />
                                    </a>
                                  }
                               </div>
                            </div>
                         )}
                      </div>

                      <div className="px-8 py-6 bg-white dark:bg-surface-dark border-t border-slate-50 dark:border-gray-800 flex flex-wrap gap-3 justify-end items-center">
                        {request.status === 'pending' && <button onClick={() => updateStatus(request.id, 'confirmed')} className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all hover:bg-blue-700 border-none">Confirmar</button>}
                        {request.status === 'confirmed' && <button onClick={() => updateStatus(request.id, 'in_process')} className="bg-purple-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-600/20 active:scale-95 transition-all hover:bg-purple-700 border-none">En Proceso</button>}
                        {(request.status === 'confirmed' || request.status === 'in_process') && <button onClick={() => updateStatus(request.id, 'completed')} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all hover:bg-emerald-700 border-none">Completar</button>}
                        {request.status !== 'cancelled' && request.status !== 'completed' && <button onClick={() => updateStatus(request.id, 'cancelled')} className="text-rose-400 hover:text-rose-600 text-xs font-black uppercase tracking-widest px-6 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-all">Cancelar</button>}
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
                   <button onClick={() => openPartnerModal()} className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 border-none">
                     <span className="material-symbols-outlined">add</span> Nuevo Socio
                   </button>
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
                      <div className="flex items-center gap-2 text-primary text-xs font-bold mb-4 opacity-70">
                          <span className="material-symbols-outlined text-sm">public</span>
                          <span className="truncate">{p.website_url || 'Sin enlace'}</span>
                      </div>
                      <div className="mt-auto flex gap-2 pt-4 border-t border-slate-50 dark:border-gray-800">
                        <button onClick={() => openPartnerModal(p)} className="flex-1 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 text-[10px] font-black uppercase text-slate-500 hover:bg-blue-50 hover:text-primary dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 border-none">
                             <span className="material-symbols-outlined text-sm">edit</span> Editar
                        </button>
                        <button onClick={() => handleDeletePartner(p.id)} className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 hover:bg-rose-100 transition-all border-none">
                             <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {partners.length === 0 && (
                      <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="material-symbols-outlined text-4xl text-slate-200">open_in_new</span>
                          </div>
                          <p className="text-slate-400 font-bold">No hay socios registrados.</p>
                      </div>
                  )}
                </div>

                {/* MODAL PARA SOCIOS */}
                {isPartnerModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up">
                            <div className="p-8 border-b border-slate-50 dark:border-gray-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{currentPartner?.id ? 'Editar Socio' : 'Nuevo Socio'}</h3>
                                    <p className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Configura la imagen y enlace</p>
                                </div>
                                <button onClick={() => setIsPartnerModalOpen(false)} className="p-2.5 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-full text-slate-300 dark:text-gray-600 hover:text-slate-600 dark:hover:text-gray-300 transition-all border-none">
                                    <span className="material-symbols-outlined">close</span>
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
                                                    <span className="text-xs font-bold text-primary mt-3 uppercase tracking-widest">Subiendo...</span>
                                                </div>
                                            ) : currentPartner?.logo_url ? (
                                                <>
                                                    <img src={currentPartner.logo_url} className="max-h-full object-contain mb-2" alt="Preview" />
                                                    <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-3xl">
                                                        <label className="cursor-pointer bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Cambiar Logo</label>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">upload</span>
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
                                            className="w-full p-4 bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-bold text-slate-600 dark:text-gray-200" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">URL de Redirección (Opcional)</label>
                                        <div className="relative flex items-center">
                                            <span className="material-symbols-outlined absolute left-4 text-slate-300">link</span>
                                            <input 
                                                type="url" 
                                                value={currentPartner?.website_url || ''} 
                                                onChange={e => setCurrentPartner(p => p ? {...p, website_url: e.target.value} : null)}
                                                placeholder="https://ejemplo.com"
                                                className="w-full pl-12 p-4 bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-bold text-slate-600 dark:text-gray-200" 
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
                                                    className="w-5 h-5 rounded-lg border-slate-200 dark:border-gray-700 text-primary focus:ring-primary bg-white dark:bg-surface-dark" 
                                                />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Estado Activo</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50/50 dark:bg-gray-900/50 border-t border-slate-50 dark:border-gray-800 flex gap-3">
                                <button 
                                    onClick={() => setIsPartnerModalOpen(false)}
                                    className="flex-1 py-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-gray-800 text-xs font-black uppercase text-slate-400 dark:text-gray-500 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSavePartner}
                                    disabled={isUploading}
                                    className="flex-1 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 border-none"
                                >
                                    <span className="material-symbols-outlined text-sm">save</span> Guardar Socio
                                </button>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            )}
            {/* 7. LANDING LEADS VIEW */}
            {activeView === 'leads' && (
              <div className="grid gap-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-between px-4 mb-2">
                   <h2 className="text-2xl font-black text-slate-800 tracking-tight">Clientes Potenciales (Landing)</h2>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{landingLeads.length} Registros</span>
                </div>

                {landingLeads.length === 0 ? (
                  <div className="text-center py-24 premium-card border-dashed bg-white/50 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Users className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-extrabold text-xs uppercase tracking-widest">No hay prospectos registrados.</p>
                  </div>
                ) : (
                  landingLeads.map((lead) => (
                    <div key={lead.id} className="premium-card overflow-hidden bg-white border-none group">
                      <div className="p-8 md:p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center ${lead.status === 'new' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                             <span className="material-symbols-outlined">person</span>
                          </div>
                          <div>
                            <h3 className="font-black text-xl text-slate-800 tracking-tight mb-1">{lead.full_name}</h3>
                            <div className="flex items-center gap-3">
                               <span className="text-[11px] font-black text-slate-400 tracking-tight flex items-center gap-1.5 uppercase">
                                 <span className="material-symbols-outlined text-sm">phone</span>
                                 {lead.phone}
                               </span>
                               <span className="text-slate-200">•</span>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 {new Date(lead.created_at).toLocaleDateString()}
                               </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                             lead.status === 'new' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                             lead.status === 'contacted' ? 'bg-sky-50 text-sky-600 border-sky-100' : 
                             'bg-slate-50 text-slate-400 border-slate-100'
                           }`}>
                             {lead.status === 'new' ? 'Nuevo' : lead.status === 'contacted' ? 'Contactado' : 'Finalizado'}
                           </span>
                        </div>
                      </div>
                      <div className="p-8 md:p-10 bg-slate-50/30">
                         <div className="flex flex-col mb-4">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Servicio solicitado</span>
                            <span className="text-slate-700 font-bold bg-white px-4 py-2 rounded-xl inline-block w-fit shadow-sm border border-slate-100">{lead.service_type}</span>
                         </div>
                         {lead.message && (
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Mensaje</span>
                              <p className="text-slate-600 font-medium text-sm leading-relaxed p-6 bg-white rounded-3xl border border-slate-100 italic">"{lead.message}"</p>
                           </div>
                         )}
                      </div>
                      <div className="px-8 py-6 bg-white dark:bg-surface-dark border-t border-slate-50 dark:border-gray-800 flex gap-3 justify-end items-center">
                        {lead.status === 'new' && (
                          <button onClick={() => updateLeadStatus(lead.id, 'contacted')} className="bg-primary text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:bg-blue-700 active:scale-95 border-none">Marcar Contactado</button>
                        )}
                        {lead.status === 'contacted' && (
                          <button onClick={() => updateLeadStatus(lead.id, 'done')} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95 border-none">Finalizar</button>
                        )}
                        <button onClick={() => handleDeleteLead(lead.id)} className="p-3 text-rose-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all border-none">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
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
