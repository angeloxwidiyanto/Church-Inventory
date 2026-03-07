'use client';

import { Item } from '@/lib/db';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ItemModal from './ItemModal';
import CSVUploadButton from './CSVUploadButton';
import NotificationsDropdown from './NotificationsDropdown';
import { deleteItem, bulkDeleteItems } from '@/actions/inventory';
import { useRouter } from 'next/navigation';
import JourneyModal from './JourneyModal';
import ImageGalleryModal from './ImageGalleryModal';

export default function Dashboard({ initialItems }: { initialItems: Item[] }) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Items');

    const filteredItems = initialItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.serialNumber && item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            item.location.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (categoryFilter === 'All Items') return true;
        if (categoryFilter === 'Low Stock' && item.status === 'Low Stock') return true;
        if (categoryFilter === 'Low Stock') return false;
        return item.category === categoryFilter;
    });

    const handleAdd = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this item?')) {
            await deleteItem(id);
            if (selectedItem?.id === id) {
                setSelectedItem(null);
            }
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            router.refresh();
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Are you sure you want to delete ${selectedIds.length} items? This action cannot be undone.`)) {
            await bulkDeleteItems(selectedIds);
            if (selectedItem && selectedIds.includes(selectedItem.id)) {
                setSelectedItem(null);
            }
            setSelectedIds([]);
            router.refresh();
        }
    };

    const handleExport = () => {
        if (filteredItems.length === 0) {
            alert('No items to export.');
            return;
        }

        const headers = ['ID', 'Name', 'Category', 'Location', 'Purchase Date', 'Condition', 'Status', 'Serial Number', 'Notes', 'Created At'];
        const rows = filteredItems.map(item => [
            item.id,
            `"${item.name.replace(/"/g, '""')}"`,
            `"${item.category}"`,
            `"${item.location}"`,
            item.purchaseDate || '',
            `"${item.condition}"`,
            `"${item.status}"`,
            `"${item.serialNumber || ''}"`,
            `"${(item.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            item.createdAt
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    const getConditionColor = (cond: string) => {
        switch (cond) {
            case 'New': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Good': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Fair': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'Broken': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case 'In Use': return <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> In Use</span>;
            case 'Available': return <span className="flex items-center gap-1.5 text-sm font-medium text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Available</span>;
            case 'Low Stock': return <span className="flex items-center gap-1.5 text-sm font-medium text-red-600"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Low Stock</span>;
            case 'Maintenance': return <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Maintenance</span>;
            default: return <span>{status}</span>;
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'A/V Equipment': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Office Furniture': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'Consumable': return 'bg-orange-50 text-orange-700 border-orange-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const getIcon = (cat: string) => {
        switch (cat) {
            case 'A/V Equipment': return 'monitor';
            case 'Office Furniture': return 'chair';
            case 'Consumable': return 'inventory_2';
            default: return 'category';
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
                    <div className="flex-1 max-w-xl">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50 outline-none"
                                placeholder="Search inventory by name, serial or location..."
                                type="text"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationsDropdown items={initialItems} />
                        <button
                            onClick={handleAdd}
                            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm">add</span> Add New Item
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="p-8 pb-0 shrink-0">
                            <div className="flex items-end justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Inventory Items</h2>
                                    <p className="text-slate-500">Managing {initialItems.length} assets</p>
                                </div>
                                <div className="flex gap-2">
                                    {selectedIds.length > 0 && (
                                        <button
                                            onClick={handleBulkDelete}
                                            className="flex items-center gap-2 px-3 py-2 border border-red-200 bg-red-50 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 cursor-pointer transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-base">delete</span> Delete {selectedIds.length}
                                        </button>
                                    )}
                                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
                                        <span className="material-symbols-outlined text-base">filter_list</span> Filter
                                    </button>
                                    <button
                                        onClick={handleExport}
                                        className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-base">ios_share</span> Export
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-6 border-b border-slate-200 overflow-x-auto">
                                {['All Items', 'A/V Equipment', 'Office Furniture', 'Consumable', 'Low Stock'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${categoryFilter === cat
                                            ? 'text-primary border-b-2 border-primary'
                                            : cat === 'Low Stock'
                                                ? 'text-red-500 hover:text-red-700'
                                                : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-8 pt-4">
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4 w-10">
                                                <input
                                                    className="rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
                                                    type="checkbox"
                                                    checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedIds(filteredItems.map(item => item.id));
                                                        } else {
                                                            setSelectedIds([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Condition</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-slate-500">
                                                    No items found. Click &apos;Add New Item&apos; to create one.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredItems.map(item => (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => setSelectedItem(item)}
                                                    className={`transition-colors cursor-pointer group ${selectedItem?.id === item.id ? 'bg-primary/5' : 'hover:bg-primary/5'}`}
                                                >
                                                    <td className="p-4" onClick={e => e.stopPropagation()}>
                                                        <input
                                                            checked={selectedIds.includes(item.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedIds(prev => [...prev, item.id]);
                                                                } else {
                                                                    setSelectedIds(prev => prev.filter(id => id !== item.id));
                                                                }
                                                            }}
                                                            className="rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
                                                            type="checkbox"
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <span className="material-symbols-outlined">{getIcon(item.category)}</span>
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-slate-900">{item.name}</div>
                                                                <div className="text-xs text-slate-500">SN: {item.serialNumber || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(item.category)}`}>
                                                            {item.category === 'A/V Equipment' ? 'A/V' : item.category}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600">{item.location}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getConditionColor(item.condition)}`}>
                                                            {item.condition}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {getStatusIndicator(item.status)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {selectedItem && (
                        <aside className="w-80 border-l border-slate-200 bg-white flex flex-col p-6 overflow-y-auto shrink-0 animate-in slide-in-from-right duration-200">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-slate-900">Item Details</h3>
                                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="flex flex-col items-center mb-8">
                                <div
                                    className="w-full aspect-square bg-slate-50 border border-slate-200 rounded-xl shadow-sm mb-4 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer"
                                    onClick={() => {
                                        if (selectedItem.images && JSON.parse(selectedItem.images).length > 0) {
                                            setIsGalleryOpen(true);
                                        }
                                    }}
                                >
                                    {selectedItem.images ? (
                                        <>
                                            <img
                                                src={JSON.parse(selectedItem.images)[0] || 'https://placehold.co/400x400?text=No+Image'}
                                                alt={selectedItem.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {JSON.parse(selectedItem.images).length > 1 && (
                                                <button className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md font-semibold hover:bg-black/80 transition-colors pointer-events-none">
                                                    + {JSON.parse(selectedItem.images).length - 1} more
                                                </button>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-3xl drop-shadow-md">zoom_in</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400">
                                            <span className="material-symbols-outlined text-4xl mb-2">image</span>
                                            <span className="text-sm font-medium">No Image</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mb-4 uppercase tracking-widest font-bold">SN: {selectedItem.serialNumber || selectedItem.id}</p>
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="flex gap-2 w-full">
                                        <button
                                            onClick={handlePrint}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-base">print</span> Print
                                        </button>
                                        <button
                                            onClick={() => {
                                                const csv = `Name,Value\nID,${selectedItem.id}\nName,"${selectedItem.name.replace(/"/g, '""')}"\nCategory,"${selectedItem.category}"\nLocation,"${selectedItem.location}"\nCondition,"${selectedItem.condition}"\nStatus,"${selectedItem.status}"\nSerial Number,"${selectedItem.serialNumber || ''}"\nNotes,"${(selectedItem.notes || '').replace(/"/g, '""')}"`;
                                                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                                const url = URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `item_${selectedItem.id}_details.csv`);
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-base">download</span> Save
                                        </button>
                                    </div>
                                    <button
                                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
                                        onClick={() => setIsJourneyModalOpen(true)}
                                    >
                                        <span className="material-symbols-outlined text-base">route</span> Item Journey
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Item Name</p>
                                    <p className="text-sm font-semibold text-slate-900">{selectedItem.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Category</p>
                                    <p className="text-sm font-semibold text-slate-900">{selectedItem.category}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Location</p>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">location_on</span>
                                        <p className="text-sm font-semibold text-slate-900">{selectedItem.location}</p>
                                    </div>
                                </div>
                                {selectedItem.purchaseDate && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Purchase Date</p>
                                        <p className="text-sm font-semibold text-slate-900">{new Date(selectedItem.purchaseDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Condition</p>
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getConditionColor(selectedItem.condition)}`}>
                                        {selectedItem.condition.toUpperCase()}
                                    </span>
                                </div>
                                {selectedItem.notes && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Notes</p>
                                        <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-3">&quot;{selectedItem.notes}&quot;</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-200 flex gap-2">
                                <button
                                    onClick={() => handleEdit(selectedItem)}
                                    className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                    Edit Item
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedItem.id)}
                                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        </aside>
                    )}
                </div>
            </main>

            {isModalOpen && (
                <ItemModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    item={editingItem}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setSelectedItem(null); // Optional: reset selection to see newly added
                    }}
                />
            )}

            {isJourneyModalOpen && selectedItem && (
                <JourneyModal
                    isOpen={isJourneyModalOpen}
                    onClose={() => setIsJourneyModalOpen(false)}
                    item={selectedItem}
                />
            )}

            {isGalleryOpen && selectedItem && selectedItem.images && (
                <ImageGalleryModal
                    isOpen={isGalleryOpen}
                    onClose={() => setIsGalleryOpen(false)}
                    images={JSON.parse(selectedItem.images)}
                />
            )}
        </div>
    );
}
