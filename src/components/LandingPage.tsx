import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { GlobalNavbar } from './GlobalNavbar';

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

  const BRAND_BLUE = '#2b6cb0'; // Updating to accent-blue
  const BRAND_SLATE = '#102a43'; // Updating to navy-900
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Reveal Animations
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
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
    <div className="alliance-wrapper bg-gradient-soft min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#fcfcfd', paddingTop: '120px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        .alliance-wrapper {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          color: #1e293b;
          text-align: center;
          overflow-x: hidden;
          background-color: #fcfcfd;
        }

        .bg-gradient-soft {
          background: #f0f4f8; /* navy-50 */
          background-image: 
            radial-gradient(at 0% 0%, rgba(43, 108, 176, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(16, 42, 67, 0.05) 0px, transparent 50%);
        }

        .hero-title {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          line-height: 1.05 !important;
          letter-spacing: -0.05em !important;
          font-weight: 800 !important;
        }

        .reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }

        .abstract-visual {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.02);
        }

        @keyframes pulse-slow {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.1); opacity: 0.5; }
        }

        .abstract-visual::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.06) 0%, transparent 70%);
          animation: pulse-slow 6s infinite alternate;
        }

        .glass-nav {
          background: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.5) !important;
        }

        .brand-badge {
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          font-weight: 800;
          padding: 0.6rem 1.25rem;
          border-radius: 99px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .squares-bg {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(99, 102, 241, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(circle at center, black, transparent 80%);
          z-index: 0;
        }

        .tilt-card-container {
          perspective: 1000px;
          transition: transform 0.1s ease-out;
        }

        .tilt-card {
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .tilt-card:hover {
          /* Controlled by JS for precise tilt */
        }

        .reflection {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.1) 100%);
          pointer-events: none;
          mix-blend-mode: soft-light;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .tilt-card:hover .reflection {
          opacity: 1;
        }

        input, textarea, select {
          border: 1px solid #e2e8f0 !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          font-size: 16px !important; /* Prevents auto-zoom on iOS */
        }
        
        input:focus, textarea:focus {
          border-color: #3b82f6 !important;
          background: white !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08) !important;
        }
        
        .btn-base {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          border: none;
          white-space: nowrap;
        }

        .btn-base:hover {
          transform: translateY(-2px);
        }

        .btn-base:active {
          transform: translateY(0) scale(0.98);
        }

        .card-shadow {
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 4px 10px -5px rgba(0, 0, 0, 0.02);
        }

        .card-shadow-hover:hover {
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.08);
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 3.25rem !important;
            letter-spacing: -0.04em !important;
          }
          .section-title {
            font-size: 2.5rem !important;
            text-align: center !important;
          }
          .section-description {
            text-align: center !important;
          }
          .card-center-mobile {
            text-align: center !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
        }
      `}</style>

      {/* Global Navigation Bar */}
      <GlobalNavbar 
        onLoginClick={onLoginClick}
        showLoginButton={true}
        showNavLinks={true}
      />

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-24 pb-20 md:pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
            <div 
              className="inline-flex items-center gap-2 md:gap-3 px-4 py-2 rounded-full mb-8 border"
              style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#dbeafe' }}
            >
                <span className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest">Alianza Estratégica en Movilidad</span>
            </div>
            
            <h1 
              className="hero-title mb-8"
              style={{ 
                fontSize: 'clamp(2.5rem, 8vw, 6.5rem)', 
                color: BRAND_SLATE,
                margin: '0 auto 2rem auto',
                maxWidth: '900px'
              }}
            >
                Te movemos. <br className="hidden md:block" /> <span style={{ color: BRAND_BLUE }}>Te cuidamos.</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed px-4">
                Unimos la excelencia logística de <span className="font-bold underline decoration-4" style={{ textDecorationColor: BRAND_BLUE }}>Transportes DeDoctor</span> con la precisión técnica del <span className="font-bold underline decoration-4" style={{ textDecorationColor: '#cbd5e1' }}>Taller MMC</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 md:gap-8">
                <button 
                    onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group w-full sm:w-auto px-12 py-5 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-base md:text-lg transition-all flex items-center justify-center gap-4 border-none bg-blue-600 text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:translate-y-[-2px]"
                >
                    Solicitar Asistencia
                    <i className="fas fa-chevron-right text-xs group-hover:translate-x-1 transition-transform"></i>
                </button>
                <button 
                    onClick={() => document.getElementById('alianza')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full sm:w-auto px-12 py-5 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-base md:text-lg transition-all flex items-center justify-center border-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-300"
                >
                    Explorar Alianza
                </button>
            </div>

            {/* Simulated Trust Indicators */}
            <div className="mt-20 md:mt-28 reveal pt-10 border-t border-slate-100/50">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Red de confianza con estándares internacionales</p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                    <div className="flex items-center gap-2 font-black text-xl italic tracking-tighter text-slate-900 border-2 border-slate-900 px-3 py-1 rounded">ISO <span className="text-blue-600">9001</span></div>

                    <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-slate-900"><i className="fas fa-truck-fast"></i> LOGI-TECH</div>
                    <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-slate-900 text-blue-800"><i className="fas fa-bolt"></i> MMC HARDWARE</div>
                </div>
            </div>
        </div>
      </section>

      <section id="alianza" className="py-24 px-6 relative overflow-hidden bg-slate-50">
        <div className="squares-bg opacity-30"></div>
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16 reveal">
                <p className="text-blue-700 font-extrabold uppercase tracking-[0.2em] text-[11px] mb-4">¿Por qué elegirnos?</p>
                <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">Excelencia Técnica y <br /> Compromiso Humano</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Card 1 */}
                <div className="h-full flex flex-col items-center justify-center text-center bg-white p-10 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-all group hover:-translate-y-1">
                    <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                        <i className="fas fa-shield-heart"></i>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xl mb-4">Misión DeDoctor</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">Protocolos de transporte diseñados para preservar la dignidad y seguridad de cada paciente.</p>
                </div>
                
                {/* Card 2 */}
                <div className="h-full flex flex-col items-center justify-center text-center bg-white p-10 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-all group hover:-translate-y-1">
                    <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                        <i className="fas fa-microchip"></i>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xl mb-4">Ingeniería MMC</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">Laboratorio especializado en electrónica de movilidad. Reparación de precisión para equipos críticos.</p>
                </div>
                
                {/* Card 3 */}
                <div className="h-full flex flex-col items-center justify-center text-center bg-white p-10 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-all group hover:-translate-y-1">
                    <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                        <i className="fas fa-sync"></i>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xl mb-4">Cobertura Total</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">Respaldo técnico inmediato ante cualquier eventualidad en ruta. Tu movilidad nunca se detiene.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Sección Empresa 1: Transportes DeDoctor */}
      <section id="transporte" className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                <div className="w-full lg:w-1/2 reveal">
                    {/* Espacio reservado para galería de fotos */}
                </div>
                
                <div className="w-full lg:w-1/2 text-left">
                    <div className="flex justify-center md:justify-start">
                        <span 
                          className="brand-badge mb-6"
                          style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                        >
                          <i className="fas fa-route"></i> División Logística
                        </span>
                    </div>
                    <h2 className="section-title text-4xl md:text-6xl font-black text-slate-900 mb-8 md:mb-10 leading-[1.1] tracking-tighter">
                        Transportes <br className="hidden md:block" /> <span className="italic" style={{ color: BRAND_BLUE }}>DeDoctor.</span>
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-8 md:gap-12">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 card-center-mobile">
                            <div 
                              className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm flex items-center justify-center"
                              style={{ color: BRAND_BLUE }}
                            >
                                <i className="fas fa-hand-holding-medical text-2xl md:text-3xl"></i>
                            </div>
                            <div className="section-description">
                                <h4 className="font-black text-xl md:text-2xl text-slate-900 mb-3">Asistencia Personalizada</h4>
                                <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">No somos solo conductores. Somos asistentes capacitados que garantizan tu seguridad desde la puerta de tu hogar.</p>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 card-center-mobile">
                            <div 
                              className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm flex items-center justify-center"
                              style={{ color: BRAND_BLUE }}
                            >
                                <i className="fas fa-calendar-check text-2xl md:text-3xl"></i>
                            </div>
                            <div className="section-description">
                                <h4 className="font-black text-xl md:text-2xl text-slate-900 mb-3">Puntualidad Absoluta</h4>
                                <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">Entendemos el valor de tus citas médicas. Nuestra logística DeDoctor está optimizada para la cero demora.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Sección Empresa 2: Taller MMC */}
      <section id="taller" className="py-20 md:py-32 px-6">
        <div 
          className="max-w-7xl mx-auto rounded-[3.5rem] md:rounded-[5.5rem] overflow-hidden p-10 md:p-24 relative shadow-[0_50px_100px_-20px_rgba(15,23,42,0.3)]"
          style={{ backgroundColor: BRAND_SLATE }}
        >
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{background: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
            
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-24 relative z-10">
                <div className="w-full lg:w-1/2 reveal">
                    {/* Espacio reservado para galería de fotos */}
                </div>
                
                <div className="w-full lg:w-1/2 text-white text-left">
                    <div className="flex justify-center">
                        <span 
                          className="brand-badge mb-6"
                          style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}
                        >
                          <i className="fas fa-microchip"></i> División Técnica
                        </span>
                    </div>
                    <h2 className="section-title text-4xl md:text-6xl font-black mb-8 md:mb-10 leading-[1.1] tracking-tighter text-white text-center">
                        Taller de Sillas <br className="hidden md:block" /> <span style={{ color: '#3b82f6' }}>MMC.</span>
                    </h2>
                    
                    <div className="space-y-10 md:space-y-16">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 group card-center-mobile">
                            <div 
                              className="w-14 h-14 md:w-16 md:h-16 shrink-0 border-b-4 flex items-center justify-center text-3xl md:text-4xl font-black mx-auto"
                              style={{ borderBottomColor: '#3b82f6', color: '#60a5fa' }}
                            >
                                01
                            </div>
                            <div className="section-description text-center">
                                <h4 className="font-black text-xl md:text-2xl mb-4 text-white">Sillas Eléctricas</h4>
                                <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">Expertos en marcas internacionales. Reparamos joystick, módulos de potencia y pack de baterías con celdas de alta capacidad.</p>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 group card-center-mobile">
                            <div 
                              className="w-14 h-14 md:w-16 md:h-16 shrink-0 border-b-4 flex items-center justify-center text-3xl md:text-4xl font-black mx-auto"
                              style={{ borderBottomColor: '#475569', color: '#94a3b8' }}
                            >
                                02
                            </div>
                            <div className="section-description text-center">
                                <h4 className="font-black text-xl md:text-2xl mb-4 text-white">Stock Permanente</h4>
                                <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">No esperes repuestos. Tenemos el inventario de MMC más grande de la zona para neumáticos, cámaras y frenos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Formulario Unificado Premium */}
      <section id="contacto" className="py-20 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-4 px-4">¿Cómo podemos asistirte hoy?</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Atención unificada DeDoctor & MMC</p>
            </div>
            
            <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl shadow-blue-900/5 overflow-hidden border border-slate-100 p-8 md:p-12 lg:p-20">
                <div className="max-w-4xl mx-auto">
                    {formStatus === 'success' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-scale-in">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-8">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h4 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">¡Solicitud Enviada!</h4>
                            <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">Gracias por tu confianza. Un especialista revisará tu caso y te contactará en breve.</p>
                            <button 
                                onClick={() => setFormStatus('idle')} 
                                className="mt-10 btn-base px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] tracking-[0.2em] uppercase hover:bg-slate-800 transition-all font-black"
                            >
                                Enviar Nuevo Requerimiento
                            </button>
                        </div>
                    ) : (
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-3 text-left">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 flex items-center gap-2">
                                    <i className="fas fa-user text-blue-500/50"></i> Nombre Completo
                                </label>
                                <input 
                                    type="text" required
                                    className="w-full bg-slate-50 rounded-xl px-4 py-4 font-medium text-slate-700 placeholder:text-slate-400 border border-slate-200 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                    placeholder="Ej: Manuel García"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>
                            <div className="flex flex-col gap-3 text-left">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 flex items-center gap-2">
                                    <i className="fas fa-phone text-blue-500/50"></i> WhatsApp de Contacto
                                </label>
                                <input 
                                    type="tel" required
                                    className="w-full bg-slate-50 rounded-xl px-4 py-4 font-medium text-slate-700 placeholder:text-slate-400 border border-slate-200 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                    placeholder="+56 9 XXXX XXXX"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-3 text-left">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 flex items-center gap-2">
                                    <i className="fas fa-list-check text-blue-500/50"></i> Tipo de Servicio Solicitado
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {(['Traslado DeDoctor', 'Servicio Taller MMC', 'Consulta Grupal'] as const).map((type) => (
                                        <button 
                                            key={type}
                                            type="button" 
                                            onClick={() => setFormData({...formData, service_type: type})}
                                            className={`btn-base px-4 py-4 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest border transition-all ${
                                                formData.service_type === type 
                                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-[1.02]' 
                                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-3 text-left">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 flex items-center gap-2">
                                    <i className="fas fa-comment-medical text-blue-500/50"></i> Descripción del Problema o Ruta
                                </label>
                                <textarea 
                                    rows={5} required
                                    className="w-full bg-slate-50 rounded-xl px-4 py-4 font-medium text-slate-700 placeholder:text-slate-400 border border-slate-200 focus:border-blue-500 focus:bg-white transition-all outline-none resize-none"
                                    placeholder="Cuéntanos brevemente qué necesitas..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                ></textarea>
                            </div>
                            <div className="md:col-span-2">
                                <button 
                                    disabled={formStatus === 'loading'}
                                    className="btn-base w-full text-white font-black py-6 rounded-[2rem] uppercase tracking-[0.3em] text-xs md:text-sm hover:scale-[1.01] transition-transform flex items-center justify-center gap-4"
                                    style={{ backgroundColor: BRAND_BLUE, boxShadow: '0 25px 50px -12px rgba(37, 99, 235, 0.5)' }}
                                >
                                    {formStatus === 'loading' ? (
                                        <>
                                            <Loader2 className="animate-spin w-5 h-5" />
                                            <span>Procesando Solicitud...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane mr-2"></i>
                                            Solicitar Atención Prioritaria
                                        </>
                                    )}
                                </button>
                                <p className="text-[9px] text-slate-400 mt-6 font-bold uppercase tracking-[0.2em]">Enviando a través del protocolo seguro DeDoctor v4.0</p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* Footer Unificado */}
      <footer className="py-16 md:py-20 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-12">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs shadow-lg shadow-blue-600/20" style={{ backgroundColor: BRAND_BLUE }}>
                            <i className="fas fa-link"></i>
                        </div>
                        <span className="font-black text-lg tracking-tighter uppercase" style={{ color: BRAND_SLATE }}>DeDoctor <span style={{ color: BRAND_BLUE }}>& MMC</span></span>
                    </div>
                    <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em]">Red de Movilidad Integral Especializada</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                    <a href="#transporte" className="hover:text-blue-600 transition-colors no-underline">Logística</a>
                    <button 
                      onClick={onLoginClick} 
                      className="hover:text-blue-600 transition-colors uppercase font-bold text-[10px] md:text-xs bg-transparent border-none p-0"
                    >
                      Acceso
                    </button>
                    <a href="#taller" className="hover:text-blue-600 transition-colors no-underline">Taller</a>
                </div>
                
                <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm"><i className="fab fa-instagram"></i></a>
                    <a href="#" className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm"><i className="fab fa-linkedin-in"></i></a>
                    <a href="https://wa.me/56912345678" className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-xl md:rounded-2xl flex items-center justify-center text-green-500 hover:bg-green-100 transition-all shadow-sm"><i className="fab fa-whatsapp"></i></a>
                </div>
            </div>
            <div className="text-center mt-12 md:mt-20 pt-8 md:pt-10 border-t border-slate-50 text-slate-300 text-[8px] md:text-[9px] font-bold uppercase tracking-[0.4em]">
                © {new Date().getFullYear()} Grupo DeDoctor & MMC • Excelencia en Movilidad Habilitada
            </div>
        </div>
      </footer>
    </div>
  );
}
