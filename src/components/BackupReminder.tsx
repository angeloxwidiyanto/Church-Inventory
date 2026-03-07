'use client';

import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '@/actions/settings';

export default function BackupReminder() {
    const [show, setShow] = useState(false);
    const [daysSince, setDaysSince] = useState(0);
    const [intervalDays, setIntervalDays] = useState(0);

    useEffect(() => {
        const check = async () => {
            const interval = await getSetting<number>('backup_reminder_days', 0);
            if (interval <= 0) return; // reminder is disabled

            const lastBackup = await getSetting<string>('last_backup_date', '');
            if (!lastBackup) {
                // Never backed up — show immediately
                setDaysSince(-1);
                setIntervalDays(interval);
                setShow(true);
                return;
            }

            const lastDate = new Date(lastBackup);
            const now = new Date();
            const diffMs = now.getTime() - lastDate.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays >= interval) {
                setDaysSince(diffDays);
                setIntervalDays(interval);
                setShow(true);
            }
        };

        check();
    }, []);

    const handleBackupNow = async () => {
        await setSetting('last_backup_date', new Date().toISOString());
        window.location.href = '/api/backup';
        // The download starts — close the popup
        setTimeout(() => setShow(false), 500);
    };

    const handleDismiss = () => {
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-amber-600 text-2xl">backup</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Backup Reminder</h3>
                        <p className="text-sm text-amber-700 mt-1">
                            {daysSince === -1
                                ? "You haven't created a backup yet."
                                : `It's been ${daysSince} day${daysSince !== 1 ? 's' : ''} since your last backup.`
                            }
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-slate-600 mb-1">
                        Your reminder is set to every <span className="font-semibold text-slate-800">{intervalDays} day{intervalDays !== 1 ? 's' : ''}</span>.
                    </p>
                    <p className="text-sm text-slate-500">
                        Regular backups protect your inventory data against accidental loss.
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={handleDismiss}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        Remind Me Later
                    </button>
                    <button
                        onClick={handleBackupNow}
                        className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Backup Now
                    </button>
                </div>
            </div>
        </div>
    );
}
