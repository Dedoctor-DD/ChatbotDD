interface DebtAlertProps {
    totalDebt: number;
    onPayClick: () => void;
  }
  
  export function DebtAlert({ totalDebt, onPayClick }: DebtAlertProps) {
    if (totalDebt <= 0) return null;
  
    return (
      <section className="px-6 mb-8">
        <div className="bg-rose-500 rounded-3xl p-6 text-white shadow-xl shadow-rose-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-2xl filled">account_balance_wallet</span>
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest mb-1">Pago Pendiente</h4>
                <p className="text-2xl font-black tracking-tighter">${totalDebt.toLocaleString()}</p>
              </div>
            </div>
            <button 
              onClick={onPayClick}
              className="px-6 py-3 bg-white text-rose-500 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all border-none"
            >
              PAGAR
            </button>
          </div>
        </div>
      </section>
    );
  }
