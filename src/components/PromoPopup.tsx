import { useState, useEffect } from 'react';

export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show popup after a short delay on mount
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000); // 1 second delay
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      ></div>
      
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <img 
          src="/promo_popup.png" 
          alt="Noticias DeDoctor" 
          className="w-full h-auto object-cover"
        />
        
        <div className="p-6 bg-white text-center">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">¡Novedades!</h3>
            <p className="text-sm text-slate-500 font-medium mb-4">Entérate de nuestras últimas noticias y promociones exclusivas.</p>
            <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-colors"
            >
                Entendido
            </button>
        </div>
      </div>
    </div>
  );
}
