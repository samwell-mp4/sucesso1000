import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'seller';
    status: 'active' | 'inactive';
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (session: Session) => {
        try {
            // In a real scenario, we would fetch the role from a 'profiles' table.
            // For now, we'll assume the role is stored in user metadata OR default to 'seller' if not found.
            // If you have a 'profiles' table, uncomment the code below:

            /*
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) throw error;
            */

            // MOCK PROFILE LOGIC FOR DEMO (Replace with real DB fetch if 'profiles' table exists)
            // We will use the email to determine role for now to keep it simple if table doesn't exist yet
            const role = session.user.email?.includes('admin') ? 'admin' : 'seller';

            setUser({
                id: session.user.id,
                name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email!,
                role: role as 'admin' | 'seller',
                status: 'active',
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
