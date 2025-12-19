import { useEffect, useState } from 'react';
import { 
  Accessibility, 
  Wrench, 
  ShieldCheck, 
  ChevronDown, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Send,
  Zap,
  Star,
  ArrowRight,
  CheckCircle2,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Activity,
  History as LucideHistory,
  Loader2
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

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] mb-8 border border-sky-100 shadow-sm">
              <Star className="w-3 h-3 fill-sky-600" />
              Líderes en Movilidad Reducida
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-8xl font-extrabold text-slate-900 mb-10 leading-[1] tracking-tight text-balance">
              Recupera tu libertad con <br className="hidden lg:block" /> 
              <span className="hero-gradient-text animate-gradient pb-2">expertos en asistencia.</span>
            </h1>
            <p className="text-lg lg:text-2xl text-slate-500 max-w-4xl mx-auto mb-14 font-medium leading-relaxed">
              Ofrecemos un servicio 360° para tu movilidad: desde traslados adaptados con máxima seguridad hasta el soporte técnico especializado que necesitas.
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

      {/* Sección Transporte */}
      <section id="transporte" className="py-20 lg:py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="w-full lg:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-sky-500/10 rounded-[48px] blur-2xl group-hover:bg-sky-500/15 transition-all duration-700"></div>
                <div className="relative rounded-[40px] overflow-hidden shadow-3xl">
                  <img src="https://images.unsplash.com/photo-1596720426673-e47744bd20cc?auto=format&fit=crop&q=80&w=1200"
                       alt="Transporte Especializado"
                       className="w-full object-cover aspect-[4/3] transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="absolute -bottom-10 -right-6 lg:-right-10 bg-white/90 backdrop-blur-xl p-8 rounded-[32px] shadow-2xl z-20 hidden md:block border border-white/40 shadow-sky-900/10 hover-lift">
                  <div className="flex items-center gap-5">
                    <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl text-2xl animate-pulse">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Certificado</p>
                      <p className="font-black text-slate-800 text-lg">Normas de Calidad</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="inline-block px-4 py-1.5 bg-sky-100 text-sky-600 text-[10px] font-black rounded-lg uppercase tracking-widest mb-6 shadow-sm border border-sky-200/40">Movilidad Adaptada</div>
              <h2 className="text-3xl lg:text-6xl font-black text-slate-900 mb-10 leading-[1.1] tracking-tight">Traslados diseñados para <br className="hidden md:block" /> tu comodidad absoluta.</h2>
              <p className="text-slate-500 text-xl mb-12 font-medium leading-relaxed">
                No somos solo un transporte; somos tu equipo de asistencia móvil. Nuestras unidades cuentan con tecnología de punta para garantizar viajes suaves y seguros.
              </p>
              <div className="grid gap-8">
                <div className="flex gap-6 items-start group hover-lift p-2 rounded-3xl transition-all">
                  <div className="flex-shrink-0 w-14 h-14 bg-white shadow-xl shadow-sky-500/5 group-hover:bg-sky-600 group-hover:text-white rounded-2xl flex items-center justify-center font-black text-sky-600 text-xl border border-slate-100 transition-all">01</div>
                  <div>
                    <h4 className="font-black text-xl mb-2 text-slate-800 tracking-tight group-hover:text-sky-600 transition-colors">Seguridad Quirúrgica</h4>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Equipamiento médico a bordo y fijaciones de alta resistencia para sillas eléctricas.</p>
                  </div>
                </div>
                <div className="flex gap-6 items-start group hover-lift p-2 rounded-3xl transition-all">
                  <div className="flex-shrink-0 w-14 h-14 bg-white shadow-xl shadow-sky-500/5 group-hover:bg-sky-600 group-hover:text-white rounded-2xl flex items-center justify-center font-black text-sky-600 text-xl border border-slate-100 transition-all">02</div>
                  <div>
                    <h4 className="font-black text-xl mb-2 text-slate-800 tracking-tight group-hover:text-sky-600 transition-colors">Personal Humano</h4>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Conductores formados en trato empático y técnicas de movilización asistida.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Taller */}
      <section id="taller" className="py-20 lg:py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-sky-500/5 blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-24">
            <div className="w-full lg:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-sky-500/20 rounded-[48px] blur-3xl group-hover:blur-[40px] transition-all duration-700"></div>
                <div className="relative rounded-[40px] overflow-hidden shadow-3xl border border-white/10">
                  <img src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1200"
                       alt="Taller de Sillas"
                       className="w-full object-cover aspect-[16/10] sm:aspect-[4/3] brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-700 relative z-10" />
                  <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-slate-900 to-transparent">
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Servicio Activo 24/7</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="inline-block px-4 py-1.5 bg-sky-500/10 text-sky-400 text-[10px] font-black rounded-lg uppercase tracking-widest mb-6 border border-sky-500/20">Servicio Técnico</div>
              <h2 className="text-3xl lg:text-6xl font-black mb-10 leading-[1.1] tracking-tight uppercase">Tu silla como nueva, <br /> en tiempo récord.</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="p-10 bg-white/5 backdrop-blur-md rounded-[40px] border border-white/10 hover:border-sky-500/50 transition-all group hover-lift">
                  <div className="w-16 h-16 bg-sky-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-sky-500 transition-colors">
                    <Activity className="w-8 h-8 text-sky-400 group-hover:text-white" />
                  </div>
                  <h4 className="text-xl font-black mb-3 text-white tracking-tight">Diagnóstico Digital</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Evaluación técnica profunda de motores, baterías y sistemas electrónicos con escaneo especializado.</p>
                </div>
                <div className="p-10 bg-white/5 backdrop-blur-md rounded-[40px] border border-white/10 hover:border-sky-500/50 transition-all group hover-lift">
                  <div className="w-16 h-16 bg-sky-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-sky-500 transition-colors">
                    <LucideHistory className="w-8 h-8 text-sky-400 group-hover:text-white" />
                  </div>
                  <h4 className="text-xl font-black mb-3 text-white tracking-tight">Repuestos Originales</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Contamos con stock propio de componentes certificados para restaurar el rendimiento de fábrica.</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-sky-600/20 to-transparent border-l-4 border-sky-600 p-8 rounded-2xl">
                <p className="text-sky-100 font-semibold italic text-lg leading-relaxed">"Nuestra prioridad es que no pierdas ni un solo día de movilidad. El soporte técnico debe ser tan rápido como seguro."</p>
                <p className="mt-6 font-black text-xs uppercase tracking-[0.2em] text-sky-400">— Equipo de Ingeniería DedoctorDD</p>
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
      <section id="contacto" className="py-20 lg:py-32 px-6 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-[32px] md:rounded-[64px] shadow-3xl overflow-hidden flex flex-col lg:flex-row shadow-sky-600/10">
            <div className="w-full lg:w-[45%] bg-sky-600 p-8 md:p-16 lg:p-24 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                     <h3 className="text-3xl lg:text-6xl font-black mb-12 leading-tight tracking-tight uppercase">Estamos a solo un <br /> clic.</h3>
                    <div className="space-y-10">
                        <div className="flex items-center gap-8 group">
                            <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-sky-600 transition-all shadow-xl">
                                <Phone className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-black tracking-tight uppercase">+1 234 567 890</span>
                        </div>
                        <div className="flex items-center gap-8 group">
                            <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all shadow-xl">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-black tracking-tight uppercase">+1 234 567 891</span>
                        </div>
                        <div className="flex items-center gap-8 group">
                            <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-sky-600 transition-all shadow-xl">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-black tracking-tight uppercase">Av. Central 500, Sector I</span>
                        </div>
                    </div>
                </div>
                <div className="mt-16 relative z-10 pt-16 border-t border-white/10">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Seguinos en redes sociales</p>
                </div>
            </div>

            <div className="w-full lg:w-[55%] bg-white p-8 md:p-16 lg:p-24">
                {formStatus === 'success' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/10">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h4 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">¡Solicitud Enviada!</h4>
                    <p className="text-slate-500 font-medium max-w-xs mx-auto">Nuestro equipo técnico te contactará en breve para coordinar los detalles.</p>
                    <button 
                      onClick={() => setFormStatus('idle')}
                      className="mt-10 text-sky-600 font-black text-xs uppercase tracking-widest hover:text-sky-700"
                    >
                      Enviar otra consulta
                    </button>
                  </div>
                ) : (
                  <form className="space-y-8" onSubmit={handleSubmit}>
                      <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</label>
                              <input 
                                required
                                type="text" 
                                value={formData.full_name}
                                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] px-8 py-5 outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/20 transition-all text-slate-800 font-bold" 
                                placeholder="Juan Pérez" 
                              />
                          </div>
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono Móvil</label>
                              <input 
                                required
                                type="tel" 
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] px-8 py-5 outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/20 transition-all text-slate-800 font-bold" 
                                placeholder="+54 9..." 
                              />
                          </div>
                      </div>
                      <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Servicio Requerido</label>
                          <select 
                            value={formData.service_type}
                            onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[20px] px-8 py-5 outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/20 transition-all text-slate-800 font-bold appearance-none"
                          >
                              <option>Traslado en transporte adaptado</option>
                              <option>Reparación técnica en taller</option>
                              <option>Mantenimiento preventivo</option>
                              <option>Consulta general técnicos</option>
                          </select>
                      </div>
                      <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">¿Cómo podemos ayudarte?</label>
                          <textarea 
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            rows={4} 
                            className="w-full bg-slate-50 border border-slate-100 rounded-[32px] px-8 py-6 outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/20 transition-all text-slate-800 font-bold resize-none" 
                            placeholder="Escribe tu mensaje aquí..."
                          ></textarea>
                      </div>
                      
                      {formStatus === 'error' && (
                        <p className="text-rose-500 text-xs font-bold text-center">Ocurrió un error. Inténtalo de nuevo.</p>
                      )}

                      <button 
                        disabled={formStatus === 'loading'}
                        className="w-full bg-sky-600 text-white font-black py-6 rounded-[32px] text-lg uppercase tracking-widest shadow-2xl shadow-sky-600/30 hover:bg-sky-700 hover:-translate-y-2 transition-all active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3"
                      >
                          {formStatus === 'loading' ? 'Enviando...' : (
                            <>Solicitar Presupuesto <Send className="w-5 h-5" /></>
                          )}
                      </button>
                  </form>
                )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-20 lg:pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
                <div className="col-span-1 lg:col-span-1">
                    <div className="flex items-center gap-3 text-white mb-10 translate-x-[-10px]">
                        <div className="bg-sky-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-600/20">
                           <img src="/logo.jpg" alt="Logo" className="w-8 h-8 object-contain rounded-md" />
                        </div>
                        <span className="font-black text-2xl uppercase tracking-tighter">Dedoctor<span className="text-sky-500">DD</span></span>
                    </div>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed italic pr-4">
                      "Dedicados a transformar la calidad de vida de las personas con movilidad reducida a través de excelencia técnica y calidez humana."
                    </p>
                </div>
                <div>
                    <h5 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10">Servicios</h5>
                    <ul className="text-slate-400 text-[11px] font-black uppercase tracking-widest space-y-6">
                        <li className="hover:text-sky-400 transition-colors pointer-events-none opacity-50">Traslados Médicos</li>
                        <li className="hover:text-sky-400 transition-colors pointer-events-none opacity-50">Eventos Sociales</li>
                        <li className="hover:text-sky-400 transition-colors pointer-events-none opacity-50">Taller Electrónico</li>
                        <li className="hover:text-sky-400 transition-colors pointer-events-none opacity-50">Repuestos Oficiales</li>
                    </ul>
                </div>
                <div>
                  <h5 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10">Soporte</h5>
                  <ul className="text-slate-400 text-[11px] font-black uppercase tracking-widest space-y-6">
                        <li className="hover:text-sky-400 transition-colors cursor-pointer" onClick={onLoginClick}>Acceso Clientes</li>
                        <li className="hover:text-sky-400 transition-colors cursor-pointer" onClick={onLoginClick}>Estado de Servicio</li>
                        <li className="hover:text-sky-400 transition-colors cursor-pointer">Seguimiento GPS</li>
                        <li className="hover:text-sky-400 transition-colors cursor-pointer">Garantía Técnica</li>
                    </ul>
                </div>
                <div>
                  <h5 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10">Newsletter</h5>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Recibe consejos y actualizaciones</p>
                  <div className="flex gap-2">
                      <input type="email" placeholder="EMAIL" className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-[10px] font-black outline-none w-full focus:border-sky-500 transition-all uppercase" />
                      <button className="bg-sky-600 p-3 rounded-xl text-white hover:bg-sky-700 shadow-lg shadow-sky-600/20"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
            </div>
            <div className="border-t border-white/5 pt-16 flex flex-col md:flex-row justify-between items-center gap-10">
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">© 2024 DedoctorDD. Todos los derechos reservados.</p>
                <div className="flex gap-8 text-slate-500">
                    <div className="hover:text-sky-500 cursor-pointer transition-colors"><Star className="w-5 h-5" /></div>
                    <div className="hover:text-sky-500 cursor-pointer transition-colors"><Star className="w-5 h-5 flex rotate-45" /></div>
                    <div className="hover:text-sky-500 cursor-pointer transition-colors"><Star className="w-5 h-5 flex rotate-90" /></div>
                </div>
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
