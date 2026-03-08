import Sidebar from '@/components/Sidebar';
import { getAllActivityLogs } from '@/actions/inventory';
import Link from 'next/link';

function getEventIcon(type: string) {
    switch (type) {
        case 'Created': return 'add_circle';
        case 'Moved': return 'local_shipping';
        case 'Status Change': return 'sync_alt';
        case 'Condition Change': return 'healing';
        case 'Maintenance': return 'build';
        case 'Note': return 'sticky_note_2';
        case 'Detail Change': return 'edit_document';
        case 'Financial Change': return 'payments';
        case 'Deleted': return 'delete';
        case 'Inspection': return 'fact_check';
        case 'Repair': return 'home_repair_service';
        case 'Lent Out': return 'output';
        case 'Returned': return 'keyboard_return';
        default: return 'history';
    }
}

function getEventColor(type: string) {
    switch (type) {
        case 'Created': return 'text-green-600 bg-green-50 border-green-200';
        case 'Moved': return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'Status Change': return 'text-purple-600 bg-purple-50 border-purple-200';
        case 'Condition Change': return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'Maintenance': return 'text-red-600 bg-red-50 border-red-200';
        case 'Note': return 'text-slate-600 bg-slate-50 border-slate-200';
        case 'Detail Change': return 'text-teal-600 bg-teal-50 border-teal-200';
        case 'Financial Change': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        case 'Deleted': return 'text-red-600 bg-red-50 border-red-200';
        case 'Inspection': return 'text-amber-600 bg-amber-50 border-amber-200';
        case 'Repair': return 'text-pink-600 bg-pink-50 border-pink-200';
        case 'Lent Out': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
        case 'Returned': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
        default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
}

export default async function ActivityLogPage() {
    const logs = await getAllActivityLogs();

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">Activity Log</h2>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Global Event History</h3>
                                <p className="text-sm text-slate-500">Comprehensive timeline of all changes across your inventory.</p>
                            </div>
                            <div className="text-sm font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                                {logs.length} Events Logged
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                            {logs.length > 0 ? (
                                <ul className="divide-y divide-slate-100">
                                    {logs.map((log, index) => (
                                        <li key={`${log.id}-${index}`} className="p-6 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center border ${getEventColor(log.type)}`}>
                                                    <span className="material-symbols-outlined text-lg">{getEventIcon(log.type)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-4 mb-1">
                                                        <h4 className="text-sm font-bold text-slate-900 truncate">
                                                            {log.type} <span className="font-normal text-slate-500 mx-1">on</span> <Link href={`/?search=${encodeURIComponent(log.itemName)}`} className="text-primary hover:underline">{log.itemName}</Link>
                                                        </h4>
                                                        <span className="text-xs font-medium text-slate-500 shrink-0">
                                                            {new Date(log.date).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-700">{log.description}</p>

                                                    {(log.previousValue || log.newValue) && (
                                                        <div className="mt-3 flex items-center gap-2 text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-100 w-fit">
                                                            {log.previousValue && (
                                                                <span className="text-slate-500 font-medium line-through decoration-slate-400">{log.previousValue}</span>
                                                            )}
                                                            {log.previousValue && log.newValue && (
                                                                <span className="material-symbols-outlined text-slate-400 text-sm">arrow_forward</span>
                                                            )}
                                                            {log.newValue && (
                                                                <span className="text-slate-900 font-semibold">{log.newValue}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-12 text-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">history</span>
                                    <p className="text-slate-500 font-medium">No activity recorded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
