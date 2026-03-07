import NotificationsDropdown from './NotificationsDropdown';
import { Item } from '@/lib/db';

export default function Header({ onAdd, items }: { onAdd: () => void; items: Item[] }) {
    return (
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50 outline-none"
                        placeholder="Search inventory by name, serial or location..."
                        type="text"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <NotificationsDropdown items={items} />
                <button
                    onClick={onAdd}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                    <span className="material-symbols-outlined text-sm">add</span> Add New Item
                </button>
            </div>
        </header>
    );
}
