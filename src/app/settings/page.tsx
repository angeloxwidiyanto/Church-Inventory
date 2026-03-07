'use client';

import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

export default function Settings() {
    const [isRestoring, setIsRestoring] = useState(false);

    const handleBackup = () => {
        window.location.href = '/api/backup';
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('Warning: This will completely replace your current inventory database. Proceed?')) {
            e.target.value = '';
            return;
        }

        setIsRestoring(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/restore', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('Database restored successfully! The page will now reload.');
                window.location.href = '/';
            } else {
                alert('Failed to restore database.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred during restore.');
        } finally {
            setIsRestoring(false);
            e.target.value = '';
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
                <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">Settings</h2>
                </header>

                <div className="p-8 max-w-4xl">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Data Management</h3>

                        <div className="space-y-8">
                            <div className="flex items-start justify-between pb-6 border-b border-slate-100">
                                <div>
                                    <h4 className="font-semibold text-slate-800">Backup Database</h4>
                                    <p className="text-sm text-slate-500 mt-1">Download a full `.zip` copy of your inventory data and local images.</p>
                                </div>
                                <button
                                    onClick={handleBackup}
                                    className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-base">download</span>
                                    Download Backup
                                </button>
                            </div>

                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-semibold text-slate-800">Restore Database</h4>
                                    <p className="text-sm text-slate-500 mt-1">Upload a previously saved backup file. <span className="text-red-500 font-medium">This will overwrite all current data.</span></p>
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        accept=".zip"
                                        onChange={handleRestore}
                                        className="hidden"
                                        id="restore-upload"
                                        disabled={isRestoring}
                                    />
                                    <label
                                        htmlFor="restore-upload"
                                        className={`px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isRestoring ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <span className="material-symbols-outlined text-base">upload</span>
                                        {isRestoring ? 'Restoring...' : 'Upload & Restore'}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
