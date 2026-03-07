'use client';

import { Item, JourneyEvent } from '@/lib/db';
import { useState } from 'react';
import { updateItem } from '@/actions/inventory';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function JourneyModal({
    isOpen,
    onClose,
    item,
}: {
    isOpen: boolean;
    onClose: () => void;
    item: Item;
}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [note, setNote] = useState('');
    const [eventType, setEventType] = useState<'Note' | 'Maintenance'>('Note');

    if (!isOpen) return null;

    const events: JourneyEvent[] = item.journey ? JSON.parse(item.journey) : [];
    // Sort events by date descending (newest first)
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;

        setIsSubmitting(true);
        try {
            const newEvent: JourneyEvent = {
                id: uuidv4(),
                date: new Date().toISOString(),
                type: eventType,
                description: note.trim()
            };

            const updatedJourney = [newEvent, ...events];

            await updateItem(item.id, {
                ...item,
                // Send it back as a JSON string
                journey: JSON.stringify(updatedJourney)
            });

            setNote('');
            router.refresh();
        } catch (error) {
            console.error('Failed to add journey event', error);
            alert('Failed to add event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'Created': return 'add_circle';
            case 'Moved': return 'local_shipping';
            case 'Status Change': return 'sync_alt';
            case 'Condition Change': return 'healing';
            case 'Maintenance': return 'build';
            case 'Note': return 'sticky_note_2';
            default: return 'history';
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'Created': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            case 'Moved': return 'text-blue-500 bg-blue-50 border-blue-100';
            case 'Status Change': return 'text-purple-500 bg-purple-50 border-purple-100';
            case 'Condition Change': return 'text-orange-500 bg-orange-50 border-orange-100';
            case 'Maintenance': return 'text-red-500 bg-red-50 border-red-100';
            case 'Note': return 'text-slate-500 bg-slate-50 border-slate-100';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 h-[80vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Item Journey</h3>
                        <p className="text-sm text-slate-500">
                            Tracking history and lifecycle for: <span className="font-semibold text-slate-700">{item.name}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all cursor-pointer">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 relative">
                    {/* Timeline Line */}
                    <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-200 z-0"></div>

                    <div className="space-y-6 relative z-10">
                        {events.length === 0 ? (
                            <div className="text-center text-slate-500 py-8 bg-white rounded-xl border border-slate-200">
                                No journey events recorded yet.
                            </div>
                        ) : (
                            events.map((event) => (
                                <div key={event.id} className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 shadow-sm bg-white ${getEventColor(event.type)}`}>
                                        <span className="material-symbols-outlined text-[20px]">{getEventIcon(event.type)}</span>
                                    </div>
                                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800">{event.type}</div>
                                            <div className="text-xs text-slate-400 font-medium">
                                                {new Date(event.date).toLocaleString()}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">{event.description}</p>

                                        {(event.previousValue || event.newValue) && (
                                            <div className="flex items-center gap-2 text-xs font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 mt-3 inline-flex">
                                                <span className="text-slate-500 line-through">{event.previousValue}</span>
                                                <span className="material-symbols-outlined text-[14px] text-slate-400">arrow_forward</span>
                                                <span className="text-primary">{event.newValue}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-white shrink-0">
                    <form onSubmit={handleAddEvent} className="flex gap-3">
                        <select
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value as any)}
                            className="w-36 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-medium text-sm text-slate-700 bg-slate-50"
                        >
                            <option value="Note">Note</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                        <input
                            type="text"
                            required
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add a new journey entry..."
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting || !note.trim()}
                            className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer flex gap-2 items-center text-sm shadow-sm shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">send</span> {isSubmitting ? 'Adding...' : 'Add'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
