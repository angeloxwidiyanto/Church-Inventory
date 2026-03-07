'use client';

import { useState, useEffect } from 'react';
import { getSetting } from '@/actions/settings';
import WelcomeModal from './WelcomeModal';

interface UserProfile {
    name: string;
    role: string;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        getSetting<UserProfile | null>('user_profile', null).then((p) => {
            if (p && p.name) {
                setProfile(p);
            } else {
                setShowWelcome(true);
            }
            setIsLoading(false);
        });
    }, []);

    const handleWelcomeComplete = (name: string, role: string) => {
        setProfile({ name, role });
        setShowWelcome(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {showWelcome && <WelcomeModal onComplete={handleWelcomeComplete} />}
            {children}
        </>
    );
}

// Export a hook-like getter for the profile to be used by other client components
export function useUserProfile() {
    const [profile, setProfile] = useState<UserProfile>({ name: '', role: '' });

    useEffect(() => {
        getSetting<UserProfile>('user_profile', { name: 'User', role: 'User' }).then(setProfile);
    }, []);

    return profile;
}
