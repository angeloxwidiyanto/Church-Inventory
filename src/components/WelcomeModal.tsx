'use client';

import { useState } from 'react';
import { setSetting } from '@/actions/settings';

interface WelcomeModalProps {
    onComplete: (name: string, role: string) => void;
}

export default function WelcomeModal({ onComplete }: WelcomeModalProps) {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            await setSetting('user_profile', { name: name.trim(), role: role.trim() || 'User' });
            onComplete(name.trim(), role.trim() || 'User');
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to save. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-primary to-indigo-800 z-[100] flex items-center justify-center p-4">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
                <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-white/3 rounded-full blur-2xl" />
            </div>

            <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                {/* Logo & Welcome text */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20 shadow-2xl">
                        <span className="material-symbols-outlined text-white text-4xl">inventory_2</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome to StockFlow</h1>
                    <p className="text-blue-100/80 text-sm">Your offline inventory management system. Let&apos;s get you set up.</p>
                </div>

                {/* Form Card */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Your Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. John Smith"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-400"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Your Role
                        </label>
                        <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="e.g. Admin, Inventory Manager, Staff"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-400"
                        />
                        <p className="text-xs text-slate-400 mt-1.5">Optional — defaults to &quot;User&quot;</p>
                    </div>
                    <button
                        type="submit"
                        disabled={!name.trim() || isSaving}
                        className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                    >
                        {isSaving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                Get Started
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-blue-200/50 text-xs mt-6">
                    You can change these later in Settings
                </p>
            </div>
        </div>
    );
}
