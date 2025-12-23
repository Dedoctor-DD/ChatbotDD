import { useState, useEffect, type ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import type { ServiceRequest, Profile, Tariff, Partner, LandingLead } from '../types';

export function AdminPanel() {
  const [activeView, setActiveView] = useState<'dashboard' | 'transport' | 'workshop' | 'pending' | 'clients' | 'pricing' | 'partners' | 'leads'>('dashboard');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]); 
  const [partners, setPartners] = useState<Partner[]>([]);
  const [landingLeads, setLandingLeads] = useState<LandingLead[]>([]);

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
    <div className="flex flex-col min-h-full pb-24 bg-slate-50 transition-colors duration-500">
        
        {/* HEADER & NAV */}
        <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/50 pt-10 pb-2 px-6 shadow-sm">
             <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-4">Panel Control</h1>
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar snap-x pb-2">
                 {[
                   { id: 'dashboard', label: 'Inicio', icon: 'dashboard' },
                   { id: 'pending', label: 'Solicitudes', icon: 'schedule', count: pendingCount },
                   { id: 'transport', label: 'Transporte', icon: 'ambulance' },
                   { id: 'workshop', label: 'Taller', icon: 'build' },
                   { id: 'clients', label: 'Clientes', icon: 'group' },
                   { id: 'pricing', label: 'Tarifas', icon: 'payments' },
                   { id: 'leads', label: 'Leads', icon: 'person_add', count: newLeadsCount },
                   { id: 'partners', label: 'Socios', icon: 'verified' },
                 ].map((tab) => (
                   <button
                      key={tab.id}
                      onClick={() => { setActiveView(tab.id as any); setSelectedClient(null); }}
                      className={`
                         flex-none px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all snap-start select-none border-none
                         ${activeView === tab.id 
                           ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                           : 'bg-white text-slate-400 hover:text-primary'}
                      `}
                   >
                      <span className="material-symbols-outlined text-base">{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`
                          ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black
                          ${activeView === tab.id ? 'bg-white/20 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}
                        `}>
                          {tab.count}
                        </span>
                      )}
                   </button>
                 ))}
             </div>
        </div>

        {/* CONTENT AREA */}
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
            {/* 1. DASHBOARD OVERVIEW */}
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                {/* Pending Actions Card */}
                <div onClick={() => setActiveView('pending')} className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
                   <div className="relative z-10 flex items-center justify-between">
                      <div>
                         <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                            <span className="material-symbols-outlined text-3xl text-primary animate-pulse">notifications_active</span>
                         </div>
                         <h3 className="text-2xl font-black tracking-tight mb-1">Solicitudes Pendientes</h3>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Gestión inmediata requerida</p>
                      </div>
                      <div className="text-5xl font-black text-white/90">{pendingCount}</div>
                   </div>
                   {/* Decorative Circles */}
                   <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                   {[
                     { id: 'transport', label: 'Transportes', icon: 'ambulance', color: 'blue', count: requests.filter(r => r.service_type === 'transport').length },
                     { id: 'workshop', label: 'Taller', icon: 'precision_manufacturing', color: 'rose', count: requests.filter(r => r.service_type === 'workshop').length },
                     { id: 'clients', label: 'Clientes', icon: 'group', color: 'purple', count: profiles.length },
                     { id: 'pricing', label: 'Tarifas', icon: 'payments', color: 'emerald', count: tariffs.length },
                   ].map((stat) => (
                    <div key={stat.id} onClick={() => setActiveView(stat.id as any)} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-2xl shadow-slate-200/50 active:scale-95 transition-all cursor-pointer group relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6 bg-${stat.color}-50 text-${stat.color}-600`}>
                         <span className="material-symbols-outlined filled">{stat.icon}</span>
                       </div>
                       <span className="text-2xl font-black text-slate-800 block mb-1 tracking-tighter">{stat.count}</span>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    </div>
                   ))}
                </div>
              </div>
            )}

            {/* 2. PRICING VIEW */}
            {activeView === 'pricing' && (
              <div className="space-y-5">
                  {tariffs.map((t) => (
                    <div key={t.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-2xl shadow-slate-200/50 group">
                      <div className="flex justify-between items-start mb-6">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${t.category === 'transport' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                           {t.category === 'transport' ? 'Transporte' : 'Workshop'}
                         </span>
                         {editingTariff === t.id ? (
                            <div className="relative w-28">
                              <span className="absolute left-3 top-2.5 text-slate-400 font-black text-xs">$</span>
                              <input type="number" className="w-full pl-6 pr-3 py-2.5 bg-slate-50 border-none rounded-xl font-black text-sm text-slate-800 outline-none ring-2 ring-transparent focus:ring-primary/20" value={tempTariffValues[t.id]?.price || 0} onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], price: Number(e.target.value) } })} />
                            </div>
                         ) : (
                            <span className="text-2xl font-black text-slate-900 tracking-tight">${t.price.toLocaleString()}</span>
                         )}
                      </div>
                      <h4 className="text-slate-800 font-black text-base mb-2 tracking-tight uppercase leading-none">{t.sub_category.replace(/_/g, ' ')}</h4>
                      {editingTariff === t.id ? (
                        <textarea className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-medium outline-none text-slate-700 mb-6 ring-2 ring-transparent focus:ring-primary/20" value={tempTariffValues[t.id]?.description || ''} onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], description: e.target.value } })} rows={3} />
                      ) : (
                        <p className="text-slate-400 font-medium text-xs leading-relaxed mb-6 italic">"{t.description || 'Sin descripción detallada.'}"</p>
                      )}
                      
                      <div className="flex justify-end pt-2">
                         {editingTariff === t.id ? (
                            <div className="flex gap-3">
                               <button onClick={() => setEditingTariff(null)} className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancelar</button>
                               <button onClick={() => handleUpdateTariff(t.id)} className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">Guardar</button>
                            </div>
                         ) : (
                            <button onClick={() => startEditingTariff(t)} className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl bg-primary/5 hover:bg-primary/10 transition-all border-none">
                              <span className="material-symbols-outlined text-base">edit</span> 
                              Editar Tarifa
                            </button>
                         )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* 3. CLIENT MANAGEMENT */}
            {activeView === 'clients' && !selectedClient && (
              <div className="space-y-6">
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-6 top-5 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                  <input type="text" placeholder="Buscar por nombre o email..." className="w-full pl-14 pr-6 py-5 border-none rounded-[2rem] bg-white shadow-2xl shadow-slate-200/50 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="grid gap-4">
                  {filteredClients.map(client => (
                    <div key={client.id} onClick={() => handleClientSelect(client)} className="p-6 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 flex items-center gap-5 cursor-pointer active:scale-98 hover:translate-x-1 transition-all group">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary font-black text-xl group-hover:scale-110 transition-transform">
                        {client.full_name?.charAt(0) || <span className="material-symbols-outlined">person</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-800 text-base tracking-tight truncate uppercase leading-none mb-1">{client.full_name || 'Usuario Anonimo'}</h3>
                        <p className="text-slate-400 font-bold text-[10px] truncate tracking-widest uppercase">{client.email}</p>
                      </div>
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedClient && (
              <div className="space-y-6 animate-fade-in">
                <button onClick={() => setSelectedClient(null)} className="flex items-center gap-3 text-slate-400 hover:text-primary font-black text-[10px] uppercase tracking-widest pl-2 transition-colors border-none bg-transparent">
                  <span className="material-symbols-outlined text-base">arrow_back</span> 
                  Volver a la lista
                </button>
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 text-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                   <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 mx-auto rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-primary/30 mb-6 relative z-10">
                     {selectedClient.full_name?.charAt(0)}
                   </div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2 relative z-10">{selectedClient.full_name}</h3>
                   <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-8 relative z-10">{selectedClient.email}</p>
                   
                   <div className="grid grid-cols-2 gap-4 mt-10">
                      <div className="p-6 bg-slate-50 rounded-[2rem]">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registrado</p>
                         <p className="text-xs font-black text-slate-800 tracking-tight">{new Date(selectedClient.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-[2rem]">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Servicios</p>
                         <p className="text-xs font-black text-slate-800 tracking-tight">{requests.filter(r => r.user_id === selectedClient.id).length}</p>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* 4. REQUEST LISTS (Common for Transport, Workshop, Pending) */}
            {(activeView === 'transport' || activeView === 'workshop' || activeView === 'pending') && (
              <div className="space-y-6">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-24 bg-white border border-slate-100 rounded-[3rem] shadow-inner">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                       <span className="material-symbols-outlined text-5xl text-slate-200">folder_open</span>
                    </div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Cero solicitudes encontradas</p>
                  </div>
                ) : (
                   filteredRequests.map((request) => (
                    <div key={request.id} className="bg-white rounded-[3rem] border border-slate-50 shadow-2xl shadow-slate-200/50 overflow-hidden animate-fade-in group">
                      <div className="p-8 border-b border-slate-50">
                        <div className="flex justify-between items-start mb-8">
                           <div className="flex items-center gap-5">
                              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform ${request.service_type === 'transport' ? 'bg-blue-50/50 text-blue-600' : 'bg-rose-50/50 text-rose-600'}`}>
                                 <span className="material-symbols-outlined text-3xl filled">{request.service_type === 'transport' ? 'local_shipping' : 'precision_manufacturing'}</span>
                              </div>
                              <div>
                                 <h3 className="font-black text-lg text-slate-800 tracking-tight uppercase leading-none mb-1">{request.service_type === 'transport' ? 'Transporte' : 'Workshop'}</h3>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {new Date(request.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                              </div>
                           </div>
                           <div className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                             request.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                             request.status === 'in_process' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                             request.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             request.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                             'bg-amber-50 text-amber-600 border-amber-100'
                           }`}>
                             {request.status === 'pending' ? 'Pendiente' : request.status.replace('_', ' ')}
                           </div>
                        </div>

                        {/* Data Grid Premium */}
                        {request.collected_data && (
                           <div className="grid grid-cols-2 gap-x-8 gap-y-6 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100/50">
                              {Object.entries(request.collected_data).filter(([k]) => !['image_url', 'attachment_id', 'attachment_ids', 'image_urls'].includes(k)).slice(0, 10).map(([k, v]) => (
                                <div key={k} className="min-w-0">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{k.replace(/_/g, ' ')}</p>
                                  <p className="text-slate-800 font-black text-xs truncate tracking-tight">{String(v)}</p>
                                </div>
                              ))}
                           </div>
                        )}
                        
                        {/* Attachments Preview Premium */}
                        {(request.collected_data?.image_urls || request.collected_data?.image_url) && (
                           <div className="mt-8 pt-6 border-t border-slate-50 flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest absolute -mt-6">Adjuntos:</p>
                              {Array.isArray(request.collected_data.image_urls) ? 
                                request.collected_data.image_urls.map((url: string, i: number) => (
                                  <a key={i} href={url} target="_blank" rel="noreferrer" className="flex-none w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 hover:scale-105 transition-transform shadow-xl shadow-slate-200/40">
                                     <img src={url} className="w-full h-full object-cover" alt="attachment" />
                                  </a>
                                )) : 
                                request.collected_data.image_url && <a href={request.collected_data.image_url} target="_blank" rel="noreferrer" className="flex-none w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 hover:scale-105 transition-transform shadow-xl shadow-slate-200/40">
                                   <img src={request.collected_data.image_url} className="w-full h-full object-cover" alt="attachment" />
                                </a>
                              }
                           </div>
                        )}
                      </div>

                      <div className="px-8 py-6 bg-white flex gap-4 justify-end items-center">
                        <div className="flex-1">
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">REF: {request.id.slice(0, 8)}</span>
                        </div>
                        {request.status === 'pending' && <button onClick={() => updateStatus(request.id, 'confirmed')} className="bg-primary text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 border-none">Confirmar</button>}
                        {request.status === 'confirmed' && <button onClick={() => updateStatus(request.id, 'in_process')} className="bg-purple-600 text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-purple-600/30 hover:bg-purple-700 transition-all active:scale-95 border-none">En Proceso</button>}
                        {(request.status === 'confirmed' || request.status === 'in_process') && <button onClick={() => updateStatus(request.id, 'completed')} className="bg-emerald-600 text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all active:scale-95 border-none">Finalizar</button>}
                        {request.status !== 'cancelled' && request.status !== 'completed' && <button onClick={() => updateStatus(request.id, 'cancelled')} className="px-6 py-4 text-slate-400 hover:text-rose-500 text-[10px] font-black uppercase tracking-widest transition-colors border-none bg-transparent">Anular</button>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. PARTNERS MNGT PREMIUM */}
            {activeView === 'partners' && (
              <div className="space-y-6">
                 <button onClick={() => openPartnerModal()} className="w-full py-6 bg-primary/5 border-2 border-dashed border-primary/20 rounded-[2.5rem] text-primary font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 mb-6 hover:bg-primary/10 hover:border-primary/40 transition-all group">
                    <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform">add_circle</span> 
                    Agregar Nuevo Socio
                 </button>
                 <div className="grid grid-cols-2 gap-5">
                     {partners.map((p) => (
                      <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center relative overflow-hidden group">
                         <div className="w-full h-28 bg-slate-50/50 rounded-2xl mb-4 flex items-center justify-center p-6 relative group-hover:bg-slate-50 transition-colors">
                            <img src={p.logo_url} alt={p.name} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                            {!p.is_active && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center"><span className="text-[9px] font-black uppercase bg-slate-200 text-slate-500 px-3 py-1.5 rounded-full tracking-widest">Inactivo</span></div>}
                         </div>
                         <h4 className="font-black text-slate-800 text-sm mb-1 tracking-tight uppercase leading-none">{p.name}</h4>
                         <p className="text-[9px] text-slate-400 font-bold truncate w-full mb-4 px-2 uppercase tracking-tighter">{p.website_url || 'URL no especificada'}</p>
                         <div className="flex gap-2 w-full mt-auto">
                           <button onClick={() => openPartnerModal(p)} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest transition-colors border-none">Editar</button>
                           <button onClick={() => handleDeletePartner(p.id)} className="w-11 h-11 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-colors border-none"><span className="material-symbols-outlined text-lg">delete</span></button>
                         </div>
                      </div>
                    ))}
                 </div>

                 {/* PARTNER MODAL PREMIUM */}
                 {isPartnerModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
                        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-8 md:p-10 animate-slide-up relative overflow-hidden">
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{currentPartner?.id ? 'Editar Socio' : 'Nuevo Socio'}</h3>
                                <button onClick={() => setIsPartnerModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 border-none transition-colors"><span className="material-symbols-outlined">close</span></button>
                            </div>
                            
                            <div className="space-y-5 relative z-10">
                               <div onClick={() => document.getElementById('logo-upload')?.click()} className={`w-full h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${currentPartner?.logo_url ? 'border-primary/40 bg-primary/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
                                  {isUploading ? <div className="flex flex-col items-center gap-2"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div><span className="text-[10px] font-black text-primary uppercase tracking-widest">Subiendo...</span></div> : currentPartner?.logo_url ? <img src={currentPartner.logo_url} className="h-24 object-contain mix-blend-multiply" /> : <><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm"><span className="material-symbols-outlined text-2xl">cloud_upload</span></div><span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Seleccionar Logo</span></>}
                                  <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleUploadLogo} disabled={isUploading} />
                               </div>
                               <input type="text" placeholder="Nombre de la empresa" value={currentPartner?.name || ''} onChange={e => setCurrentPartner(p => p ? {...p, name: e.target.value} : null)} className="w-full p-5 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none ring-2 ring-transparent focus:ring-primary/20 placeholder:text-slate-300" />
                               <input type="url" placeholder="URL Web (ej: https://...)" value={currentPartner?.website_url || ''} onChange={e => setCurrentPartner(p => p ? {...p, website_url: e.target.value} : null)} className="w-full p-5 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none ring-2 ring-transparent focus:ring-primary/20 placeholder:text-slate-300" />
                               <div className="flex gap-4">
                                  <div className="w-1/3">
                                     <input type="number" placeholder="Orden" value={currentPartner?.display_order || 0} onChange={e => setCurrentPartner(p => p ? {...p, display_order: parseInt(e.target.value)} : null)} className="w-full p-5 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none ring-2 ring-transparent focus:ring-primary/20 text-center" />
                                  </div>
                                  <label className="flex-1 flex items-center justify-between px-6 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Socio Activo</span>
                                     <input type="checkbox" checked={currentPartner?.is_active || false} onChange={e => setCurrentPartner(p => p ? {...p, is_active: e.target.checked} : null)} className="w-6 h-6 rounded-lg border-none bg-slate-200 text-primary focus:ring-primary/20" />
                                  </label>
                               </div>
                               <button onClick={handleSavePartner} disabled={isUploading} className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-primary/30 active:scale-95 transition-all mt-4 border-none disabled:opacity-50">
                                  Confirmar y Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                 )}
              </div>
            )}

            {/* 7. LEADS VIEW PREMIUM */}
            {activeView === 'leads' && (
               <div className="space-y-6">
                  {landingLeads.length === 0 ? (
                      <div className="py-24 text-center bg-white border border-slate-100 rounded-[3rem] shadow-inner">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <span className="material-symbols-outlined text-5xl text-slate-200">contact_mail</span>
                        </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No hay nuevos leads registrados</p>
                      </div>
                  ) : (
                      landingLeads.map(lead => (
                         <div key={lead.id} className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-2xl shadow-slate-200/50 relative overflow-hidden group animate-fade-in">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                            
                            <div className="flex justify-between items-start mb-8 relative z-10">
                               <div className="flex items-center gap-5">
                                  <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                     <span className="material-symbols-outlined text-3xl">person</span>
                                  </div>
                                  <div>
                                     <h3 className="font-black text-xl text-slate-800 tracking-tight uppercase leading-none mb-2">{lead.full_name}</h3>
                                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{lead.service_type}</p>
                                  </div>
                               </div>
                               <span className={`text-[9px] font-black px-5 py-2.5 rounded-full uppercase tracking-[0.2em] shadow-sm border ${lead.status === 'new' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                  {lead.status === 'new' ? 'Pendiente' : 'Contactado'}
                               </span>
                            </div>
                            
                            <div className="space-y-5 mb-10 relative z-10">
                               <div className="flex items-center gap-4 text-slate-600 bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100/50">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                                     <span className="material-symbols-outlined text-xl">phone_iphone</span>
                                  </div>
                                  <p className="text-sm font-black text-slate-800 font-mono tracking-tighter">{lead.phone}</p>
                               </div>
                               <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50 relative">
                                  <span className="material-symbols-outlined text-slate-200 absolute right-6 top-6 text-4xl opacity-50">format_quote</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Mensaje Recibido</span>
                                  <p className="text-sm font-medium text-slate-700 leading-relaxed italic relative z-10">"{lead.message}"</p>
                               </div>
                            </div>

                            <div className="flex gap-4 relative z-10">
                               <a 
                                 href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="flex-1 py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-center no-underline"
                               >
                                  <span className="material-symbols-outlined text-lg">message</span>
                                  Contactar WhatsApp
                               </a>
                               {lead.status === 'new' && (
                                 <button 
                                   onClick={() => updateLeadStatus(lead.id, 'contacted')}
                                   className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/30 flex items-center justify-center gap-3 active:scale-95 transition-all border-none"
                                 >
                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                    Cerrar Lead
                                 </button>
                               )}
                               <button onClick={() => handleDeleteLead(lead.id)} className="w-16 h-16 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-rose-500/10 hover:bg-rose-100 transition-colors active:scale-90 border-none">
                                  <span className="material-symbols-outlined text-2xl">delete</span>
                               </button>
                            </div>
                         </div>
                      ))
                  )}
               </div>
            )}
        </main>
    </div>
  );
}
