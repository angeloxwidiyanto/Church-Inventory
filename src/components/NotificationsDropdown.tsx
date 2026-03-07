import { useState, useRef, useEffect } from 'react';
import { Item } from '@/lib/db';

export default function NotificationsDropdown({ items }: { items: Item[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const alerts = items.filter(item => ['In Repair', 'Lost'].includes(item.status));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full relative transition-colors cursor-pointer ${isOpen ? 'bg-slate-100 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                <span className="material-symbols-outlined">notifications</span>
                {alerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">Notifications</h3>
                        {alerts.length > 0 && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                {alerts.length} Alerts
                            </span>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto p-2">
                        {alerts.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {alerts.map(item => (
                                    <div key={item.id} className="p-3 hover:bg-slate-50 rounded-lg flex gap-3 items-start transition-colors">
                                        <div className={`p-2 rounded-full mt-0.5 ${item.status === 'Lost' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                            <span className="material-symbols-outlined text-sm">
                                                {item.status === 'Lost' ? 'error' : 'build'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Status is marked as <span className="font-semibold">{item.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center flex flex-col items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">notifications_paused</span>
                                <p className="text-sm text-slate-500 font-medium">No new notifications</p>
                                <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
