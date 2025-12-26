import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PhotoGallery } from './PhotoGallery';
import { HeroSection } from './HeroSection';
import { MissionVisionSection } from './MissionVisionSection';


interface LandingPageProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    service_type: 'Traslado DeDoctor',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');

    try {
      const { error } = await supabase
        .from('landing_leads')
        .insert([
          {
            full_name: formData.full_name,
            phone: formData.phone,
            service_type: formData.service_type,
            message: formData.message
          }
        ]);

      if (error) throw error;
      setFormStatus('success');
      setFormData({ full_name: '', phone: '', service_type: 'Traslado DeDoctor', message: '' });
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (error) {
      console.error('Error submitting lead:', error);
      setFormStatus('error');
    }
  };

  return (
    <div className="flex justify-center h-[100dvh] bg-white overflow-hidden font-jakarta relative">
      {/* Ambient Background for PC */}
      <div className="hidden md:block absolute inset-0 z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow [animation-delay:3s]"></div>
      </div>

      <main className="w-full bg-white h-[100dvh] max-h-[100dvh] relative overflow-hidden flex flex-col z-10 transition-all duration-500">
      <header className="w-full bg-white/60 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-lg relative overflow-hidden group">
            <img src="/icon-192.png" alt="DeDoctor" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-[11px] uppercase tracking-[0.2em] leading-tight text-slate-800">
              DeDoctor <span className="text-primary font-black">&</span> MMC
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Grupo de Movilidad</p>
          </div>
        </div>
        <button 
          onClick={onLoginClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition shadow-xl shadow-primary/20 border-none active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">person</span>
          Acceso
        </button>
        </div>
      </header>

      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden pt-4 pb-24 scroll-smooth no-scrollbar">
        <div className="flex flex-col px-6 max-w-7xl mx-auto w-full">
          <HeroSection onActionClick={onLoginClick} />
          
          <div id="details">
            <MissionVisionSection />
          </div>

          {/* Photo Gallery Section */}
          <section className="mb-16">
             <header className="mb-8 px-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Nuestra <span className="text-primary">Flota</span></h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Excelencia en cada unidad</p>
             </header>
             <PhotoGallery />
          </section>

          {/* Contact Form */}
          <section id="contacto" className="mb-12">
            <div className="bg-white rounded-4xl p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 tracking-tight">
                <span className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                   <span className="material-symbols-outlined text-primary text-xl filled">mail</span>
                </span>
                Solicitud Rápida
              </h3>
              
              {formStatus === 'success' ? (
                <div className="py-12 text-center animate-scale-in">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¡Mensaje Enviado!</h4>
                  <p className="text-sm font-medium text-slate-500 mb-8">Te contactaremos por WhatsApp en los próximos minutos.</p>
                  <button 
                    onClick={() => setFormStatus('idle')}
                    className="text-primary font-black text-xs uppercase tracking-widest bg-primary/5 px-6 py-3 rounded-xl border-none hover:bg-primary/10 transition-all"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                      <input 
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                        placeholder="Ej: Manuel García"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Teléfono</label>
                       <input 
                        required type="tel"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                        placeholder="+56 9 XXXX XXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Servicio</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Traslado DeDoctor', 'Taller MMC'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({...formData, service_type: type})}
                          className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            formData.service_type === type 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                            : 'bg-white text-slate-400 border-slate-50 hover:border-primary/20'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detalles de tu consulta</label>
                    <textarea 
                      required rows={4}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" 
                      placeholder="Danos una breve descripción de lo que necesitas..."
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>
                  <button 
                    disabled={formStatus === 'loading'}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 border-none disabled:opacity-70 active:scale-95 transition-all group"
                  >
                    {formStatus === 'loading' ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">send</span>
                        Enviar Solicitud
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>

        <footer className="w-full border-t border-slate-50 bg-white mt-10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col items-center gap-6">
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-100 active:scale-90 shadow-sm overflow-hidden group">
                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">social_leaderboard</span>
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-100 active:scale-90 shadow-sm overflow-hidden group">
                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">chat</span>
                <span className="sr-only">WhatsApp</span>
              </a>
            </div>
            <div className="text-center">
              <p className="text-[0.65rem] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">
                © {new Date().getFullYear()} Grupo DeDoctor & MMC
              </p>
              <p className="text-[0.6rem] text-slate-300 font-bold uppercase tracking-widest">
                Comprometidos con la Movilidad Inclusiva
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
    </div>
  );
}
