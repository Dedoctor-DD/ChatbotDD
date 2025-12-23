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
    <div className="flex justify-center min-h-screen bg-background-light dark:bg-background-dark overflow-hidden font-jakarta relative">
      {/* Ambient Background for PC */}
      <div className="hidden md:block absolute inset-0 z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow [animation-delay:3s]"></div>
      </div>

      <main className="w-full max-w-md md:max-w-5xl mx-auto bg-white dark:bg-surface-dark min-h-screen md:min-h-[90vh] md:my-auto md:rounded-[3rem] relative overflow-hidden shadow-2xl flex flex-col z-10 border-x border-gray-100 dark:border-gray-800 transition-all duration-500">
      <header className="flex justify-between items-center px-6 py-5 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg relative overflow-hidden group">
            <span className="text-white font-bold text-xl relative z-10">D</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm leading-tight text-gray-900 dark:text-white">DeDoctor <span className="text-primary">&</span> MMC</h1>
            <p className="text-[0.6rem] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Grupo de Movilidad</p>
          </div>
        </div>
        <button 
          onClick={onLoginClick}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold hover:bg-blue-700 transition shadow-md shadow-blue-500/30 border-none"
        >
          <span className="material-icons-round text-sm">person</span>
          ACCESO
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pt-8 pb-10">
        <div className="flex flex-col px-6">
          <HeroSection />
        <MissionVisionSection />


          {/* Features Section */}
          <section id="details" className="space-y-4 mb-12">
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-lg border border-gray-50 dark:border-gray-800 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 text-primary">
                <span className="material-symbols-outlined text-3xl">security</span>
              </div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Misión DeDoctor</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Protocolos de transporte diseñados para preservar la dignidad y seguridad de cada paciente.
              </p>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-lg border border-gray-50 dark:border-gray-800 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 text-primary">
                <span className="material-symbols-outlined text-3xl">build</span>
              </div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Ingeniería MMC</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Reparación de precisión para sillas de ruedas eléctricas y manuales con tecnología de punta.
              </p>
            </div>
          </section>

          {/* Photo Gallery Section */}
          <section className="mb-12">
             <PhotoGallery />
          </section>

          {/* Contact Form */}
          <section id="contacto" className="mb-10">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-xl border border-blue-50 dark:border-slate-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-icons-round text-primary">contact_support</span>
                Solicitud Rápida
              </h3>
              
              {formStatus === 'success' ? (
                <div className="py-8 text-center animate-scale-in">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-icons-round text-3xl">check_circle</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">¡Recibido!</h4>
                  <p className="text-sm text-slate-500 mb-4">Te contactaremos por WhatsApp en breve.</p>
                  <button 
                    onClick={() => setFormStatus('idle')}
                    className="text-primary font-bold text-sm bg-transparent border-none"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombre</label>
                    <input 
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white" 
                      placeholder="Ej: Manuel García"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">WhatsApp</label>
                    <input 
                      required type="tel"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white" 
                      placeholder="+56 9 XXXX XXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Mensaje</label>
                    <textarea 
                      required rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white resize-none" 
                      placeholder="¿En qué podemos ayudarte?"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>
                  <button 
                    disabled={formStatus === 'loading'}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 border-none disabled:opacity-70"
                  >
                    {formStatus === 'loading' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span className="material-icons-round text-lg">send</span>
                        Enviar Solicitud
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>

      <footer className="px-6 py-8 bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 flex flex-col items-center gap-6">
        <div className="flex gap-4">
          <a href="#" className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-100 dark:border-slate-700 active:scale-95 shadow-sm overflow-hidden group">
            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">social_leaderboard</span>
            <span className="sr-only">Instagram</span>
          </a>
          <a href="#" className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-100 dark:border-slate-700 active:scale-95 shadow-sm overflow-hidden group">
            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">chat</span>
            <span className="sr-only">WhatsApp</span>
          </a>
        </div>
        <p className="text-[0.65rem] text-slate-400 font-black uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Grupo DeDoctor & MMC
        </p>
      </footer>
    </main>
    </div>
  );
}
