'use client';

import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { getSetting, setSetting, resetAllData } from '@/actions/settings';

export default function Settings() {
    const [isRestoring, setIsRestoring] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Dynamic Settings State
    const [categories, setCategories] = useState<string[]>([]);
    const [assuranceCategories, setAssuranceCategories] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [newAssuranceCategory, setNewAssuranceCategory] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [isSavingAssurance, setIsSavingAssurance] = useState(false);
    const [isSavingLocation, setIsSavingLocation] = useState(false);

    const [profileName, setProfileName] = useState('');
    const [profileRole, setProfileRole] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [reminderDays, setReminderDays] = useState(0);
    const [lastBackupDate, setLastBackupDate] = useState('');

    useEffect(() => {
        getSetting<string[]>('categories', ['A/V Equipment', 'Office Furniture', 'Consumable']).then(setCategories);
        getSetting<string[]>('assurance_categories', ['EEI', 'Mov Alat musik', 'Mov', 'Other']).then(setAssuranceCategories);
        getSetting<string[]>('locations', ['Main Hall', 'Storage A', 'Office', 'Youth Room', 'Kitchen']).then(setLocations);
        getSetting<{ name: string; role: string }>('user_profile', { name: '', role: '' }).then(p => {
            setProfileName(p.name);
            setProfileRole(p.role);
        });
        getSetting<number>('backup_reminder_days', 0).then(setReminderDays);
        getSetting<string>('last_backup_date', '').then(setLastBackupDate);
    }, []);

    const handleSaveProfile = async () => {
        if (!profileName.trim()) return;
        setIsSavingProfile(true);
        await setSetting('user_profile', { name: profileName.trim(), role: profileRole.trim() || 'User' });
        setIsSavingProfile(false);
        window.location.reload();
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        setIsSavingCategory(true);
        const updated = [...categories, newCategory.trim()];
        setCategories(updated);
        setNewCategory('');
        await setSetting('categories', updated);
        setIsSavingCategory(false);
    };

    const handleRemoveCategory = async (tag: string) => {
        setIsSavingCategory(true);
        const updated = categories.filter(c => c !== tag);
        setCategories(updated);
        await setSetting('categories', updated);
        setIsSavingCategory(false);
    };


    const handleAddAssuranceCategory = async () => {
        if (!newAssuranceCategory.trim()) return;
        setIsSavingAssurance(true);
        const updated = [...assuranceCategories, newAssuranceCategory.trim()];
        setAssuranceCategories(updated);
        setNewAssuranceCategory('');
        await setSetting('assurance_categories', updated);
        setIsSavingAssurance(false);
    };

    const handleRemoveAssuranceCategory = async (tag: string) => {
        setIsSavingAssurance(true);
        const updated = assuranceCategories.filter(c => c !== tag);
        setAssuranceCategories(updated);
        await setSetting('assurance_categories', updated);
        setIsSavingAssurance(false);
    };

    const handleAddLocation = async () => {
        if (!newLocation.trim()) return;
        setIsSavingLocation(true);
        const updated = [...locations, newLocation.trim()];
        setLocations(updated);
        setNewLocation('');
        await setSetting('locations', updated);
        setIsSavingLocation(false);
    };

    const handleRemoveLocation = async (tag: string) => {
        setIsSavingLocation(true);
        const updated = locations.filter(c => c !== tag);
        setLocations(updated);
        await setSetting('locations', updated);
        setIsSavingLocation(false);
    };

    const handleBackup = async () => {
        await setSetting('last_backup_date', new Date().toISOString());
        setLastBackupDate(new Date().toISOString());
        window.location.href = '/api/backup';
    };

    const handleReminderChange = async (days: number) => {
        setReminderDays(days);
        await setSetting('backup_reminder_days', days);
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

                <div className="p-8 max-w-4xl space-y-6">
                    {/* Profile */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Profile</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name</label>
                                    <input
                                        type="text"
                                        value={profileName}
                                        onChange={e => setProfileName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                                    <input
                                        type="text"
                                        value={profileRole}
                                        onChange={e => setProfileRole(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                        placeholder="e.g. Admin, Staff"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile || !profileName.trim()}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </div>
                    </div>

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

                            <div className="flex items-start justify-between pb-6 border-b border-slate-100">
                                <div>
                                    <h4 className="font-semibold text-slate-800">Backup Reminder</h4>
                                    <p className="text-sm text-slate-500 mt-1">Get a popup reminder to backup your data regularly.</p>
                                    {lastBackupDate && (
                                        <p className="text-xs text-slate-400 mt-2">
                                            Last backup: {new Date(lastBackupDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                                <select
                                    value={reminderDays}
                                    onChange={(e) => handleReminderChange(Number(e.target.value))}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                                >
                                    <option value={0}>Disabled</option>
                                    <option value={3}>Every 3 days</option>
                                    <option value={7}>Every 7 days</option>
                                    <option value={14}>Every 14 days</option>
                                    <option value={30}>Every 30 days</option>
                                    <option value={60}>Every 60 days</option>
                                    <option value={90}>Every 90 days</option>
                                </select>
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

                    {/* Dynamic Categories Board */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 mt-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">category</span>
                            Dynamic Categories Setup
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Inventory Categories */}
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-2">Inventory Categories</h4>
                                <p className="text-sm text-slate-500 mb-4">Manage options for the Category dropdown.</p>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                        placeholder="Add new category..."
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                                        disabled={isSavingCategory}
                                    />
                                    <button
                                        onClick={handleAddCategory}
                                        disabled={!newCategory.trim() || isSavingCategory}
                                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-full">
                                            {cat}
                                            <button
                                                onClick={() => handleRemoveCategory(cat)}
                                                disabled={isSavingCategory}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                            </button>
                                        </span>
                                    ))}
                                    {categories.length === 0 && <span className="text-sm text-slate-400 italic">No categories defined.</span>}
                                </div>
                            </div>

                            {/* Assurance Categories */}
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-2">Assurance Categories</h4>
                                <p className="text-sm text-slate-500 mb-4">Manage options for the Assurance dropdown.</p>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={newAssuranceCategory}
                                        onChange={(e) => setNewAssuranceCategory(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddAssuranceCategory()}
                                        placeholder="Add assurance category..."
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                                        disabled={isSavingAssurance}
                                    />
                                    <button
                                        onClick={handleAddAssuranceCategory}
                                        disabled={!newAssuranceCategory.trim() || isSavingAssurance}
                                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {assuranceCategories.map((cat, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-full">
                                            {cat}
                                            <button
                                                onClick={() => handleRemoveAssuranceCategory(cat)}
                                                disabled={isSavingAssurance}
                                                className="text-blue-400 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                            </button>
                                        </span>
                                    ))}
                                    {assuranceCategories.length === 0 && <span className="text-sm text-slate-400 italic">No assurance categories defined.</span>}
                                </div>
                            </div>

                            {/* Locations */}
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-2">Locations</h4>
                                <p className="text-sm text-slate-500 mb-4">Manage options for the Locations dropdown.</p>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={newLocation}
                                        onChange={(e) => setNewLocation(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                                        placeholder="Add new location..."
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                                        disabled={isSavingLocation}
                                    />
                                    <button
                                        onClick={handleAddLocation}
                                        disabled={!newLocation.trim() || isSavingLocation}
                                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {locations.map((loc, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-full">
                                            {loc}
                                            <button
                                                onClick={() => handleRemoveLocation(loc)}
                                                disabled={isSavingLocation}
                                                className="text-emerald-400 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                            </button>
                                        </span>
                                    ))}
                                    {locations.length === 0 && <span className="text-sm text-slate-400 italic">No locations defined.</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 mt-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">laptop_mac</span>
                            How to Migrate to a New Computer (Mac or Windows)
                        </h3>

                        <div className="text-sm text-slate-600 space-y-4">
                            <p>To move this application and your data to a entirely new computer, follow these simple steps:</p>

                            <ol className="list-decimal list-outside ml-4 space-y-3">
                                <li>
                                    <span className="font-semibold text-slate-800">Download a Backup:</span> First, use the Backup Database button above to save your <code>inventory-backup.zip</code> file safely (e.g., to a USB drive or cloud storage).
                                </li>
                                <li>
                                    <span className="font-semibold text-slate-800">Install Node.js:</span> On your new computer, download and install <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Node.js</a>.
                                </li>
                                <li>
                                    <span className="font-semibold text-slate-800">Copy the App:</span> Copy this entire <code>Church Inventory</code> project folder to the new computer.
                                </li>
                                <li>
                                    <span className="font-semibold text-slate-800">Start the App:</span> Open a Terminal (Mac) or Command Prompt (Windows) inside the folder. Run the following commands:
                                    <div className="bg-slate-900 text-slate-200 p-3 rounded-lg mt-2 font-mono text-xs">
                                        npm install<br />
                                        npm run dev
                                    </div>
                                </li>
                                <li>
                                    <span className="font-semibold text-slate-800">Restore your Data:</span> Open the app in your browser at <code>http://localhost:3000</code>, come back to this Settings page, and upload your <code>inventory-backup.zip</code> file using the Restore feature above.
                                </li>
                            </ol>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4 flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
                                <p className="text-sm text-blue-800">
                                    The restore process is <span className="font-bold">cross-platform compatible</span>. You can seamlessly backup on a Mac and restore on Windows, or vice versa. The application automatically handles the file system differences for your uploaded images.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white border-2 border-red-200 rounded-xl shadow-sm p-8">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-red-600">warning</span>
                            <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-6">These actions are irreversible. Please proceed with extreme caution.</p>

                        <div className="flex items-start justify-between p-4 bg-red-50 border border-red-100 rounded-lg">
                            <div>
                                <h4 className="font-semibold text-red-800">Delete All Data & Start Fresh</h4>
                                <p className="text-sm text-red-600/80 mt-1">Permanently delete all inventory items, settings, uploaded images, and user profile. This cannot be undone.</p>
                            </div>
                            <button
                                onClick={async () => {
                                    const firstConfirm = confirm('⚠️ Are you sure you want to delete ALL data? This will remove every item, setting, and uploaded image. This action CANNOT be undone.');
                                    if (!firstConfirm) return;

                                    const typed = prompt('To confirm, please type DELETE in all caps:');
                                    if (typed !== 'DELETE') {
                                        alert('Reset cancelled. The text did not match.');
                                        return;
                                    }

                                    setIsResetting(true);
                                    try {
                                        await resetAllData();
                                        alert('All data has been deleted. The app will now reload.');
                                        window.location.href = '/';
                                    } catch (error) {
                                        console.error(error);
                                        alert('Failed to reset data. Please try again.');
                                        setIsResetting(false);
                                    }
                                }}
                                disabled={isResetting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">delete_forever</span>
                                {isResetting ? 'Deleting...' : 'Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
