import Sidebar from '@/components/Sidebar';
import { getLocationsStats } from '@/actions/inventory';

export default async function LocationsPage() {
    const locations = await getLocationsStats();

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">Locations</h2>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-slate-900">Manage Inventory Locations</h3>
                            <p className="text-sm text-slate-500">Overview of all registered locations and item density.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {locations.length > 0 ? (
                                locations.map((loc) => (
                                    <div key={loc.name} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-start hover:shadow-md transition-shadow">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                                            <span className="material-symbols-outlined text-2xl">location_on</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-1">{loc.name}</h4>
                                        <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-auto">
                                            <span className="material-symbols-outlined text-sm">inventory_2</span>
                                            {loc.count} {loc.count === 1 ? 'Item' : 'Items'} assigned
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">where_to_vote</span>
                                    <p className="text-slate-500 font-medium">No locations found.</p>
                                    <p className="text-sm text-slate-400 mt-1">Add items to locations to see them appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
