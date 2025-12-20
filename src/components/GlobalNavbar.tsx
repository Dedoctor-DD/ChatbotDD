import { ArrowLeft, LogIn, User } from 'lucide-react';

interface GlobalNavbarProps {
  onBack?: () => void;
  showBackButton?: boolean;
  onLoginClick?: () => void;
  showLoginButton?: boolean;
  showNavLinks?: boolean;
}

export function GlobalNavbar({ 
  onBack, 
  showBackButton = false,
  onLoginClick,
  showLoginButton = false,
  showNavLinks = false
}: GlobalNavbarProps) {
  return (
    <nav className="global-navbar">
      <div className="global-navbar-container">
        <div className="global-navbar-brand">
          <div className="global-navbar-logo">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="global-navbar-text">
            <span className="global-navbar-title">
              DeDoctor <span className="text-blue-600">&amp; MMc</span>
            </span>
            <span className="global-navbar-subtitle">Grupo de Movilidad Integral</span>
          </div>
        </div>
        
        {/* Navigation Links (Landing Page) */}
        {showNavLinks && (
          <div className="hidden lg:flex items-center gap-8 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500">
            <a href="#transporte" className="hover:text-blue-600 transition-colors no-underline">Transportes</a>
            <a href="#taller" className="hover:text-blue-600 transition-colors no-underline">Taller MMc</a>
            <a href="#contacto" className="hover:text-blue-600 transition-colors no-underline">Asistencia</a>
            
            <div className="w-px h-6 bg-slate-200 ml-2"></div>
            
            {onLoginClick && (
              <button 
                onClick={onLoginClick} 
                className="px-6 py-3 rounded-xl transition-all border-none bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 text-[10px]"
              >
                <LogIn className="w-3.5 h-3.5" />
                ACCESO PORTAL
              </button>
            )}
          </div>
        )}

        {/* Mobile Login Button (Landing Page) */}
        {showLoginButton && onLoginClick && (
          <button 
            onClick={onLoginClick} 
            className="lg:hidden text-white p-3 bg-blue-600 rounded-xl border-none shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all"
          >
            <User className="w-4 h-4" />
          </button>
        )}
        
        {/* Back Button (Login Page) */}
        {showBackButton && onBack && (
          <button 
            onClick={onBack}
            className="global-navbar-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
        )}
      </div>
    </nav>
  );
}

