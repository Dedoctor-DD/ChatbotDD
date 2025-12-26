import type { Profile } from '../../types';

interface WelcomeHeaderProps {
  userName: string;
  profile: Partial<Profile> | null;
  onProfileClick: () => void;
}

export function WelcomeHeader({ userName, profile, onProfileClick }: WelcomeHeaderProps) {
  return (
    <section className="px-6 pt-10 mb-8">
      <div className="flex justify-between items-end">
        <div className="animate-fade-in">
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Bienvenido de vuelta</span>
              <div className="h-px w-8 bg-slate-200"></div>
           </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            ¡Hola, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">{userName.split(' ')[0]}</span>!
          </h2>
        </div>
        <button 
          onClick={onProfileClick}
          className="w-14 h-14 rounded-2xl bg-white shadow-2xl shadow-slate-200 flex items-center justify-center border border-slate-50 overflow-hidden active:scale-90 transition-all group"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
          ) : (
            <span className="material-symbols-outlined text-primary text-4xl group-hover:scale-110 transition-transform">account_circle</span>
          )}
        </button>
      </div>
    </section>
  );
}
