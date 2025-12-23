import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        const handleSessionCheck = async () => {
            // Check if we have a pending auth hash in the URL
            const hasAuthHash = window.location.hash && window.location.hash.includes('access_token');

            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Error getting session:', error);
                if (error.status === 401 || error.message.includes('invalid_grant')) {
                    await supabase.auth.signOut();
                    localStorage.clear();
                    setIsCheckingSession(false);
                }
            }

            if (session) {
                setSession(session);
                setIsCheckingSession(false);
            } else if (!hasAuthHash) {
                setTimeout(() => setIsCheckingSession(false), 800);
            }
        };

        handleSessionCheck();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setIsCheckingSession(false);

            if (session && _event === 'SIGNED_IN') {
                window.history.replaceState(null, '', window.location.pathname);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const isAdmin = session?.user?.email === 'dedoctor.transportes@gmail.com';

    const userName = session?.user?.user_metadata?.full_name ||
        session?.user?.user_metadata?.name ||
        session?.user?.email?.split('@')[0] ||
        'Usuario';

    return { session, isCheckingSession, isAdmin, userName };
}
