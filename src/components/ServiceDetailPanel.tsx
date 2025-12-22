import type { ServiceRequest } from '../types';

interface ServiceDetailPanelProps {
    request: ServiceRequest;
    onBack: () => void;
}

export function ServiceDetailPanel({ request, onBack }: ServiceDetailPanelProps) {
    const isTransport = request.service_type === 'transport';
    
    const getStatusStep = (status: string) => {
        const steps = ['pending', 'confirmed', 'in_process', 'completed'];
        return steps.indexOf(status);
    };

    const currentStep = getStatusStep(request.status);

    const val = (key: string) => request.collected_data?.[key] || '---';

    return (
        <div className="flex flex-col w-full min-h-full bg-background-light dark:bg-background-dark pb-24">
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center px-4 h-16">
                    <button onClick={onBack} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors border-none bg-transparent">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex-1 text-center pr-10">Detalles del Servicio</h1>
                </div>
            </header>

            <main className="flex-1 p-6 space-y-8 animate-fade-in">
                {/* Status Stepper */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado del Servicio</h3>
                        <span className="text-[9px] font-black text-primary px-3 py-1 bg-primary/10 rounded-full uppercase">ID: {request.id.slice(0, 8)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between relative px-2">
                        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100 dark:bg-gray-800">
                            <div 
                                className="h-full bg-primary transition-all duration-1000" 
                                style={{ width: `${(Math.max(0, currentStep) / 3) * 100}%` }}
                            ></div>
                        </div>
                        
                        {['schedule', 'verified', 'track_changes', 'check_circle'].map((icon, idx) => (
                            <div key={icon} className={`relative z-10 size-10 rounded-full flex items-center justify-center border-4 border-white dark:border-background-dark transition-all duration-500 shadow-sm ${idx <= currentStep ? 'bg-primary text-white scale-110' : 'bg-gray-100 dark:bg-gray-800 text-gray-300'}`}>
                                <span className={`material-symbols-outlined text-lg ${idx <= currentStep ? 'filled' : ''}`}>{icon}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-between mt-3 px-1">
                        {['Pendiente', 'Confirmado', 'En Proceso', 'Finalizado'].map((label, idx) => (
                            <span key={label} className={`text-[8px] font-black uppercase tracking-tighter ${idx === currentStep ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
                        ))}
                    </div>
                </section>

                {/* Map / Visual Mock */}
                <section className="relative w-full h-48 rounded-[2.5rem] overflow-hidden shadow-xl border border-white dark:border-gray-800 bg-slate-200 dark:bg-gray-800 group">
                    <img 
                        src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1000" 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-1000"
                        alt="Map"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                        <div className="size-16 bg-primary/20 rounded-full animate-ping absolute"></div>
                        <div className="size-8 bg-primary rounded-full border-4 border-white/50 shadow-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-sm filled">{isTransport ? 'ambulance' : 'build'}</span>
                        </div>
                    </div>
                </section>

                {/* Details Card */}
                <section className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isTransport ? 'bg-blue-50 text-primary' : 'bg-orange-50 text-orange-500'}`}>
                            <span className="material-symbols-outlined text-3xl filled">{isTransport ? 'trip_origin' : 'auto_fix'}</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{isTransport ? 'Ruta de Traslado' : 'Detalles Técnicos'}</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{isTransport ? 'Logística DeDoctor' : 'Ingeniería MMc'}</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {isTransport ? (
                            <>
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Punto de Partida</span>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{val('origen') || val('desde')}</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Destino Final</span>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{val('destino') || val('hacia')}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Fecha</span>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{val('fecha')}</p>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Hora</span>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{val('hora')}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Equipo / Modelo</span>
                                        <p className="text-base font-black text-primary">{val('modelo') || val('equipo')}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Problema Reportado</span>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed italic">"{val('problema') || val('falla')}"</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Attachments if any */}
                        {request.collected_data?.image_urls && request.collected_data.image_urls.length > 0 && (
                            <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-3 block">Archivos Adjuntos</span>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                                    {request.collected_data.image_urls.map((url: string, i: number) => (
                                        <a key={i} href={url} target="_blank" rel="noreferrer" className="size-16 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shrink-0">
                                            <img src={url} className="w-full h-full object-cover" alt="Attachment" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10 flex flex-col gap-4">
                    <h4 className="text-sm font-black text-primary uppercase tracking-widest">¿Necesitas ayuda?</h4>
                    <p className="text-xs text-gray-500 font-bold leading-relaxed">Nuestros agentes están disponibles 24/7 para cambios en tu solicitud.</p>
                    <button className="h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all border-none cursor-pointer">
                        <span className="material-symbols-outlined text-lg">support_agent</span>
                        Contactar Soporte
                    </button>
                </div>
            </main>
        </div>
    );
}
