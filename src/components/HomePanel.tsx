import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ProfileModal } from './ProfileModal';
import { BookingModal } from './home/BookingModal';
import { WelcomeHeader } from './home/WelcomeHeader';

import { ServicesGrid } from './home/ServicesGrid';
import { ChatbotBanner } from './home/ChatbotBanner';
import { RecentActivity } from './home/RecentActivity';

import type { ServiceRequest, Profile } from '../types';

interface HomePanelProps {
  onServiceSelect: (service: 'transport' | 'workshop') => void;
  onGoToChat: () => void;
  onViewDetail: (request: ServiceRequest) => void;
  onViewHistory: () => void;
  onLogout: () => void;
  userName: string;
  userId: string;
}


export function HomePanel({ onServiceSelect, onGoToChat, onViewDetail, onViewHistory, onLogout, userName: initialUserName, userId }: HomePanelProps) {

  const [recentRequests, setRecentRequests] = useState<ServiceRequest[]>([]);
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileData) setProfile(profileData);

      const { data: reqData } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reqData) setRecentRequests(reqData);

    } catch (e) {
      console.error('Error loading user data', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId, loadUserData]);


  const userName = profile?.full_name || initialUserName;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-full pb-8 md:pb-8 bg-slate-50/30">
      <WelcomeHeader 
        userName={userName} 
        profile={profile} 
        onProfileClick={() => setIsProfileModalOpen(true)} 
      />

      <section className="px-6 mb-12">
        <button 
          onClick={() => setIsBookingModalOpen(true)}
          className="w-full bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/40 relative overflow-hidden group btn-haptic"
        >
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full -mr-32 -mt-32 blur-[80px] group-hover:bg-secondary/40 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-16 -mb-16 blur-[40px]"></div>
          
          <div className="flex items-center gap-6 relative z-10 px-2">
             <div className="size-16 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:rotate-6 transition-transform">
                <span className="material-symbols-outlined text-white text-3xl filled leading-none">calendar_add_on</span>
             </div>
             <div className="text-left flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-1 text-secondary leading-none">Sistemas Activos</p>
                <h4 className="text-xl md:text-2xl font-black tracking-tighter leading-tight">Agendar Cita / Hora</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1 opacity-80">Reserva instantánea con Arise AI</p>
             </div>
             <div className="size-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-slate-900 transition-all">
                <span className="material-symbols-outlined">arrow_forward_ios</span>
             </div>
          </div>
        </button>
      </section>

      <ServicesGrid onServiceSelect={onServiceSelect} />

      <ChatbotBanner onGoToChat={onGoToChat} />

      <RecentActivity requests={recentRequests} onViewDetail={onViewDetail} onViewHistory={onViewHistory} />

      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={userId}
        onUpdate={loadUserData}
        onLogout={() => {
           onLogout();
           setIsProfileModalOpen(false);
        }}
      />
      
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        userId={userId}
        userName={userName}
      />


    </div>
  );
}
