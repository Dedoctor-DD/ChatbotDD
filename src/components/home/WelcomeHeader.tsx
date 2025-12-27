import type { Profile } from '../../types';

interface WelcomeHeaderProps {
  userName: string;
  profile: Partial<Profile> | null;
  onProfileClick: () => void;
}

export function WelcomeHeader({ userName, profile, onProfileClick }: WelcomeHeaderProps) {
  return (
    <section className="px-6 pt-12 md:pt-16 mb-10">
      <div className="flex justify-between items-center">
        <div className="animate-fade-in space-y-2">
           <div className="flex items-center gap-3">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em]">Control Nexus</span>
              <div className="h-[1px] w-12 bg-linear-to-r from-slate-200 to-transparent"></div>
           </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
            Hola, <span className="text-gradient px-1">{userName.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </span>
             Sistemas Operativos
          </p>
        </div>
        
        <button 
          onClick={onProfileClick}
          className="relative group btn-haptic"
        >
          <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-2xl group-hover:bg-primary/30 transition-all"></div>
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-white p-1 shadow-2xl shadow-slate-900/10 border border-slate-50 overflow-hidden ring-4 ring-white">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url || undefined} alt="Profile" className="w-full h-full object-cover rounded-[1.8rem] group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center rounded-[1.8rem]">
                 <span className="text-white font-black text-xl">{userName.charAt(0)}</span>
              </div>
            )}
          </div>
        </button>
      </div>
    </section>
  );
}
