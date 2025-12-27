import type { ServiceRequest } from '../../types';

interface RecentActivityProps {
  requests: ServiceRequest[];
  onViewDetail: (request: ServiceRequest) => void;
  onViewHistory: () => void;
}

export function RecentActivity({ requests, onViewDetail, onViewHistory }: RecentActivityProps) {
  return (
    <section className="px-6 pb-20 md:pb-8">
      <div className="flex justify-between items-center mb-8 group/title">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
          Historial Reciente
          <div className="h-px w-10 bg-slate-200 group-hover/title:w-16 transition-all duration-500"></div>
        </h3>
        <button 
           onClick={onViewHistory}
           className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] bg-secondary/5 px-4 py-2 rounded-xl hover:bg-secondary hover:text-white transition-all duration-300"
        >
           Expedientes
        </button>
      </div>
      
      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map(req => {
            const isTransport = req.service_type === 'transport';
            return (
              <button 
                key={req.id} 
                onClick={() => onViewDetail(req)}
                className="w-full bg-white p-6 rounded-[2rem] border border-slate-50 flex items-center justify-between shadow-2xl shadow-slate-200/30 cursor-pointer btn-haptic text-left group hover:border-slate-200/50"
              >
                <div className="flex items-center gap-5">
                  <div className={`size-14 ${isTransport ? 'bg-blue-50/80 text-secondary' : 'bg-amber-50/80 text-amber-600'} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all ring-1 ring-slate-100 shadow-sm`}>
                    <span className="material-symbols-outlined text-2xl filled">
                      {isTransport ? 'emergency_share' : 'engineering'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-black text-sm text-slate-800 tracking-tight uppercase leading-none">
                      {isTransport ? 'Traslado' : 'Taller MMc'}
                    </h5>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5 opacity-80">
                      <span className="material-symbols-outlined text-[10px]">calendar_today</span>
                      {new Date(req.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                   <div className={`text-[8px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest shadow-sm ring-1 ring-inset ${
                     req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : 
                     req.status === 'confirmed' ? 'bg-blue-50 text-blue-600 ring-blue-100' : 
                     req.status === 'pending' ? 'bg-amber-50 text-amber-600 ring-amber-100' :
                     'bg-slate-50 text-slate-400 ring-slate-200'
                   }`}>
                     {req.status === 'completed' ? 'Finalizado' : req.status === 'pending' ? 'Pendiente' : req.status === 'confirmed' ? 'En Curso' : 'Draft'}
                   </div>
                   <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">#{req.id.slice(0, 4)}</span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-inner group">
            <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
               <span className="material-symbols-outlined text-4xl text-slate-200 animate-pulse-slow">history_edu</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-8 leading-relaxed">Sin actividad registrada en los puntos de enlace.</p>
          </div>
        )}
      </div>
    </section>
  );
}
