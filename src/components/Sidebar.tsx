import Link from 'next/link';

export default function Sidebar() {
    return (
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0">
            <div className="p-6 flex items-center gap-3">
                <div className="bg-primary p-2 rounded-lg text-white flex items-center justify-center">
                    <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight">StockFlow</h1>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                <Link className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" href="/">
                    <span className="material-symbols-outlined">dashboard</span> Dashboard
                </Link>
                <Link className="flex items-center gap-3 px-3 py-2 text-primary bg-primary/10 rounded-lg font-semibold" href="/">
                    <span className="material-symbols-outlined">list_alt</span> Inventory Items
                </Link>
                <Link className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" href="/">
                    <span className="material-symbols-outlined">location_on</span> Locations
                </Link>
                <Link className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" href="/">
                    <span className="material-symbols-outlined">history</span> Activity Log
                </Link>
                <Link className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" href="/settings">
                    <span className="material-symbols-outlined">settings</span> Settings
                </Link>
            </nav>
            <div className="p-4 border-t border-slate-200">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                    <img
                        alt="User Profile"
                        className="w-10 h-10 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4hdNY63diIrp6ukvII1cu0I1cDDi9EzzaBHoUtX4q0o_K4jJP1L7pmbyuNOdxk09XyetdqKkCckPIQGlCF5TK1eWUEHEgamD6YSoVcs0iHrSKf0jwms_oOd45CkypmkoMLbssfq_Jjv-1ODqgFmHDE-T5vJKFUH6OnFTGol8SZpSSuTkRnNZ9PjGiSos78xyLVO_TD7gqgdRQLKvK1qajJdWsFpFSjf8gM_hoISFvbhXponTd3DD5sHZRK82uDQt9jQLHHOlY1VE"
                    />
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate">Alex Miller</p>
                        <p className="text-xs text-slate-500 truncate">Admin</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
