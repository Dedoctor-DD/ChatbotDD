import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

    useEffect(() => {
        const handleSessionCheck = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error getting session:', error);
                    if (error.status === 401 || error.message.includes('invalid_grant')) {
                        await supabase.auth.signOut();
                        localStorage.clear();
                    }
                }

                if (session) {
                    setSession(session);

                    // Fetch Role - use maybeSingle() to avoid errors if profile doesn't exist yet
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    setUserRole(profile?.role as 'admin' | 'user' || 'user');
                }
            } catch (err) {
                console.error('Auth check failed:', err);
            } finally {
                // Always stop the checking state, even on error
                setIsCheckingSession(false);
            }
        };

        handleSessionCheck();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                // Re-fetch role on auth change
                supabase.from('profiles').select('role').eq('id', session.user.id).single()
                    .then(({ data }) => setUserRole(data?.role as 'admin' | 'user' || 'user'));
            } else {
                setUserRole(null);
            }

            setIsCheckingSession(false);

            if (session && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
                // Clear the hash from the URL so it looks clean
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    window.history.replaceState(null, '', window.location.pathname);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const isAdmin = userRole === 'admin';

    const userName = session?.user?.user_metadata?.full_name ||
        session?.user?.user_metadata?.name ||
        session?.user?.email?.split('@')[0] ||
        'Usuario';

    return { session, isCheckingSession, isAdmin, userName, userRole };
}
