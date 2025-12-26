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
  userName: string;
  userId: string;
}

export function HomePanel({ onServiceSelect, onGoToChat, onViewDetail, userName: initialUserName, userId }: HomePanelProps) {

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
    <div className="flex flex-col min-h-full pb-24 md:pb-8 bg-slate-50/30">
      <WelcomeHeader 
        userName={userName} 
        profile={profile} 
        onProfileClick={() => setIsProfileModalOpen(true)} 
      />

      <section className="px-6 mb-8 mt-6">
        <button 
          onClick={() => setIsBookingModalOpen(true)}
          className="w-full bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/20 relative overflow-hidden group active:scale-[0.98] transition-all"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-4 relative z-10">
             <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">calendar_month</span>
             </div>
             <div className="text-left">
                <h4 className="font-black uppercase tracking-widest text-xs mb-1 text-blue-200">Oferta Exclusiva</h4>
                <div className="text-lg font-black tracking-tight">Agendar Hora / Cita</div>
             </div>
             <div className="ml-auto w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">arrow_forward</span>
             </div>
          </div>
        </button>
      </section>

      <ServicesGrid onServiceSelect={onServiceSelect} />

      <ChatbotBanner onGoToChat={onGoToChat} />

      <RecentActivity requests={recentRequests} onViewDetail={onViewDetail} />

      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={userId}
        onUpdate={loadUserData}
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
