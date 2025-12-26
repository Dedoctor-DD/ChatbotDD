import { useState, useEffect } from 'react';

interface PromoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PromoPopup({ isOpen, onClose }: PromoPopupProps) {
  const [currentImage, setCurrentImage] = useState(0);
  
  // Array de imágenes promocionales
  const images = [
    '/promo_1.png', // Main Game Night
    '/promo_2.png'  // Secondary Game Night
  ];

  // Auto-rotate
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(interval);
  }, [isOpen, images.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className="relative aspect-[4/5] bg-slate-100">
             <img 
                key={currentImage}
                src={images[currentImage]} 
                alt={`Promo ${currentImage + 1}`} 
                className="w-full h-full object-cover animate-fade-in"
                onError={(e) => {
                    // Fallback if image doesn't exist yet
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x800?text=Cargando+Promo...';
                }}
            />
            
            {/* Dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                            currentImage === idx 
                            ? 'bg-white w-6' 
                            : 'bg-white/50 hover:bg-white/80'
                        }`}
                    />
                ))}
            </div>
        </div>
        
        <div className="p-6 bg-white flex flex-col items-center">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">¡Novedades!</h3>
            <p className="text-sm text-slate-500 font-medium mb-4 text-center">
                Descubre nuestras últimas ofertas y eventos.
            </p>

            {/* Manual Navigation Buttons */}
            <div className="flex gap-2 mb-4 w-full">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                            currentImage === idx 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        Anuncio {idx + 1}
                    </button>
                ))}
            </div>

            <button 
                onClick={onClose}
                className="w-full py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
            >
                Entendido, ¡Gracias!
            </button>
        </div>
      </div>
    </div>
  );
}
