import type { ServiceRequest } from '../../types';

interface RecentActivityProps {
  requests: ServiceRequest[];
  onViewDetail: (request: ServiceRequest) => void;
}

export function RecentActivity({ requests, onViewDetail }: RecentActivityProps) {
  return (
    <section className="px-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
          Actividad Reciente
          <div className="h-px w-12 bg-slate-100"></div>
        </h3>
      </div>
      
      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map(req => {
            const isTransport = req.service_type === 'transport';
            return (
              <button 
                key={req.id} 
                onClick={() => onViewDetail(req)}
                className="w-full bg-white p-5 rounded-3xl border border-slate-50 flex items-center justify-between shadow-xl shadow-slate-200/40 cursor-pointer active:scale-98 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${isTransport ? 'bg-blue-50/50 text-primary' : 'bg-orange-50/50 text-orange-500'} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-2xl filled">
                      {isTransport ? 'ambulance' : 'build'}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-black text-sm text-slate-800 tracking-tight uppercase">
                      {isTransport ? 'Transporte' : 'Workshop'}
                    </h5>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
                      Solicitado el {new Date(req.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className={`text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${
                  req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                  req.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {req.status === 'completed' ? 'Finalizado' : 'En Proceso'}
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-16 text-center bg-white rounded-5xl border border-slate-100 shadow-inner">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <span className="material-symbols-outlined text-4xl text-slate-200 group-hover:rotate-12 transition-transform">history_toggle_off</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sin actividad reciente</p>
          </div>
        )}
      </div>
    </section>
  );
}
