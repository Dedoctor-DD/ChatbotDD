import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2 } from 'lucide-react';
import './Alliance.css';

interface LandingPageProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    service_type: 'Traslado DeDoctor',
    message: ''
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 40;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);

    // Reveal Animations
    const observerOptions = { threshold: 0.15 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

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
    <div className="alliance-wrapper bg-gradient-soft">
      {/* Header / Nav */}
      <nav className="fixed w-full z-[100] transition-all duration-500 py-6 px-4 md:px-12">
        <div className={`max-w-7xl mx-auto glass-nav rounded-3xl px-8 py-5 flex justify-between items-center transition-all ${isScrolled ? 'shadow-xl shadow-blue-900/5' : 'shadow-sm'}`}>
            <div className="flex items-center gap-4 text-left">
                <div className="flex flex-col">
                    <span className="font-extrabold text-xl tracking-tighter text-slate-900 uppercase">DeDoctor <span className="text-blue-600">& MMc</span></span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Grupo de Movilidad Integral</span>
                </div>
            </div>
            
            <div className="hidden lg:flex items-center gap-10 font-bold text-[11px] uppercase tracking-widest text-slate-500">
                <a href="#transporte" className="hover:text-blue-600 transition-colors">Transportes DeDoctor</a>
                <a href="#taller" className="hover:text-blue-600 transition-colors">Taller MMc</a>
                <button 
                  onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
                >
                    Presupuesto Especializado
                </button>
                <button onClick={onLoginClick} className="ml-4 hover:text-blue-600 transition-colors">Acceso</button>
            </div>

            <button className="lg:hidden text-slate-900 p-2">
                <i className="fas fa-bars-staggered text-xl"></i>
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-10 border border-blue-100">
                <i className="fas fa-link text-xs"></i>
                <span className="text-[10px] font-extrabold uppercase tracking-widest">Alianza Estratégica en Movilidad</span>
            </div>
            
            <h1 className="hero-title text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 mb-10">
                Te movemos. <br /> <span className="text-blue-600">Te cuidamos.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-16 font-medium leading-relaxed">
                Unimos la excelencia logística de <span className="text-slate-900 font-bold underline decoration-blue-500 decoration-4">Transportes DeDoctor</span> con la precisión técnica del <span className="text-slate-900 font-bold underline decoration-slate-400 decoration-4">Taller MMc</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
                <button 
                  onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-blue-600 text-white px-12 py-6 rounded-3xl font-extrabold text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1.5 transition-all flex items-center justify-center gap-3"
                >
                    Solicitar Asistencia <i className="fas fa-arrow-right text-sm"></i>
                </button>
                <a href="#alianza" className="bg-white text-slate-900 border border-slate-200 px-12 py-6 rounded-3xl font-extrabold text-lg hover:bg-slate-50 transition-all flex items-center justify-center">
                    Nuestra Alianza
                </a>
            </div>
        </div>
      </section>

      {/* Stats Branding Section */}
      <section id="alianza" className="py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-50 group text-left">
                <div className="text-blue-600 mb-6 text-2xl group-hover:scale-110 transition-transform"><i className="fas fa-shield-heart"></i></div>
                <h4 className="font-black text-slate-900 text-2xl mb-4 tracking-tighter leading-none">Compromiso DeDoctor</h4>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">Protocolos de transporte centrados en la dignidad humana y seguridad máxima.</p>
            </div>
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-900/10 text-left">
                <div className="text-blue-400 mb-6 text-2xl"><i className="fas fa-microchip"></i></div>
                <h4 className="font-black text-2xl mb-4 tracking-tighter leading-none">Ingeniería MMc</h4>
                <p className="text-slate-400 text-sm leading-relaxed font-medium text-balance">Especialistas en electrónica avanzada y mantenimiento estructural de alto rendimiento.</p>
            </div>
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-50 group text-left">
                <div className="text-blue-600 mb-6 text-2xl group-hover:scale-110 transition-transform"><i className="fas fa-sync"></i></div>
                <h4 className="font-black text-slate-900 text-2xl mb-4 tracking-tighter leading-none">Servicio Integral</h4>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">Si tu silla falla durante un viaje, nuestro equipo MMc la repara de inmediato.</p>
            </div>
        </div>
      </section>

      {/* Sección Empresa 1: Transportes DeDoctor */}
      <section id="transporte" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-20">
                <div className="w-full lg:w-1/2 reveal">
                    <div className="abstract-visual aspect-[4/5] rounded-[4rem] flex flex-col items-center justify-center p-12 text-center group">
                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-blue-600 text-4xl mb-8 shadow-2xl group-hover:rotate-6 transition-transform">
                            <i className="fas fa-van-shuttle"></i>
                        </div>
                        <h4 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Unidad de Traslado</h4>
                        <div className="w-full space-y-3 px-10">
                            <div className="h-2 w-full bg-blue-200 rounded-full"></div>
                            <div className="h-2 w-3/4 bg-blue-200 rounded-full mx-auto"></div>
                        </div>
                        <p className="mt-8 text-xs font-bold text-blue-500 uppercase tracking-widest">Transportes DeDoctor</p>
                    </div>
                </div>
                
                <div className="w-full lg:w-1/2 text-left">
                    <span className="brand-badge bg-blue-100 text-blue-700 mb-6 inline-block">División Logística</span>
                    <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-10 leading-[1.1] tracking-tighter">
                        Transportes <br /> <span className="text-blue-600 italic">DeDoctor.</span>
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-10">
                        <div className="flex gap-6">
                            <div className="w-16 h-16 shrink-0 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center text-blue-600">
                                <i className="fas fa-hand-holding-medical text-2xl"></i>
                            </div>
                            <div>
                                <h4 className="font-black text-xl text-slate-900 mb-2">Asistencia Personalizada</h4>
                                <p className="text-slate-500 leading-relaxed font-medium">No somos solo conductores. Somos asistentes capacitados que garantizan tu seguridad desde la puerta de tu hogar.</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-16 h-16 shrink-0 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center text-blue-600">
                                <i className="fas fa-calendar-check text-2xl"></i>
                            </div>
                            <div>
                                <h4 className="font-black text-xl text-slate-900 mb-2">Puntualidad Absoluta</h4>
                                <p className="text-slate-500 leading-relaxed font-medium">Entendemos el valor de tus citas médicas. Nuestra logística DeDoctor está optimizada para la cero demora.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Sección Empresa 2: Taller MMc */}
      <section id="taller" className="py-32 px-6">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-[5rem] overflow-hidden p-12 lg:p-24 relative shadow-2xl">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{background: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
            
            <div className="flex flex-col lg:flex-row-reverse items-center gap-20 relative z-10">
                <div className="w-full lg:w-1/2 reveal">
                    <div className="abstract-visual aspect-square rounded-[4rem] bg-slate-800 flex flex-col items-center justify-center p-12 border border-slate-700/50 group">
                        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl mb-8 shadow-2xl group-hover:rotate-12 transition-transform">
                            <i className="fas fa-wrench"></i>
                        </div>
                        <h4 className="text-4xl font-black text-white mb-4 tracking-tighter">Laboratorio Técnico</h4>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                        </div>
                        <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest italic">Taller MMc</p>
                    </div>
                </div>
                
                <div className="w-full lg:w-1/2 text-white text-left">
                    <span className="brand-badge bg-slate-800 text-blue-400 mb-6 inline-block">División Técnica</span>
                    <h2 className="text-5xl md:text-6xl font-black mb-10 leading-[1.1] tracking-tighter text-white">
                        Taller de Sillas <br /> <span className="text-blue-500">MMc.</span>
                    </h2>
                    
                    <div className="space-y-12">
                        <div className="flex gap-8 group">
                            <div className="w-12 h-12 shrink-0 border-b-2 border-blue-500 flex items-center justify-center text-blue-400 text-3xl font-black">
                                01
                            </div>
                            <div>
                                <h4 className="font-black text-2xl mb-3 text-white">Sillas Eléctricas</h4>
                                <p className="text-slate-400 font-medium leading-relaxed">Expertos en marcas internacionales. Reparamos joystick, módulos de potencia y pack de baterías con celdas de alta capacidad.</p>
                            </div>
                        </div>
                        <div className="flex gap-8 group">
                            <div className="w-12 h-12 shrink-0 border-b-2 border-slate-600 flex items-center justify-center text-slate-400 text-3xl font-black group-hover:border-blue-500 transition-colors">
                                02
                            </div>
                            <div>
                                <h4 className="font-black text-2xl mb-3 text-white">Stock Permanente</h4>
                                <p className="text-slate-400 font-medium leading-relaxed">No esperes repuestos. Tenemos el inventario de MMc más grande de la zona para neumáticos, cámaras y frenos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Formulario Unificado Premium */}
      <section id="contacto" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">¿Cómo podemos asistirte hoy?</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Atención unificada DeDoctor & MMc</p>
            </div>
            
            <div className="bg-white rounded-[4rem] shadow-2xl shadow-blue-900/5 overflow-hidden border border-slate-100 flex flex-col md:flex-row">
                <div className="md:w-1/3 bg-slate-900 p-12 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden text-left">
                    <div className="relative z-10">
                        <h4 className="text-3xl font-black mb-8 leading-none">Contacto Directo.</h4>
                        <div className="space-y-10">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-blue-400 tracking-widest mb-2">Transportes DeDoctor</p>
                                <p className="font-bold text-lg">+56 9 1234 5678</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-blue-400 tracking-widest mb-2">Taller MMc</p>
                                <p className="font-bold text-lg">+56 9 8765 4321</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">Email Central</p>
                                <p className="font-bold text-sm text-balance">grupo@dedoctor-mmc.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-2/3 p-12 lg:p-16 bg-white">
                    {formStatus === 'success' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6" />
                            <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">¡Recibido!</h4>
                            <p className="text-slate-500 font-medium">Un especialista se pondrá en contacto pronto.</p>
                            <button onClick={() => setFormStatus('idle')} className="mt-8 text-blue-600 font-bold uppercase text-xs tracking-widest">Enviar otro</button>
                        </div>
                    ) : (
                        <form className="grid grid-cols-1 sm:grid-cols-2 gap-8" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-2 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Nombre Completo</label>
                                <input 
                                    type="text" required
                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-sm" 
                                    placeholder="Tu nombre"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>
                            <div className="flex flex-col gap-2 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Celular / WhatsApp</label>
                                <input 
                                    type="tel" required
                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-sm" 
                                    placeholder="+56 9..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="sm:col-span-2 flex flex-col gap-2 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Requerimiento Especial</label>
                                <div className="flex flex-wrap gap-3">
                                    {(['Traslado DeDoctor', 'Servicio Taller MMc', 'Consulta Grupal'] as const).map((type) => (
                                        <button 
                                            key={type}
                                            type="button" 
                                            onClick={() => setFormData({...formData, service_type: type})}
                                            className={`px-5 py-3 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${formData.service_type === type ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="sm:col-span-2 flex flex-col gap-2 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Detalles del Pedido</label>
                                <textarea 
                                    rows={4} required
                                    className="w-full bg-slate-50 border-none rounded-3xl px-6 py-5 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-sm resize-none" 
                                    placeholder="¿En qué podemos ayudarte?"
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                ></textarea>
                            </div>
                            <button 
                                disabled={formStatus === 'loading'}
                                className="sm:col-span-2 bg-blue-600 text-white font-black py-6 rounded-3xl hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-2xl shadow-blue-200 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4"
                            >
                                {formStatus === 'loading' ? <Loader2 className="animate-spin w-5 h-5" /> : 'Solicitar Atención Prioritaria'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* Footer Unificado */}
      <footer className="py-20 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-12">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">
                            <i className="fas fa-link"></i>
                        </div>
                        <span className="font-black text-lg tracking-tighter uppercase">DeDoctor <span className="text-blue-600">& MMc</span></span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Red de Movilidad Integral Especializada</p>
                </div>
                
                <div className="flex gap-12 text-slate-500 font-bold text-xs uppercase tracking-widest">
                    <a href="#transporte" className="hover:text-blue-600 transition-colors">Logística</a>
                    <button onClick={onLoginClick} className="hover:text-blue-600 transition-colors uppercase font-bold text-xs">Acceso Portal</button>
                    <a href="#taller" className="hover:text-blue-600 transition-colors">Taller</a>
                </div>
                
                <div className="flex gap-4">
                    <a href="#" className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm"><i className="fab fa-instagram"></i></a>
                    <a href="#" className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm"><i className="fab fa-linkedin-in"></i></a>
                    <a href="https://wa.me/56912345678" className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 hover:bg-green-100 transition-all shadow-sm"><i className="fab fa-whatsapp"></i></a>
                </div>
            </div>
            <div className="text-center mt-20 pt-10 border-t border-slate-50 text-slate-300 text-[9px] font-bold uppercase tracking-[0.4em]">
                © {new Date().getFullYear()} Grupo DeDoctor & MMc • Excelencia en Movilidad Habilitada
            </div>
        </div>
      </footer>
    </div>
  );
}
