'use client';

import { Item, JourneyEvent } from '@/lib/db';
import { useState, useMemo, useRef } from 'react';
import { updateItem, uploadImages } from '@/actions/inventory';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

// --- Manual event types the user can choose from ---
const MANUAL_EVENT_TYPES = ['Note', 'Maintenance', 'Inspection', 'Repair', 'Lent Out', 'Returned'] as const;

// --- All event types for filtering ---
const ALL_EVENT_TYPES = [
    'Created', 'Moved', 'Status Change', 'Condition Change',
    'Detail Change', 'Financial Change',
    ...MANUAL_EVENT_TYPES,
] as const;

// --- Icons ---
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
        case 'Inspection': return 'fact_check';
        case 'Repair': return 'home_repair_service';
        case 'Lent Out': return 'output';
        case 'Returned': return 'keyboard_return';
        default: return 'history';
    }
}

// --- Colors ---
function getEventColor(type: string) {
    switch (type) {
        case 'Created': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
        case 'Moved': return 'text-blue-500 bg-blue-50 border-blue-100';
        case 'Status Change': return 'text-purple-500 bg-purple-50 border-purple-100';
        case 'Condition Change': return 'text-orange-500 bg-orange-50 border-orange-100';
        case 'Maintenance': return 'text-red-500 bg-red-50 border-red-100';
        case 'Note': return 'text-slate-500 bg-slate-50 border-slate-100';
        case 'Detail Change': return 'text-teal-500 bg-teal-50 border-teal-100';
        case 'Financial Change': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        case 'Inspection': return 'text-amber-500 bg-amber-50 border-amber-100';
        case 'Repair': return 'text-pink-500 bg-pink-50 border-pink-100';
        case 'Lent Out': return 'text-indigo-500 bg-indigo-50 border-indigo-100';
        case 'Returned': return 'text-cyan-500 bg-cyan-50 border-cyan-100';
        default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
}

// --- Check if an event type is manually added (deletable / editable) ---
const isManualEvent = (type: string) =>
    (MANUAL_EVENT_TYPES as readonly string[]).includes(type);

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [note, setNote] = useState('');
    const [eventType, setEventType] = useState<string>('Note');
    const [customDate, setCustomDate] = useState('');
    const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

    // Filter state
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const events: JourneyEvent[] = useMemo(() => {
        const parsed: JourneyEvent[] = item.journey ? JSON.parse(item.journey) : [];
        return parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [item.journey]);

    // --- Filtered events ---
    const filteredEvents = events.filter(event => {
        if (activeFilter && event.type !== activeFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                event.type.toLowerCase().includes(q) ||
                event.description.toLowerCase().includes(q) ||
                (event.previousValue && event.previousValue.toLowerCase().includes(q)) ||
                (event.newValue && event.newValue.toLowerCase().includes(q))
            );
        }
        return true;
    });

    // --- Summary stats ---
    const stats = useMemo(() => {
        const locations = new Set<string>();
        let maintenanceCount = 0;
        let lastMoved: Date | null = null;

        for (const e of events) {
            if (e.type === 'Moved' && e.newValue) {
                locations.add(e.newValue);
                const d = new Date(e.date);
                if (!lastMoved || d > lastMoved) lastMoved = d;
            }
            if (e.type === 'Moved' && e.previousValue) locations.add(e.previousValue);
            if (e.type === 'Maintenance' || e.type === 'Repair') maintenanceCount++;
        }
        return { locationCount: locations.size, maintenanceCount, lastMoved, totalEvents: events.length };
    }, [events]);

    // --- Event type counts for filter chips ---
    const typeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const e of events) {
            counts[e.type] = (counts[e.type] || 0) + 1;
        }
        return counts;
    }, [events]);

    const presentTypes = ALL_EVENT_TYPES.filter(t => typeCounts[t]);

    // Validation
    const [validationError, setValidationError] = useState('');

    // --- Add event ---
    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError('');

        // --- Comprehensive validation ---
        const trimmed = note.trim();
        if (!trimmed) {
            setValidationError('Please enter a description for this entry.');
            return;
        }
        if (trimmed.length < 3) {
            setValidationError('Description must be at least 3 characters.');
            return;
        }
        if (trimmed.length > 500) {
            setValidationError('Description must be 500 characters or less.');
            return;
        }
        if (customDate) {
            const selectedDate = new Date(customDate);
            if (isNaN(selectedDate.getTime())) {
                setValidationError('Invalid date. Please select a valid date.');
                return;
            }
            if (selectedDate > new Date()) {
                setValidationError('Date cannot be in the future.');
                return;
            }
        }
        if (attachmentFiles.length > 5) {
            setValidationError('Maximum 5 attachments per entry.');
            return;
        }
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        for (const file of attachmentFiles) {
            if (file.size > MAX_FILE_SIZE) {
                setValidationError(`File "${file.name}" exceeds 10MB limit.`);
                return;
            }
            if (!file.type.startsWith('image/')) {
                setValidationError(`File "${file.name}" is not a valid image.`);
                return;
            }
        }
        if (!MANUAL_EVENT_TYPES.includes(eventType as typeof MANUAL_EVENT_TYPES[number])) {
            setValidationError('Invalid event type selected.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Upload attachments if any
            let uploadedPaths: string[] = [];
            if (attachmentFiles.length > 0) {
                const formData = new FormData();
                attachmentFiles.forEach(file => formData.append('images', file));
                uploadedPaths = await uploadImages(formData);
            }

            const newEvent: JourneyEvent = {
                id: uuidv4(),
                date: customDate ? new Date(customDate).toISOString() : new Date().toISOString(),
                type: eventType as JourneyEvent['type'],
                description: note.trim(),
                ...(uploadedPaths.length > 0 ? { attachments: uploadedPaths } : {}),
            };

            const updatedJourney = [newEvent, ...events];

            await updateItem(item.id, {
                journey: JSON.stringify(updatedJourney),
            });

            setNote('');
            setCustomDate('');
            setAttachmentFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            router.refresh();
        } catch (error) {
            console.error('Failed to add journey event', error);
            alert('Failed to add event');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Delete event ---
    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('Delete this journey entry?')) return;
        setIsSubmitting(true);
        try {
            const updatedJourney = events.filter(e => e.id !== eventId);
            await updateItem(item.id, { journey: JSON.stringify(updatedJourney) });
            router.refresh();
        } catch (error) {
            console.error('Failed to delete event', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Edit event ---
    const handleSaveEdit = async (eventId: string) => {
        if (!editText.trim()) return;
        setIsSubmitting(true);
        try {
            const updatedJourney = events.map(e =>
                e.id === eventId ? { ...e, description: editText.trim() } : e
            );
            await updateItem(item.id, { journey: JSON.stringify(updatedJourney) });
            setEditingId(null);
            setEditText('');
            router.refresh();
        } catch (error) {
            console.error('Failed to edit event', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Export journey as CSV ---
    const handleExport = () => {
        if (events.length === 0) return;
        const headers = ['Date', 'Type', 'Description', 'Previous Value', 'New Value'];
        const rows = events.map(e => [
            `"${new Date(e.date).toLocaleString()}"`,
            `"${e.type}"`,
            `"${e.description.replace(/"/g, '""')}"`,
            `"${e.previousValue || ''}"`,
            `"${e.newValue || ''}"`,
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `journey_${item.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Helper: relative time ---
    const relativeTime = (date: Date) => {
        const diff = Date.now() - date.getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'Today';
        if (days === 1) return '1 day ago';
        if (days < 30) return `${days} days ago`;
        if (days < 365) return `${Math.floor(days / 30)} months ago`;
        return `${Math.floor(days / 365)} years ago`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 h-[85vh]">
                {/* --- Header --- */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Item Journey</h3>
                        <p className="text-sm text-slate-500">
                            Tracking history and lifecycle for: <span className="font-semibold text-slate-700">{item.name}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {events.length > 0 && (
                            <button
                                onClick={handleExport}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
                                title="Export as CSV"
                            >
                                <span className="material-symbols-outlined text-xl">download</span>
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all cursor-pointer">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* --- Summary Stats --- */}
                {stats.totalEvents > 0 && (
                    <div className="px-6 py-3 bg-white border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-primary">timeline</span>
                                <span><b className="text-slate-700">{stats.totalEvents}</b> events</span>
                            </div>
                            {stats.locationCount > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-blue-500">location_on</span>
                                    <span><b className="text-slate-700">{stats.locationCount}</b> locations visited</span>
                                </div>
                            )}
                            {stats.maintenanceCount > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-red-500">build</span>
                                    <span><b className="text-slate-700">{stats.maintenanceCount}</b> maintenance/repairs</span>
                                </div>
                            )}
                            {stats.lastMoved && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-emerald-500">schedule</span>
                                    <span>Last moved <b className="text-slate-700">{relativeTime(stats.lastMoved)}</b></span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Filter Chips & Search --- */}
                {events.length > 0 && (
                    <div className="px-6 py-3 bg-white border-b border-slate-100 shrink-0 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search events..."
                                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-slate-50/50"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => setActiveFilter(null)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${!activeFilter ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            >
                                All ({events.length})
                            </button>
                            {presentTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setActiveFilter(activeFilter === type ? null : type)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${activeFilter === type ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {type} ({typeCounts[type]})
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Timeline --- */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 relative">
                    {/* Timeline Line */}
                    <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-200 z-0"></div>

                    <div className="space-y-6 relative z-10">
                        {filteredEvents.length === 0 ? (
                            <div className="text-center text-slate-500 py-8 bg-white rounded-xl border border-slate-200">
                                {events.length === 0 ? 'No journey events recorded yet.' : 'No events match your filter.'}
                            </div>
                        ) : (
                            filteredEvents.map((event) => (
                                <div key={event.id} className="flex gap-4 group/card">
                                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 shadow-sm bg-white ${getEventColor(event.type)}`}>
                                        <span className="material-symbols-outlined text-[20px]">{getEventIcon(event.type)}</span>
                                    </div>
                                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800">{event.type}</div>
                                            <div className="flex items-center gap-1">
                                                <div className="text-xs text-slate-400 font-medium">
                                                    {new Date(event.date).toLocaleString()}
                                                </div>
                                                {isManualEvent(event.type) && (
                                                    <div className="opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                                                        <button
                                                            onClick={() => { setEditingId(event.id); setEditText(event.description); }}
                                                            className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                                            title="Edit"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEvent(event.id)}
                                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description (editable for manual events) */}
                                        {editingId === event.id ? (
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={editText}
                                                    onChange={e => setEditText(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                                    autoFocus
                                                    onKeyDown={e => { if (e.key === 'Escape') { setEditingId(null); setEditText(''); } }}
                                                />
                                                <button
                                                    onClick={() => handleSaveEdit(event.id)}
                                                    disabled={isSubmitting}
                                                    className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => { setEditingId(null); setEditText(''); }}
                                                    className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                                        )}

                                        {/* Value change pill */}
                                        {(event.previousValue || event.newValue) && (
                                            <div className="flex items-center gap-2 text-xs font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 w-fit">
                                                <span className="text-slate-500 line-through">{event.previousValue}</span>
                                                <span className="material-symbols-outlined text-[14px] text-slate-400">arrow_forward</span>
                                                <span className="text-primary">{event.newValue}</span>
                                            </div>
                                        )}

                                        {/* Attachments */}
                                        {event.attachments && event.attachments.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {event.attachments.map((src, i) => (
                                                    <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={src} alt={`Attachment ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition-all" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- Add Event Form --- */}
                <div className="p-6 border-t border-slate-200 bg-white shrink-0 space-y-3">
                    {/* Validation Error */}
                    {validationError && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                            <span className="material-symbols-outlined text-base">error</span>
                            {validationError}
                        </div>
                    )}
                    <form onSubmit={handleAddEvent} className="space-y-3">
                        {/* Row 1: Type + Description */}
                        <div className="flex gap-3">
                            <select
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                                className="w-36 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-medium text-sm text-slate-700 bg-slate-50"
                            >
                                {MANUAL_EVENT_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => { setNote(e.target.value); setValidationError(''); }}
                                placeholder="Add a new journey entry..."
                                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm ${validationError && !note.trim() ? 'border-red-300 bg-red-50/30' : 'border-slate-300'}`}
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !note.trim()}
                                className="px-5 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer flex gap-2 items-center text-sm shadow-sm shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-[18px]">send</span> {isSubmitting ? '...' : 'Add'}
                            </button>
                        </div>

                        {/* Row 2: Date picker + Attach files */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                                <input
                                    type="datetime-local"
                                    value={customDate}
                                    onChange={e => setCustomDate(e.target.value)}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-slate-50/50"
                                />
                                {customDate && (
                                    <button type="button" onClick={() => setCustomDate('')} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
                                        Clear
                                    </button>
                                )}
                                {!customDate && <span className="text-xs text-slate-400">Now (default)</span>}
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={e => setAttachmentFiles(Array.from(e.target.files || []))}
                                    className="hidden"
                                    id="journey-attach"
                                />
                                <label
                                    htmlFor="journey-attach"
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">attach_file</span>
                                    {attachmentFiles.length > 0 ? `${attachmentFiles.length} file(s)` : 'Attach'}
                                </label>
                                {attachmentFiles.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => { setAttachmentFiles([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                        className="text-xs text-slate-400 hover:text-red-500 cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
