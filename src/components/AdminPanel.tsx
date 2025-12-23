import { useState, useEffect, type ChangeEvent } from 'react';
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
    <div className="flex flex-col min-h-full pb-24 bg-slate-50 dark:bg-background-dark transition-colors duration-500">
        
        {/* HEADER & NAV */}
        <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200/50 dark:border-gray-800 pt-10 pb-2 px-6 shadow-sm">
             <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-4">Panel Control</h1>
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
                         flex-none px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all snap-start select-none border
                         ${activeView === tab.id 
                           ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                           : 'bg-white dark:bg-surface-dark text-slate-400 dark:text-gray-400 border-slate-200 dark:border-gray-700 hover:border-primary/50 hover:text-primary'}
                      `}
                   >
                      <span className="material-symbols-outlined text-base">{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`
                          ml-1 px-1.5 py-0.5 rounded-full text-[9px]
                          ${activeView === tab.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-500'}
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
                <div onClick={() => setActiveView('pending')} className="bg-gradient-to-br from-primary to-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary/30 relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                           <span className="material-symbols-outlined text-2xl">notifications_active</span>
                        </div>
                        <span className="text-4xl font-black">{pendingCount}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">Solicitudes Pendientes</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Requieren atención inmediata</p>
                   </div>
                   {/* Decorative Circles */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                   <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-8 -mb-8 blur-xl"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div onClick={() => setActiveView('transport')} className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm active:scale-95 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-primary rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined filled">ambulance</span>
                      </div>
                      <span className="text-2xl font-black text-slate-800 dark:text-white block mb-1">{requests.filter(r => r.service_type === 'transport').length}</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transportes</p>
                   </div>

                   <div onClick={() => setActiveView('workshop')} className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm active:scale-95 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 text-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined filled">build</span>
                      </div>
                      <span className="text-2xl font-black text-slate-800 dark:text-white block mb-1">{requests.filter(r => r.service_type === 'workshop').length}</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taller</p>
                   </div>
                   
                   <div onClick={() => setActiveView('clients')} className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm active:scale-95 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined filled">group</span>
                      </div>
                      <span className="text-2xl font-black text-slate-800 dark:text-white block mb-1">{profiles.length}</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clientes</p>
                   </div>

                   <div onClick={() => setActiveView('pricing')} className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm active:scale-95 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined filled">payments</span>
                      </div>
                      <span className="text-2xl font-black text-slate-800 dark:text-white block mb-1">{tariffs.length}</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarifas</p>
                   </div>
                </div>
              </div>
            )}

            {/* 2. PRICING VIEW */}
            {activeView === 'pricing' && (
              <div className="space-y-4">
                  {tariffs.map((t) => (
                    <div key={t.id} className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${t.category === 'transport' ? 'bg-blue-50 text-primary border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50' : 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/50'}`}>
                           {t.category === 'transport' ? 'Transporte' : 'Taller'}
                         </span>
                         {editingTariff === t.id ? (
                            <div className="relative w-24">
                              <span className="absolute left-2 top-2 text-slate-400 font-black text-xs">$</span>
                              <input type="number" className="w-full pl-5 py-1.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg font-black text-sm text-slate-800 dark:text-white outline-none" value={tempTariffValues[t.id]?.price || 0} onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], price: Number(e.target.value) } })} />
                            </div>
                         ) : (
                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">${t.price.toLocaleString()}</span>
                         )}
                      </div>
                      <h4 className="text-slate-800 dark:text-gray-100 font-black text-base mb-2 capitalize">{t.sub_category.replace(/_/g, ' ')}</h4>
                      {editingTariff === t.id ? (
                        <textarea className="w-full p-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none text-gray-700 dark:text-gray-200 mb-4" value={tempTariffValues[t.id]?.description || ''} onChange={(e) => setTempTariffValues({ ...tempTariffValues, [t.id]: { ...tempTariffValues[t.id], description: e.target.value } })} rows={3} />
                      ) : (
                        <p className="text-slate-400 font-medium text-xs leading-relaxed mb-4">{t.description || 'Sin descripción.'}</p>
                      )}
                      
                      <div className="flex justify-end pt-2">
                         {editingTariff === t.id ? (
                            <div className="flex gap-2">
                               <button onClick={() => setEditingTariff(null)} className="px-4 py-2 bg-slate-100 dark:bg-gray-800 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                               <button onClick={() => handleUpdateTariff(t.id)} className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Guardar</button>
                            </div>
                         ) : (
                            <button onClick={() => startEditingTariff(t)} className="flex items-center gap-1 text-slate-400 hover:text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-all">
                              <span className="material-symbols-outlined text-sm">edit</span> Editar
                            </button>
                         )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* 3. CLIENT MANAGEMENT */}
            {activeView === 'clients' && !selectedClient && (
              <div className="space-y-4">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-3.5 text-slate-400">search</span>
                  <input type="text" placeholder="Buscar clientes..." className="w-full pl-12 p-3.5 border-none rounded-2xl bg-white dark:bg-surface-dark shadow-sm text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="grid gap-3">
                  {filteredClients.map(client => (
                    <div key={client.id} onClick={() => handleClientSelect(client)} className="p-4 bg-white dark:bg-surface-dark rounded-[1.5rem] shadow-sm flex items-center gap-4 cursor-pointer active:scale-95 transition-all">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                        {client.full_name?.charAt(0) || <span className="material-symbols-outlined">person</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 dark:text-gray-100 text-sm truncate">{client.full_name || 'Sin Nombre'}</h3>
                        <p className="text-slate-400 dark:text-gray-500 text-xs truncate">{client.email}</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedClient && (
              <div className="space-y-6">
                <button onClick={() => setSelectedClient(null)} className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-xs uppercase tracking-widest pl-2">
                  <span className="material-symbols-outlined text-sm rotate-180">chevron_right</span> 
                  Volver
                </button>
                <div className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] shadow-sm text-center">
                   <div className="w-20 h-20 bg-primary mx-auto rounded-full flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-primary/20 mb-4">
                     {selectedClient.full_name?.charAt(0)}
                   </div>
                   <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{selectedClient.full_name}</h3>
                   <p className="text-slate-500 dark:text-gray-400 font-bold text-sm mb-6">{selectedClient.email}</p>
                   
                   {/* Add more client details/actions here if needed */}
                </div>
              </div>
            )}

            {/* 4. REQUEST LISTS (Common for Transport, Workshop, Pending) */}
            {(activeView === 'transport' || activeView === 'workshop' || activeView === 'pending') && (
              <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-surface-dark border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem]">
                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">inbox</span>
                    <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest">Sin solicitudes</p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div key={request.id} className="bg-white dark:bg-surface-dark rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-50 dark:border-gray-800">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${request.service_type === 'transport' ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                                 <span className="material-symbols-outlined text-xl">{request.service_type === 'transport' ? 'local_shipping' : 'build'}</span>
                              </div>
                              <div>
                                 <h3 className="font-black text-sm text-slate-800 dark:text-white">{request.service_type === 'transport' ? 'Transporte' : 'Taller'}</h3>
                                 <p className="text-[10px] text-slate-400 font-bold">{new Date(request.created_at).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                             request.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                             request.status === 'in_process' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                             request.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' :
                             request.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                             'bg-yellow-50 text-yellow-600 border-yellow-100'
                           }`}>
                             {request.status === 'pending' ? 'Pendiente' : request.status}
                           </div>
                        </div>

                        {/* Data Grid */}
                        {request.collected_data && (
                           <div className="grid grid-cols-2 gap-3 mt-4">
                              {Object.entries(request.collected_data).filter(([k]) => !['image_url', 'attachment_id', 'attachment_ids', 'image_urls'].includes(k)).slice(0, 6).map(([k, v]) => (
                                <div key={k}>
                                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{k.replace(/_/g, ' ')}</p>
                                  <p className="text-slate-700 dark:text-gray-300 font-bold text-xs truncate">{String(v)}</p>
                                </div>
                              ))}
                           </div>
                        )}
                        
                        {/* Attachments Preview */}
                        {(request.collected_data?.image_urls || request.collected_data?.image_url) && (
                           <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex gap-2 overflow-x-auto pb-2">
                              {Array.isArray(request.collected_data.image_urls) ? 
                                request.collected_data.image_urls.map((url: string, i: number) => (
                                  <a key={i} href={url} target="_blank" rel="noreferrer" className="flex-none w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                                     <img src={url} className="w-full h-full object-cover" alt="attachment" />
                                  </a>
                                )) : 
                                request.collected_data.image_url && <a href={request.collected_data.image_url} target="_blank" rel="noreferrer" className="flex-none w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                                   <img src={request.collected_data.image_url} className="w-full h-full object-cover" alt="attachment" />
                                </a>
                              }
                           </div>
                        )}
                      </div>

                      <div className="px-6 py-4 bg-slate-50/50 dark:bg-gray-800/30 flex gap-2 justify-end overflow-x-auto">
                        {request.status === 'pending' && <button onClick={() => updateStatus(request.id, 'confirmed')} className="bg-primary text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap">Confirmar</button>}
                        {request.status === 'confirmed' && <button onClick={() => updateStatus(request.id, 'in_process')} className="bg-purple-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/20 active:scale-95 whitespace-nowrap">En Proceso</button>}
                        {(request.status === 'confirmed' || request.status === 'in_process') && <button onClick={() => updateStatus(request.id, 'completed')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 whitespace-nowrap">Completar</button>}
                        {request.status !== 'cancelled' && request.status !== 'completed' && <button onClick={() => updateStatus(request.id, 'cancelled')} className="px-4 py-2 text-rose-400 hover:text-rose-600 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Cancelar</button>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. PARTNERS MNGT */}
            {activeView === 'partners' && (
              <div className="space-y-4">
                 <button onClick={() => openPartnerModal()} className="w-full py-4 bg-primary/10 border border-dashed border-primary/30 rounded-2xl text-primary font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 mb-4 hover:bg-primary/20 transition-all">
                    <span className="material-symbols-outlined text-sm">add_circle</span> Nuevo Socio
                 </button>
                 <div className="grid grid-cols-2 gap-4">
                    {partners.map((p) => (
                      <div key={p.id} className="bg-white dark:bg-surface-dark p-4 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                         <div className="w-full h-20 bg-gray-50 dark:bg-gray-900 rounded-xl mb-3 flex items-center justify-center p-4 relative">
                            <img src={p.logo_url} alt={p.name} className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                            {!p.is_active && <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center"><span className="text-[9px] font-black uppercase bg-gray-200 text-gray-500 px-2 py-1 rounded-full">Inactivo</span></div>}
                         </div>
                         <h4 className="font-black text-slate-800 dark:text-white text-xs mb-1">{p.name}</h4>
                         <p className="text-[10px] text-slate-400 truncate w-full mb-3">{p.website_url || 'No URL'}</p>
                         <div className="flex gap-2 w-full mt-auto">
                           <button onClick={() => openPartnerModal(p)} className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-bold text-gray-500">Editar</button>
                           <button onClick={() => handleDeletePartner(p.id)} className="w-8 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg flex items-center justify-center"><span className="material-symbols-outlined text-sm">delete</span></button>
                         </div>
                      </div>
                    ))}
                 </div>

                 {/* PARTNER MODAL reusing logic but updated styled */}
                 {isPartnerModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-[2.5rem] shadow-2xl p-6 md:p-8 animate-slide-up">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">{currentPartner?.id ? 'Editar Socio' : 'Nuevo Socio'}</h3>
                                <button onClick={() => setIsPartnerModalOpen(false)} className="material-symbols-outlined text-slate-400">close</button>
                            </div>
                            
                            {/* Simplified Form for Mobile Context */}
                            <div className="space-y-4">
                               <div onClick={() => document.getElementById('logo-upload')?.click()} className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${currentPartner?.logo_url ? 'border-primary/50 bg-primary/5' : 'border-slate-200 dark:border-gray-700'}`}>
                                  {isUploading ? <span className="text-xs font-bold text-primary">Subiendo...</span> : currentPartner?.logo_url ? <img src={currentPartner.logo_url} className="h-20 object-contain" /> : <><span className="material-symbols-outlined text-slate-300">cloud_upload</span><span className="text-[10px] uppercase font-black text-slate-400">Subir Logo</span></>}
                                  <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleUploadLogo} disabled={isUploading} />
                               </div>
                               <input type="text" placeholder="Nombre" value={currentPartner?.name || ''} onChange={e => setCurrentPartner(p => p ? {...p, name: e.target.value} : null)} className="w-full p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" />
                               <input type="url" placeholder="Website URL" value={currentPartner?.website_url || ''} onChange={e => setCurrentPartner(p => p ? {...p, website_url: e.target.value} : null)} className="w-full p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" />
                               <div className="flex gap-4">
                                  <input type="number" placeholder="Orden" value={currentPartner?.display_order || 0} onChange={e => setCurrentPartner(p => p ? {...p, display_order: parseInt(e.target.value)} : null)} className="w-1/3 p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl text-sm font-bold outline-none" />
                                  <label className="flex-1 flex items-center gap-3 px-4 bg-slate-50 dark:bg-gray-800 rounded-2xl">
                                     <input type="checkbox" checked={currentPartner?.is_active || false} onChange={e => setCurrentPartner(p => p ? {...p, is_active: e.target.checked} : null)} className="text-primary focus:ring-primary w-5 h-5 rounded" />
                                     <span className="text-xs font-bold text-slate-600 dark:text-gray-300">Activo</span>
                                  </label>
                               </div>
                               <button onClick={handleSavePartner} disabled={isUploading} className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all">
                                  Guardar Cambios
                               </button>
                            </div>
                        </div>
                    </div>
                 )}
              </div>
            )}

            {/* 7. LEADS VIEW */}
            {activeView === 'leads' && (
               <div className="space-y-4">
                  {landingLeads.length === 0 ? (
                      <div className="py-12 text-center">
                         <span className="text-xs font-bold text-gray-400 uppercase">No hay leads nuevos</span>
                      </div>
                  ) : (
                      landingLeads.map(lead => (
                         <div key={lead.id} className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                               <h3 className="font-black text-slate-800 dark:text-white text-base">{lead.full_name}</h3>
                               <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${lead.status === 'new' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>{lead.status}</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-1">{lead.service_type}</p>
                            <p className="text-xs text-slate-400 font-mono mb-4">{lead.phone}</p>
                            <div className="bg-slate-50 dark:bg-gray-800 p-3 rounded-xl mb-4">
                               <p className="text-xs italic text-slate-600 dark:text-gray-300">"{lead.message}"</p>
                            </div>
                            <div className="flex gap-2 justify-end">
                               {lead.status === 'new' && <button onClick={() => updateLeadStatus(lead.id, 'contacted')} className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-lg">Contactar</button>}
                               <button onClick={() => handleDeleteLead(lead.id)} className="px-3 py-2 text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
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
