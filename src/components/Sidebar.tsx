"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserProfile } from './AppShell';

export default function Sidebar() {
    const pathname = usePathname();
    const profile = useUserProfile();

    const links = [
        { href: '/', icon: 'dashboard', label: 'Dashboard' },
        { href: '/locations', icon: 'location_on', label: 'Locations' },
        { href: '/activity-log', icon: 'history', label: 'Activity Log' },
        { href: '/settings', icon: 'settings', label: 'Settings' },
    ];

    const initials = profile.name
        ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0">
            <div className="p-6 flex items-center gap-3">
                <div className="bg-primary p-2 rounded-lg text-white flex items-center justify-center">
                    <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight">StockFlow</h1>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));

                    return (
                        <Link
                            key={link.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                ? 'text-primary bg-primary/10 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            href={link.href}
                        >
                            <span className="material-symbols-outlined">{link.icon}</span> {link.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-200">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                    <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {initials}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate">{profile.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{profile.role || 'User'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
