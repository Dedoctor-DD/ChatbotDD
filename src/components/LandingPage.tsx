import { useEffect, useState } from 'react';
import { 
  Accessibility, 
  Wrench, 
  ShieldCheck, 
  ChevronDown, 
  Phone, 
  MapPin, 
  Zap,
  Star,
  ArrowRight,
  CheckCircle2,
  Mail,
  Loader2,
  MessageCircle
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
      // Simplificamos la consulta para evitar posibles errores 500 de RLS o parámetros
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
    <div className="bg-slate-50 text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900">
      
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
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-10 font-black text-[11px] uppercase tracking-widest text-slate-500">
            <a href="#transporte" className="hover:text-sky-600 transition-colors">Transporte</a>
            <a href="#taller" className="hover:text-sky-600 transition-colors">Taller</a>
            <a href="#proceso" className="hover:text-sky-600 transition-colors">Cómo funciona</a>
            <button 
              onClick={onLoginClick}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl hover:bg-sky-600 transition-all shadow-xl shadow-slate-900/10 hover:shadow-sky-600/20 active:scale-95"
            >
              Iniciar Sesión
            </button>
          </div>

          {/* Mobile Login */}
          <button 
            onClick={onLoginClick}
            className="lg:hidden bg-sky-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-sky-600/20"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 px-6 overflow-hidden bg-white">
        {/* Decorative Blobs */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-sky-400/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-sky-50 text-sky-600 text-[10px] font-black rounded-full uppercase tracking-[0.3em] mb-10 border border-sky-100 shadow-sm mx-auto">
              <Star className="w-3 h-3 fill-sky-600" />
              Líderes en Movilidad Reducida
            </div>
            <h1 className="text-5xl lg:text-8xl font-black text-slate-900 mb-12 leading-[1.05] tracking-tight text-balance">
              Movilidad sin <br />
              <span className="hero-gradient-text animate-gradient pb-2">limitaciones.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-500 mb-16 font-medium leading-relaxed balance max-w-2xl mx-auto">
              Soluciones integrales de transporte y soporte técnico diseñadas para devolverte la libertad que mereces.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button 
                onClick={onLoginClick}
                className="group relative overflow-hidden bg-sky-600 text-white px-12 py-5 rounded-[24px] font-black text-lg transition-all shadow-2xl shadow-sky-600/30 hover:bg-sky-700 hover:translate-y-[-4px] active:translate-y-0 active:scale-95"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  Inicia tu Solicitud <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              <a href="#taller" className="bg-white/50 backdrop-blur-md text-slate-900 border border-slate-200/60 px-12 py-5 rounded-[24px] font-black text-lg hover:bg-white hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200/20 active:scale-95">
                <Wrench className="w-5 h-5 text-slate-400" /> Ver Taller
              </a>
            </div>
          </div>

          {/* Social Proof / Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto border-t border-slate-100 pt-16 mt-8">
            <div className="text-center group">
              <div className="text-4xl font-black text-slate-900 mb-1 group-hover:text-sky-600 transition-colors tracking-tighter">10k+</div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Traslados realizados</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors tracking-tighter">15+</div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Años de experiencia</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors tracking-tighter">24/7</div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Asistencia técnica</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-black text-slate-800 mb-1 group-hover:text-rose-600 transition-colors tracking-tighter">99%</div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Clientes satisfechos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ventajas / Beneficios */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 hover-lift group">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Seguridad Total</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Protocolos rigurosos y personal certificado para que viajes con absoluta tranquilidad.</p>
            </div>
            <div className="p-10 rounded-[40px] bg-sky-50 border border-sky-100 hover-lift group">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Respuesta Rápida</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Entendemos la urgencia. Nuestra logística está optimizada para reducir tus tiempos de espera.</p>
            </div>
            <div className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 hover-lift group">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Cobertura Amplia</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Llegamos a donde otros no llegan, brindando soporte técnico y traslados en zonas clave.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      {partners.length > 0 && (
        <section className="py-20 bg-white border-y border-slate-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12 text-center">Empresas que confían en DedoctorDD</p>
            <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-20 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 duration-500">
              {partners.map((partner) => (
                <a
                  key={partner.id}
                  href={partner.website_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-8 lg:h-12 w-auto grayscale contrast-125 hover:grayscale-0 hover:contrast-100 transition-all duration-300 transform hover:scale-110"
                >
                  <img src={partner.logo_url} alt={partner.name} className="h-full object-contain" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sección Servicios (Transporte & Taller) */}
      <section id="transporte" className="py-32 bg-slate-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-block px-4 py-1.5 bg-sky-100 text-sky-600 text-[10px] font-black rounded-lg uppercase tracking-widest mb-6 shadow-sm border border-sky-200/40">Servicios Especializados</div>
          <h2 className="text-4xl lg:text-6xl font-black text-slate-900 mb-20 leading-[1.1] tracking-tight max-w-3xl mx-auto">Innovación en cada <br /> asistencia.</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Tarjeta Transporte */}
            <div className="bg-white p-12 lg:p-20 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 text-center hover-lift group">
              <div className="w-24 h-24 bg-sky-50 text-sky-600 rounded-3xl flex items-center justify-center mx-auto mb-10 group-hover:bg-sky-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                <Accessibility className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight">Traslado Adaptado</h3>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10 max-w-md mx-auto">
                Vehículos equipados con tecnología de punta y personal capacitado para traslados seguros y cómodos.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <span className="px-5 py-2 bg-slate-50 rounded-full text-[11px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 italic">24/7 Disponible</span>
                <span className="px-5 py-2 bg-slate-50 rounded-full text-[11px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 italic">Seguridad Certificada</span>
              </div>
            </div>

            {/* Tarjeta Taller */}
            <div id="taller" className="bg-slate-900 p-12 lg:p-20 rounded-[48px] shadow-2xl shadow-slate-900/10 text-center hover-lift group">
              <div className="w-24 h-24 bg-white/10 text-sky-400 rounded-3xl flex items-center justify-center mx-auto mb-10 group-hover:bg-sky-500 group-hover:text-white transition-all transform group-hover:-rotate-6">
                <Wrench className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">Servicio Técnico</h3>
              <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10 max-w-md mx-auto">
                Mantenimiento preventivo y correctivo para sillas de ruedas eléctricas y manuales con repuestos originales.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <span className="px-5 py-2 bg-white/5 rounded-full text-[11px] font-black text-sky-400 uppercase tracking-widest border border-white/5 italic">Diagnóstico Digital</span>
                <span className="px-5 py-2 bg-white/5 rounded-full text-[11px] font-black text-sky-400 uppercase tracking-widest border border-white/5 italic">Stock Inmediato</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="proceso" className="py-20 lg:py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto text-center mb-24">
          <div className="inline-block px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase tracking-widest mb-6">Metodología Simple</div>
          <h3 className="text-3xl lg:text-6xl font-black text-slate-900 tracking-tight">¿Cómo trabajamos?</h3>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-16 relative">
          {/* Decorative Line (Desktop) */}
          <div className="hidden md:block absolute top-[45%] left-0 w-full h-[2px] bg-slate-100 -z-0"></div>

          <div className="relative z-10 flex flex-col items-center group">
            <div className="w-20 h-20 bg-white border-2 border-slate-100 text-slate-800 rounded-3xl flex items-center justify-center text-3xl font-black mb-8 shadow-2xl shadow-slate-200/50 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 transition-all duration-500">1</div>
            <h4 className="font-black text-2xl mb-4 text-slate-900 text-center tracking-tight">Solicitud Instantánea</h4>
            <p className="text-slate-500 text-center font-medium leading-relaxed">Contáctanos vía WhatsApp o nuestra plataforma. Dinos qué necesitas.</p>
          </div>
          <div className="relative z-10 flex flex-col items-center group">
            <div className="w-20 h-20 bg-white border-2 border-slate-100 text-slate-800 rounded-3xl flex items-center justify-center text-3xl font-black mb-8 shadow-2xl shadow-slate-200/50 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 transition-all duration-500">2</div>
            <h4 className="font-black text-2xl mb-4 text-slate-900 text-center tracking-tight">Coordinación</h4>
            <p className="text-slate-500 text-center font-medium leading-relaxed">Agendamos tu traslado o el retiro de tu equipo a domicilio con GPS en tiempo real.</p>
          </div>
          <div className="relative z-10 flex flex-col items-center group">
            <div className="w-20 h-20 bg-white border-2 border-slate-100 text-slate-800 rounded-3xl flex items-center justify-center text-3xl font-black mb-8 shadow-2xl shadow-slate-200/50 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 transition-all duration-500">3</div>
            <h4 className="font-black text-2xl mb-4 text-slate-900 text-center tracking-tight">Servicio Garantizado</h4>
            <p className="text-slate-500 text-center font-medium leading-relaxed">Viaja tranquilo o recibe tu silla reparada con garantía extendida del taller.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-32 bg-slate-50 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20 font-black">
            <h3 className="text-3xl lg:text-5xl text-slate-900 tracking-tight mb-4">Preguntas Frecuentes</h3>
            <p className="text-slate-400 uppercase tracking-widest text-xs">Resolvemos tus dudas al instante</p>
          </div>
          <div className="space-y-6">
            <details className="group p-8 bg-white rounded-[32px] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
              <summary className="font-black text-xl list-none flex justify-between items-center text-slate-800 tracking-tight">
                ¿Cuentan con servicio de urgencias?
                <span className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-sky-50 group-hover:text-sky-600 transition-all duration-300"><ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" /></span>
              </summary>
              <p className="mt-6 text-slate-500 font-medium leading-relaxed border-t border-slate-50 pt-6">
                Sí, para el servicio de transporte contamos con guardias programadas 24/7. Para el taller técnico, atendemos emergencias críticas de lunes a sábado con prioridad inmediata.
              </p>
            </details>
            <details className="group p-8 bg-white rounded-[32px] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
              <summary className="font-black text-xl list-none flex justify-between items-center text-slate-800 tracking-tight">
                ¿Qué mantenimiento incluyen las tarifas?
                <span className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-sky-50 group-hover:text-sky-600 transition-all duration-300"><ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" /></span>
              </summary>
              <p className="mt-6 text-slate-500 font-medium leading-relaxed border-t border-slate-50 pt-6">
                Ofrecemos planes que cubren desde la lubricación y ajuste general hasta el testeo predictivo de baterías y revisión profunda de sistemas de frenado.
              </p>
            </details>
            <details className="group p-8 bg-white rounded-[32px] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
              <summary className="font-black text-xl list-none flex justify-between items-center text-slate-800 tracking-tight">
                ¿Qué tipos de equipos pueden trasladar?
                <span className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-sky-50 group-hover:text-sky-600 transition-all duration-300"><ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" /></span>
              </summary>
              <p className="mt-6 text-slate-500 font-medium leading-relaxed border-t border-slate-50 pt-6">
                Nuestras unidades están habilitadas para sillas manuales, eléctricas de todo tipo y scooters de movilidad de gran tamaño.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Contacto Final */}
      <section id="contacto" className="py-32 px-6 relative overflow-hidden bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-[48px] shadow-3xl overflow-hidden shadow-sky-600/10">
            <div className="p-12 lg:p-24 text-center">
                <div className="inline-block px-4 py-1.5 bg-sky-500/20 text-sky-400 text-[10px] font-black rounded-lg uppercase tracking-widest mb-10 border border-sky-500/20">Puente Directo</div>
                <h3 className="text-4xl lg:text-7xl font-black mb-12 leading-tight tracking-tight uppercase text-white">Estamos <br /> a un clic.</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                  <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-sky-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                      <Phone className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Llamada Directa</p>
                    <p className="text-2xl font-black text-white">+56 9 1234 5678</p>
                  </div>
                  <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-sky-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                      <Mail className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Correo Electrónico</p>
                    <p className="text-xl font-black text-white">soporte@dedoctordd.cl</p>
                  </div>
                </div>

                <div className="bg-white rounded-[40px] p-8 lg:p-16 text-left shadow-2xl">
                    {formStatus === 'success' ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-10 animate-fade-in">
                        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/10">
                          <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">¡Recibido con éxito!</h4>
                        <p className="text-slate-500 font-medium mb-10">Un asesor técnico se pondrá en contacto contigo en los próximos minutos.</p>
                        <button onClick={() => setFormStatus('idle')} className="text-sky-600 font-black text-sm uppercase tracking-widest hover:text-sky-700 transition-colors">Enviar otro mensaje</button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Nombre Completo</label>
                            <input 
                              type="text" 
                              name="full_name"
                              required
                              placeholder="Juan Pérez"
                              className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-sm placeholder:text-slate-300 font-medium"
                              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                              value={formData.full_name}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Teléfono Móvil</label>
                            <input 
                              type="tel" 
                              name="phone"
                              required
                              placeholder="+56 9 ..."
                              className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-sm placeholder:text-slate-300 font-medium"
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              value={formData.phone}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Servicio de Interés</label>
                          <select 
                            name="service_type"
                            className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-sm font-medium appearance-none"
                            onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                          >
                            <option>Traslado en transporte adaptado</option>
                            <option>Reparación de silla eléctrica</option>
                            <option>Mantenimiento preventivo</option>
                            <option>Otros requerimientos</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Detalle del Requerimiento</label>
                          <textarea 
                            name="message"
                            required
                            rows={4}
                            placeholder="Ej: Necesito traslado mañana a las 10:00 AM..."
                            className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-sm resize-none placeholder:text-slate-300 font-medium"
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            value={formData.message}
                          ></textarea>
                        </div>
                        <button 
                          disabled={formStatus === 'loading'}
                          type="submit"
                          className="w-full bg-sky-600 text-white py-6 rounded-[28px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-sky-600/30 hover:bg-sky-700 hover:translate-y-[-4px] active:translate-y-0 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                          {formStatus === 'loading' ? <Loader2 className="animate-spin w-6 h-6" /> : 'Enviar Solicitud Ahora'}
                        </button>
                      </form>
                    )}
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center mb-24">
                <div className="flex items-center gap-4 mb-10">
                    <div className="bg-sky-600 text-white p-3 rounded-2xl shadow-xl shadow-sky-600/20">
                        <Accessibility className="w-8 h-8" />
                    </div>
                    <span className="font-black text-4xl text-white uppercase tracking-tighter">Dedoctor<span className="text-sky-600">DD</span></span>
                </div>
                <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-2xl italic">
                  "Innovación y calidez humana al servicio de tu movilidad."
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center mb-24">
                <div>
                    <h5 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10">Servicios</h5>
                    <ul className="text-slate-500 text-[10px] font-black uppercase tracking-widest space-y-6">
                        <li className="hover:text-sky-400 transition-colors cursor-pointer">Traslados</li>
                        <li className="hover:text-sky-400 transition-colors cursor-pointer">Soporte</li>
                        <li className="hover:text-sky-400 transition-colors cursor-pointer">Consultas</li>
                    </ul>
                </div>
                <div>
                  <h5 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10">Compañía</h5>
                  <ul className="text-slate-500 text-[10px] font-black uppercase tracking-widest space-y-6">
                        <li className="hover:text-sky-400 transition-colors cursor-pointer" onClick={onLoginClick}>Admin</li>
                        <li className="hover:text-sky-400 transition-colors cursor-pointer">Garantía</li>
                    </ul>
                </div>
                <div>
                  <h5 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10">Soporte</h5>
                  <ul className="text-slate-500 text-[10px] font-black uppercase tracking-widest space-y-6">
                        <li className="hover:text-sky-400 transition-colors cursor-pointer">Contacto</li>
                        <li className="hover:text-sky-400 transition-colors cursor-pointer">Legal</li>
                    </ul>
                </div>
                <div>
                  <h5 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10">Newsletter</h5>
                  <div className="flex flex-col gap-4">
                      <input type="email" placeholder="TU EMAIL" className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-black outline-none w-full focus:border-sky-500 transition-all text-center uppercase" />
                      <button className="bg-sky-600 py-4 rounded-2xl text-white hover:bg-sky-700 shadow-lg shadow-sky-600/20 font-black text-[10px] uppercase tracking-widest">Suscribirse</button>
                  </div>
                </div>
            </div>

            <div className="border-t border-white/5 pt-16 text-center">
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
                  © {new Date().getFullYear()} DedoctorDD. Elevando el estándar de movilidad.
                </p>
            </div>
        </div>
      </footer>

      {/* WhatsApp Floating */}
      <a href="https://wa.me/123456789" target="_blank" rel="noreferrer" className="fixed bottom-10 right-10 z-[110] flex items-center gap-4 bg-emerald-600 text-white px-8 py-5 rounded-[24px] shadow-2xl shadow-emerald-600/40 hover:scale-110 active:scale-95 transition-all group border-4 border-white">
        <span className="font-black text-xs uppercase tracking-widest hidden md:block">¿Necesitas ayuda?</span>
        <MessageCircle className="w-7 h-7 fill-white/20" />
      </a>

    </div>
  );
}
