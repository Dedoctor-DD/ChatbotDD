import { useEffect, useState } from 'react';
import { 
  Accessibility, 
  Wrench, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Zap,
  ArrowRight,
  CheckCircle2,
  Mail,
  Loader2,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    service_type: 'Traslado en transporte adaptado',
    message: ''
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    loadPartners();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('name, logo_url, website_url')
        .limit(10);
      
      if (error) {
        console.warn('Error fetching partners:', error);
        return;
      }
      if (data) setPartners(data.filter(p => p.logo_url));
    } catch (err) {
      console.error('Error loading partners:', err);
    }
  };

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
      setFormData({ full_name: '', phone: '', service_type: 'Traslado en transporte adaptado', message: '' });
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (error) {
      console.error('Error submitting lead:', error);
      setFormStatus('error');
    }
  };

  return (
    <div className="bg-white text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900">
      
      {/* Navegación */}
      <nav className={`fixed w-full z-[100] transition-all duration-500 ${isScrolled ? 'glass-nav py-4 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-sky-600 text-white p-2.5 rounded-2xl group-hover:rotate-12 transition-transform shadow-xl shadow-sky-200 ring-4 ring-white">
              <Accessibility className="w-6 h-6" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-xl tracking-tight text-slate-900 uppercase">Dedoctor<span className="text-sky-600">DD</span></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Movilidad & Soporte</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-10 font-black text-[11px] uppercase tracking-widest text-slate-500">
            <a href="#transporte" className="hover:text-sky-600 transition-colors">Servicios</a>
            <a href="#proceso" className="hover:text-sky-600 transition-colors">Proceso</a>
            <a href="#contacto" className="hover:text-sky-600 transition-colors">Contacto</a>
            <button 
              onClick={onLoginClick}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl hover:bg-sky-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              Acceso
            </button>
          </div>

          <button onClick={onLoginClick} className="lg:hidden bg-sky-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest">
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 px-6 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-200/40 rounded-full blur-[120px] animate-pulse-soft"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[100px] animate-float"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="animate-reveal">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/50 backdrop-blur-md text-sky-600 text-[10px] font-black rounded-full uppercase tracking-[0.3em] mb-10 border border-white/80 shadow-sm mx-auto">
              <Sparkles className="w-3 h-3 text-sky-500 animate-pulse" />
              Líderes en Tecnología de Movilidad
            </div>
            <h1 className="text-5xl lg:text-9xl font-black text-slate-900 mb-12 leading-[0.95] tracking-tighter text-balance uppercase italic">
              Movilidad sin <br />
              <span className="hero-gradient-text animate-gradient pb-4">fronteras.</span>
            </h1>
            <p className="text-xl lg:text-3xl text-slate-500 mb-16 font-medium leading-relaxed balance max-w-3xl mx-auto opacity-0 animate-reveal reveal-delay-1" style={{animationFillMode: 'forwards'}}>
              La intersección entre <span className="text-slate-900 font-bold">asistencia humana</span> y <span className="text-sky-600 font-bold">excelencia técnica</span>.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6 opacity-0 animate-reveal reveal-delay-2" style={{opacity: 0, animationFillMode: 'forwards'}}>
              <button
                onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                className="group relative overflow-hidden bg-slate-900 text-white px-12 py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-slate-900/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Solicitar Ahora <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </div>

          {/* Stats Bento Reveal */}
          <div className="relative mt-32 animate-reveal reveal-delay-3" style={{opacity: 0, animationFillMode: 'forwards'}}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="glass-premium p-10 rounded-[40px] border border-white/80 group hover:translate-y-[-8px] transition-all">
                    <div className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase italic">15m</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Respuesta</p>
                </div>
                <div className="glass-premium p-10 rounded-[40px] border border-white/80 group hover:translate-y-[-8px] transition-all">
                    <div className="text-4xl font-black text-sky-600 mb-2 tracking-tighter uppercase italic">+2k</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicios</p>
                </div>
                <div className="glass-premium p-10 rounded-[40px] border border-white/80 group hover:translate-y-[-8px] transition-all">
                    <div className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase italic">100%</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Garantía</p>
                </div>
                <div className="glass-premium p-10 rounded-[40px] border border-white/80 group hover:translate-y-[-8px] transition-all">
                    <div className="text-4xl font-black text-indigo-600 mb-2 tracking-tighter uppercase italic">24/7</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Soporte</p>
                </div>
            </div>
          </div>
          
          {/* Partners Scroll */}
          {partners.length > 0 && (
            <div className="mt-40 border-t border-slate-100 pt-20 animate-reveal reveal-delay-3 opacity-0" style={{animationFillMode: 'forwards'}}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[.4em] mb-12 text-center">Empresas con las que colaboramos</p>
              <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                {partners.map((p, i) => (
                  <img key={i} src={p.logo_url} alt={p.name} className="h-8 lg:h-12 w-auto object-contain transition-transform hover:scale-110" />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bento Grid Services */}
      <section id="transporte" className="py-40 bg-slate-50/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <div className="inline-block px-4 py-1.5 bg-sky-100 text-sky-600 text-[10px] font-black rounded-lg uppercase tracking-widest mb-6 shadow-sm border border-sky-200/40">Nuestra Expertise</div>
            <h2 className="text-4xl lg:text-7xl font-black text-slate-900 mb-6 leading-tight tracking-tighter uppercase italic">Ecosistema de <br /> Asistencia.</h2>
            <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto">Cubrimos cada aspecto de tu movilidad con estándares de ingeniería avanzada.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[56px] p-4 border border-slate-100 group hover-lift transition-all shadow-xl shadow-slate-200/20">
                <div className="bento-inner min-h-[400px]">
                    <div className="absolute top-10 right-10 bg-sky-50 p-6 rounded-3xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all transform group-hover:rotate-12">
                        <Accessibility className="w-12 h-12" />
                    </div>
                    <div className="relative z-10 w-full mb-10">
                        <p className="text-[10px] font-black text-sky-600 uppercase tracking-[.3em] mb-4">Servicio 01</p>
                        <h3 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tight italic">Logística <br /> Adaptada.</h3>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">Flota propia con rampas hidráulicas y conductores certificados en RCP y movilización asistida.</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-[56px] p-4 group hover-lift transition-all overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-600/20 to-transparent"></div>
                <div className="bento-inner min-h-[400px] relative z-10">
                    <div className="absolute top-10 right-10 bg-white/10 p-6 rounded-3xl text-sky-400 group-hover:bg-sky-400 group-hover:text-slate-900 transition-all transform group-hover:-rotate-12">
                        <Wrench className="w-12 h-12" />
                    </div>
                    <div className="w-full mb-10">
                        <p className="text-[10px] font-black text-sky-400 uppercase tracking-[.3em] mb-4">Servicio 02</p>
                        <h3 className="text-4xl font-black text-white mb-6 uppercase tracking-tight italic">Ingeniería <br /> de Soporte.</h3>
                        <p className="text-slate-400 text-base font-medium leading-relaxed">Diagnóstico digital y reparación express con garantía certificada por escrito.</p>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
                <div className="bg-white rounded-[48px] p-10 flex items-center justify-between group hover:bg-sky-600 transition-colors duration-500 border border-slate-100">
                    <div>
                        <h4 className="text-3xl font-black text-slate-900 group-hover:text-white mb-1 transition-colors uppercase italic tracking-tighter">Seguridad</h4>
                        <p className="text-slate-400 group-hover:text-white/80 text-[10px] font-black uppercase tracking-widest transition-colors">Norma ISO 9001</p>
                    </div>
                    <ShieldCheck className="w-12 h-12 text-sky-600 group-hover:text-white transition-colors" />
                </div>
                <div className="bg-white rounded-[48px] p-10 flex items-center justify-between group hover:bg-indigo-600 transition-colors duration-500 border border-slate-100">
                    <div>
                        <h4 className="text-3xl font-black text-slate-900 group-hover:text-white mb-1 transition-colors uppercase italic tracking-tighter">Rapidez</h4>
                        <p className="text-slate-400 group-hover:text-white/80 text-[10px] font-black uppercase tracking-widest transition-colors">Gestión Digital</p>
                    </div>
                    <Zap className="w-12 h-12 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <div className="bg-white rounded-[48px] p-10 flex items-center justify-between group hover:bg-slate-900 transition-colors duration-500 border border-slate-100">
                    <div>
                        <h4 className="text-3xl font-black text-slate-900 group-hover:text-white mb-1 transition-colors uppercase italic tracking-tighter">Cobertura</h4>
                        <p className="text-slate-400 group-hover:text-white/60 text-[10px] font-black uppercase tracking-widest transition-colors">Región Metropolitana</p>
                    </div>
                    <MapPin className="w-12 h-12 text-slate-400 group-hover:text-white transition-colors" />
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section id="proceso" className="py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl lg:text-7xl font-black text-slate-900 mb-24 tracking-tighter uppercase italic">Cómo funciona.</h2>
            <div className="grid md:grid-cols-3 gap-20">
                <div className="group">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-3xl font-black text-slate-800 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-inner">01</div>
                    <h4 className="text-2xl font-black mb-4 uppercase tracking-tight group-hover:text-sky-600 transition-colors">Solicitud</h4>
                    <p className="text-slate-500 font-medium">Contáctanos vía plataforma o WhatsApp. Respuesta en menos de 5 min.</p>
                </div>
                <div className="group">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-3xl font-black text-slate-800 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-inner">02</div>
                    <h4 className="text-2xl font-black mb-4 uppercase tracking-tight group-hover:text-sky-600 transition-colors">Acción</h4>
                    <p className="text-slate-500 font-medium">Coordinamos el traslado o el retiro técnico con seguimiento en vivo.</p>
                </div>
                <div className="group">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-3xl font-black text-slate-800 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-inner">03</div>
                    <h4 className="text-2xl font-black mb-4 uppercase tracking-tight group-hover:text-sky-600 transition-colors">Entrega</h4>
                    <p className="text-slate-500 font-medium">Viaje seguro o equipo reparado con certificado de calidad.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Contacto Refined */}
      <section id="contacto" className="py-40 px-6 bg-slate-50/50">
        <div className="max-w-5xl mx-auto">
            <div className="bg-slate-900 rounded-[64px] overflow-hidden shadow-3xl shadow-sky-600/5 transition-all hover:shadow-sky-600/10 p-12 lg:p-24">
                <div className="text-center mb-20">
                    <div className="inline-block px-4 py-1.5 bg-sky-500/20 text-sky-400 text-[10px] font-black rounded-lg uppercase tracking-widest mb-10 border border-sky-500/20">Puente Directo</div>
                    <h2 className="text-5xl lg:text-8xl font-black text-white mb-10 tracking-tighter uppercase italic text-balance">Estamos <br /> a un clic.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    <div className="dark-glass p-10 rounded-[40px] flex items-center gap-8 group hover:bg-white/10 transition-all">
                        <div className="w-16 h-16 bg-sky-600 text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                            <Phone className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Llamar Ahora</p>
                            <p className="text-2xl font-black text-white">+56 9 1234 5678</p>
                        </div>
                    </div>
                    <div className="dark-glass p-10 rounded-[40px] flex items-center gap-8 group hover:bg-white/10 transition-all">
                        <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                            <Mail className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Escribenos</p>
                            <p className="text-xl font-black text-white">soporte@dedoctordd.cl</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[48px] p-8 lg:p-20 shadow-2xl">
                    {formStatus === 'success' ? (
                      <div className="text-center py-20 animate-reveal">
                        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mb-8 mx-auto shadow-xl">
                          <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <h4 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">¡Enviado!</h4>
                        <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">Te contactaremos en minutos para brindarte asistencia inmediata.</p>
                        <button onClick={() => setFormStatus('idle')} className="text-sky-600 font-black text-sm uppercase tracking-widest hover:text-sky-700">Nueva consulta</button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                            <input 
                              type="text" required placeholder="Juan Pérez"
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-8 py-5 outline-none focus:border-sky-500 transition-all font-bold placeholder:text-slate-300"
                              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                              value={formData.full_name}
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                            <input 
                              type="tel" required placeholder="+56 9..."
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-8 py-5 outline-none focus:border-sky-500 transition-all font-bold placeholder:text-slate-300"
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              value={formData.phone}
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje</label>
                          <textarea 
                            rows={4} required placeholder="¿En qué podemos ayudarte?"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-8 py-5 outline-none focus:border-sky-500 transition-all font-bold resize-none"
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            value={formData.message}
                          ></textarea>
                        </div>
                        <button 
                          disabled={formStatus === 'loading'}
                          type="submit"
                          className="w-full bg-slate-900 text-white py-8 rounded-[32px] font-black text-lg uppercase tracking-[0.3em] hover:bg-sky-600 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-6"
                        >
                          {formStatus === 'loading' ? <Loader2 className="animate-spin" /> : 'Solicitar Asistencia Ahora'}
                        </button>
                      </form>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* Footer Final */}
      <footer className="bg-white py-32 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
            <div className="flex items-center gap-4 mb-20 text-center flex-col md:flex-row">
                <div className="bg-slate-900 text-white p-3 rounded-2xl">
                    <Accessibility className="w-8 h-8" />
                </div>
                <span className="font-black text-5xl uppercase tracking-tighter italic">Dedoctor<span className="text-sky-600">DD</span></span>
            </div>
            <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-20">
                <a href="#" className="hover:text-slate-900 transition-colors">Términos</a>
                <a href="#" className="hover:text-slate-900 transition-colors">Privacidad</a>
                <a href="#" className="hover:text-slate-900 transition-colors">Cookies</a>
                <a href="#" className="hover:text-slate-900 transition-colors" onClick={onLoginClick}>Admin</a>
            </div>
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} DedoctorDD. Elevando el estándar de movilidad.</p>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a href="https://wa.me/123456789" className="fixed bottom-12 right-12 z-[200] group flex items-center gap-4 bg-emerald-600 text-white p-6 rounded-full md:rounded-[32px] shadow-3xl hover:scale-110 active:scale-95 transition-all outline outline-offset-8 outline-emerald-100 italic">
        <span className="font-black text-xs uppercase tracking-widest hidden md:block pl-2">Chat Directo</span>
        <MessageCircle className="w-8 h-8" />
      </a>

    </div>
  );
}
