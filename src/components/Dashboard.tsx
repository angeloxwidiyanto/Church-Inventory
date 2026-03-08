'use client';

import { Item } from '@/lib/db';
import { useState, useEffect } from 'react';
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

    // Keep selectedItem / editingItem in sync when initialItems refreshes (e.g. after router.refresh())
    useEffect(() => {
        if (selectedItem) {
            const fresh = initialItems.find(i => i.id === selectedItem.id);
            if (fresh) setSelectedItem(fresh);
        }
        if (editingItem) {
            const fresh = initialItems.find(i => i.id === editingItem.id);
            if (fresh) setEditingItem(fresh);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialItems]);

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        category: true,
        location: true,
        condition: true,
        status: true,
        brand: false,
        tipe: false,
        jenis: false,
        serialNumber: false,
        assuranceCategory: false,
        ownership: false,
        unitValue: false,
        totalSumInsured: false,
        notes: false,
        images: false,
        receipt: false,
    });
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);
    const [showFilterSortDropdown, setShowFilterSortDropdown] = useState(false);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);

    const filteredItems = initialItems.filter(item => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            item.name.toLowerCase().includes(q) ||
            (item.serialNumber && item.serialNumber.toLowerCase().includes(q)) ||
            item.location.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            (item.brand && item.brand.toLowerCase().includes(q)) ||
            (item.tipe && item.tipe.toLowerCase().includes(q)) ||
            (item.jenis && item.jenis.toLowerCase().includes(q)) ||
            (item.assuranceCategory && item.assuranceCategory.toLowerCase().includes(q)) ||
            (item.ownership && item.ownership.toLowerCase().includes(q)) ||
            (item.notes && item.notes.toLowerCase().includes(q)) ||
            (item.unitValue && item.unitValue.toLowerCase().includes(q)) ||
            (item.totalSumInsured && item.totalSumInsured.toLowerCase().includes(q)) ||
            item.condition.toLowerCase().includes(q) ||
            item.status.toLowerCase().includes(q);

        if (!matchesSearch) return false;



        for (const [key, value] of Object.entries(filters)) {
            if (!value) continue;
            const itemValue = item[key as keyof Item];
            if (itemValue === null || itemValue === undefined) return false;

            if (typeof itemValue === 'string') {
                if (!itemValue.toLowerCase().includes(value.toLowerCase())) {
                    return false;
                }
            } else if (typeof itemValue === 'number') {
                if (itemValue.toString() !== value) {
                    return false;
                }
            }
        }

        return true;
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aVal = a[key as keyof Item];
        let bVal = b[key as keyof Item];

        if (key === 'unitValue' || key === 'totalSumInsured') {
            // Parse commas and numbers if they are string amounts, mostly they are stored as numbers or numeric strings
            aVal = typeof aVal === 'string' ? parseFloat(aVal.replace(/[^0-9.-]+/g, "")) : aVal;
            bVal = typeof bVal === 'string' ? parseFloat(bVal.replace(/[^0-9.-]+/g, "")) : bVal;
        }

        if (aVal === null || aVal === undefined || aVal === '') return direction === 'asc' ? 1 : -1;
        if (bVal === null || bVal === undefined || bVal === '') return direction === 'asc' ? -1 : 1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
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
        // Export only checked items if any are selected, otherwise export all filtered items
        const itemsToExport = selectedIds.length > 0
            ? filteredItems.filter(item => selectedIds.includes(item.id))
            : filteredItems;

        if (itemsToExport.length === 0) {
            alert('No items to export.');
            return;
        }

        const headers = ['Name'];
        if (visibleColumns.category) headers.push('Category');
        if (visibleColumns.location) headers.push('Location');
        if (visibleColumns.condition) headers.push('Condition');
        if (visibleColumns.status) headers.push('Status');
        if (visibleColumns.brand) headers.push('Brand');
        if (visibleColumns.tipe) headers.push('Tipe');
        if (visibleColumns.jenis) headers.push('Jenis');
        if (visibleColumns.serialNumber) headers.push('Serial Number');
        if (visibleColumns.assuranceCategory) headers.push('Assurance Category');
        if (visibleColumns.ownership) headers.push('Ownership');
        if (visibleColumns.unitValue) headers.push('Unit Value');
        if (visibleColumns.totalSumInsured) headers.push('Total Sum Insured');
        if (visibleColumns.notes) headers.push('Notes');

        const rows = itemsToExport.map(item => {
            const row = [`"${item.name.replace(/"/g, '""')}"`];
            if (visibleColumns.category) row.push(`"${item.category}"`);
            if (visibleColumns.location) row.push(`"${item.location}"`);
            if (visibleColumns.condition) row.push(`"${item.condition}"`);
            if (visibleColumns.status) row.push(`"${item.status}"`);
            if (visibleColumns.brand) row.push(`"${item.brand || ''}"`);
            if (visibleColumns.tipe) row.push(`"${item.tipe || ''}"`);
            if (visibleColumns.jenis) row.push(`"${item.jenis || ''}"`);
            if (visibleColumns.serialNumber) row.push(`"${item.serialNumber || ''}"`);
            if (visibleColumns.assuranceCategory) row.push(`"${item.assuranceCategory || ''}"`);
            if (visibleColumns.ownership) row.push(`"${item.ownership || ''}"`);
            if (visibleColumns.unitValue) row.push(`"${item.unitValue || ''}"`);
            if (visibleColumns.totalSumInsured) row.push(`"${item.totalSumInsured || ''}"`);
            if (visibleColumns.notes) row.push(`"${(item.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`);
            return row;
        });

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
                    <div className="flex items-center gap-3">
                        <NotificationsDropdown items={initialItems} />
                        <CSVUploadButton />
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
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowFilterSortDropdown(!showFilterSortDropdown)}
                                            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-base">filter_list</span> Filter & Sort
                                            {(Object.values(filters).some(Boolean) || sortConfig) && (
                                                <span className="w-2 h-2 rounded-full bg-primary absolute top-2 right-2"></span>
                                            )}
                                        </button>
                                        {showFilterSortDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowFilterSortDropdown(false)}></div>
                                                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-4 animate-in fade-in zoom-in duration-200 max-h-[60vh] overflow-y-auto">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="text-sm font-bold text-slate-800">Filter & Sort</div>
                                                        <button
                                                            onClick={() => { setFilters({}); setSortConfig(null); }}
                                                            className="text-xs text-primary hover:text-blue-700 font-medium"
                                                        >
                                                            Clear All
                                                        </button>
                                                    </div>

                                                    <div className="mb-6 space-y-4">
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sort By</div>
                                                        <div className="space-y-2">
                                                            <select
                                                                className="w-full text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary"
                                                                value={sortConfig?.key || ''}
                                                                onChange={(e) => setSortConfig(e.target.value ? { key: e.target.value, direction: sortConfig?.direction || 'asc' } : null)}
                                                            >
                                                                <option value="">None</option>
                                                                <option value="name">Name</option>
                                                                {Object.entries(visibleColumns).filter(([_, isVisible]) => isVisible).map(([key]) => {
                                                                    if (key === 'images' || key === 'receipt') return null;
                                                                    const label = [
                                                                        { label: 'Category', key: 'category' },
                                                                        { label: 'Location', key: 'location' },
                                                                        { label: 'Condition', key: 'condition' },
                                                                        { label: 'Status', key: 'status' },
                                                                        { label: 'Brand', key: 'brand' },
                                                                        { label: 'Tipe', key: 'tipe' },
                                                                        { label: 'Jenis', key: 'jenis' },
                                                                        { label: 'Serial Number', key: 'serialNumber' },
                                                                        { label: 'Assurance Category', key: 'assuranceCategory' },
                                                                        { label: 'Ownership', key: 'ownership' },
                                                                        { label: 'Unit Value', key: 'unitValue' },
                                                                        { label: 'Total Sum Insured', key: 'totalSumInsured' },
                                                                        { label: 'Notes', key: 'notes' },
                                                                    ].find(col => col.key === key)?.label || key;
                                                                    return <option key={key} value={key}>{label}</option>;
                                                                })}
                                                            </select>
                                                            {sortConfig?.key && (
                                                                <select
                                                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary"
                                                                    value={sortConfig.direction}
                                                                    onChange={(e) => setSortConfig({ ...sortConfig, direction: e.target.value as 'asc' | 'desc' })}
                                                                >
                                                                    <option value="asc">Ascending</option>
                                                                    <option value="desc">Descending</option>
                                                                </select>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filters</div>
                                                        {Object.entries(visibleColumns).filter(([_, isVisible]) => isVisible).map(([key]) => {
                                                            if (key === 'images' || key === 'receipt') return null;
                                                            const label = [
                                                                { label: 'Category', key: 'category' },
                                                                { label: 'Location', key: 'location' },
                                                                { label: 'Condition', key: 'condition' },
                                                                { label: 'Status', key: 'status' },
                                                                { label: 'Brand', key: 'brand' },
                                                                { label: 'Tipe', key: 'tipe' },
                                                                { label: 'Jenis', key: 'jenis' },
                                                                { label: 'Serial Number', key: 'serialNumber' },
                                                                { label: 'Assurance Category', key: 'assuranceCategory' },
                                                                { label: 'Ownership', key: 'ownership' },
                                                                { label: 'Unit Value', key: 'unitValue' },
                                                                { label: 'Total Sum Insured', key: 'totalSumInsured' },
                                                                { label: 'Notes', key: 'notes' },
                                                            ].find(col => col.key === key)?.label || key;

                                                            return (
                                                                <div key={key}>
                                                                    <label className="block text-xs text-slate-600 mb-1">{label}</label>
                                                                    <input
                                                                        type="text"
                                                                        value={filters[key] || ''}
                                                                        onChange={(e) => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
                                                                        placeholder={`Filter by ${label.toLowerCase()}...`}
                                                                        className="w-full text-sm py-1.5 px-3 border border-slate-200 rounded-md focus:ring-primary focus:border-primary placeholder-slate-400"
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                        {Object.values(visibleColumns).filter(v => v).length <= 2 && (
                                                            <div className="text-xs text-slate-500 italic">Enable more columns in "Show" to filter by them.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                                            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-base">view_column</span> Show
                                        </button>
                                        {showColumnDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowColumnDropdown(false)}></div>
                                                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-2 py-3 animate-in fade-in zoom-in duration-200">
                                                    <div className="text-xs font-bold text-slate-400 uppercase px-3 mb-2">Visible Columns</div>
                                                    <label className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-not-allowed">
                                                        <input type="checkbox" checked readOnly className="rounded text-primary focus:ring-primary border-slate-300 mr-3 cursor-not-allowed opacity-50" />
                                                        <span className="text-sm text-slate-700 opacity-50">Name (Required)</span>
                                                    </label>
                                                    {[
                                                        { label: 'Category', key: 'category' },
                                                        { label: 'Location', key: 'location' },
                                                        { label: 'Condition', key: 'condition' },
                                                        { label: 'Status', key: 'status' },
                                                        { label: 'Brand', key: 'brand' },
                                                        { label: 'Tipe', key: 'tipe' },
                                                        { label: 'Jenis', key: 'jenis' },
                                                        { label: 'Serial Number', key: 'serialNumber' },
                                                        { label: 'Assurance Category', key: 'assuranceCategory' },
                                                        { label: 'Ownership', key: 'ownership' },
                                                        { label: 'Unit Value', key: 'unitValue' },
                                                        { label: 'Total Sum Insured', key: 'totalSumInsured' },
                                                        { label: 'Notes', key: 'notes' },
                                                        { label: 'Images', key: 'images' },
                                                        { label: 'Receipt', key: 'receipt' },
                                                    ].map(({ label, key }) => (
                                                        <label key={key} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={visibleColumns[key] || false}
                                                                onChange={(e) => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                                                                className="rounded text-primary focus:ring-primary border-slate-300 mr-3 cursor-pointer"
                                                            />
                                                            <span className="text-sm text-slate-700">{label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleExport}
                                        className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-base">ios_share</span> Export
                                    </button>
                                </div>
                            </div>
                            <div className="border-b border-slate-200">
                                <div className="px-4 py-3 text-sm font-semibold text-primary border-b-2 border-primary inline-block">
                                    All Items
                                </div>
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
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                                            {visibleColumns.category && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Category</th>}
                                            {visibleColumns.location && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Location</th>}
                                            {visibleColumns.condition && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Condition</th>}
                                            {visibleColumns.status && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>}
                                            {visibleColumns.brand && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Brand</th>}
                                            {visibleColumns.tipe && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tipe</th>}
                                            {visibleColumns.jenis && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Jenis</th>}
                                            {visibleColumns.serialNumber && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Serial Number</th>}
                                            {visibleColumns.assuranceCategory && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Assurance</th>}
                                            {visibleColumns.ownership && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Ownership</th>}
                                            {visibleColumns.unitValue && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Nilai/Unit</th>}
                                            {visibleColumns.totalSumInsured && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Sum Insured</th>}
                                            {visibleColumns.notes && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap max-w-xs">Notes</th>}
                                            {visibleColumns.images && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Images</th>}
                                            {visibleColumns.receipt && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Resi</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={2 + Object.values(visibleColumns).filter(Boolean).length} className="p-8 text-center text-slate-500">
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
                                                    {visibleColumns.category && (
                                                        <td className="p-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(item.category)}`}>
                                                                {item.category === 'A/V Equipment' ? 'A/V' : item.category}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.location && <td className="p-4 text-sm text-slate-600 whitespace-nowrap truncate max-w-[150px]">{item.location}</td>}
                                                    {visibleColumns.condition && (
                                                        <td className="p-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getConditionColor(item.condition)}`}>
                                                                {item.condition}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.status && (
                                                        <td className="p-4 whitespace-nowrap">
                                                            {getStatusIndicator(item.status)}
                                                        </td>
                                                    )}
                                                    {visibleColumns.brand && <td className="p-4 text-sm text-slate-600 whitespace-nowrap truncate max-w-[150px]">{item.brand || '-'}</td>}
                                                    {visibleColumns.tipe && <td className="p-4 text-sm text-slate-600 whitespace-nowrap truncate max-w-[150px]">{item.tipe || '-'}</td>}
                                                    {visibleColumns.jenis && <td className="p-4 text-sm text-slate-600 whitespace-nowrap truncate max-w-[150px]">{item.jenis || '-'}</td>}
                                                    {visibleColumns.serialNumber && <td className="p-4 text-sm text-slate-600 whitespace-nowrap truncate max-w-[150px]">{item.serialNumber || '-'}</td>}
                                                    {visibleColumns.assuranceCategory && <td className="p-4 text-sm text-slate-600 whitespace-nowrap truncate max-w-[150px]">{item.assuranceCategory || '-'}</td>}
                                                    {visibleColumns.ownership && <td className="p-4 text-sm text-slate-600 whitespace-nowrap truncate max-w-[150px]">{item.ownership || '-'}</td>}
                                                    {visibleColumns.unitValue && <td className="p-4 text-sm text-slate-600 whitespace-nowrap truncate max-w-[150px]">{item.unitValue || '-'}</td>}
                                                    {visibleColumns.totalSumInsured && <td className="p-4 text-sm text-slate-600 whitespace-nowrap truncate max-w-[150px]">{item.totalSumInsured || '-'}</td>}
                                                    {visibleColumns.notes && <td className="p-4 text-sm text-slate-600 truncate max-w-[200px]">{item.notes || '-'}</td>}
                                                    {visibleColumns.images && (
                                                        <td className="p-4 whitespace-nowrap">
                                                            {item.images && JSON.parse(item.images as string).length > 0 ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setGalleryImages(JSON.parse(item.images as string));
                                                                        setIsGalleryOpen(true);
                                                                    }}
                                                                    className="flex items-center gap-1 hover:text-primary transition-colors hover:bg-primary/10 px-2 py-1 rounded"
                                                                >
                                                                    <img src={JSON.parse(item.images as string)[0]} alt="thumb" className="w-8 h-8 object-cover rounded shadow-sm border border-slate-200" />
                                                                    {JSON.parse(item.images as string).length > 1 && <span className="text-xs text-slate-500 font-medium">+{JSON.parse(item.images as string).length - 1}</span>}
                                                                </button>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">-</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    {visibleColumns.receipt && (
                                                        <td className="p-4 whitespace-nowrap">
                                                            {item.receipt ? (
                                                                item.receipt.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setGalleryImages([item.receipt as string]);
                                                                            setIsGalleryOpen(true);
                                                                        }}
                                                                        className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">image</span>
                                                                        <span className="text-xs font-semibold tracking-wide uppercase">Resi</span>
                                                                    </button>
                                                                ) : (
                                                                    <a
                                                                        href={item.receipt}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">description</span>
                                                                        <span className="text-xs font-semibold tracking-wide uppercase">Resi</span>
                                                                    </a>
                                                                )
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">-</span>
                                                            )}
                                                        </td>
                                                    )}
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
                                                const csvRows = [
                                                    ['ID', selectedItem.id],
                                                    ['Name', `"${selectedItem.name.replace(/"/g, '""')}"`],
                                                    ['Category', `"${selectedItem.category}"`],
                                                    ['Location', `"${selectedItem.location}"`],
                                                    ['Condition', `"${selectedItem.condition}"`],
                                                    ['Status', `"${selectedItem.status}"`],
                                                    ['Serial Number', `"${selectedItem.serialNumber || ''}"`],
                                                    ['Assurance Category', `"${selectedItem.assuranceCategory || ''}"`],
                                                    ['Brand', `"${selectedItem.brand || ''}"`],
                                                    ['Tipe', `"${selectedItem.tipe || ''}"`],
                                                    ['Jenis', `"${selectedItem.jenis || ''}"`],
                                                    ['Ownership', `"${selectedItem.ownership || ''}"`],
                                                    ['Unit Value', `"${selectedItem.unitValue || ''}"`],
                                                    ['Total Sum Insured', `"${selectedItem.totalSumInsured || ''}"`],
                                                    ['Notes', `"${(selectedItem.notes || '').replace(/"/g, '""')}"`]
                                                ];
                                                const csv = csvRows.map(row => row.join(',')).join('\n');
                                                const blob = new Blob([`Name,Value\n${csv}`], { type: 'text/csv;charset=utf-8;' });
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
                                {selectedItem.assuranceCategory && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Assurance Category</p>
                                        <p className="text-sm font-semibold text-slate-900">{selectedItem.assuranceCategory}</p>
                                    </div>
                                )}
                                {(selectedItem.brand || selectedItem.tipe || selectedItem.jenis) && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Details</p>
                                        <div className="text-sm text-slate-900 grid grid-cols-2 gap-2">
                                            {selectedItem.brand && <div><span className="text-slate-500 text-xs">Brand:</span> <br />{selectedItem.brand}</div>}
                                            {selectedItem.tipe && <div><span className="text-slate-500 text-xs">Tipe:</span> <br />{selectedItem.tipe}</div>}
                                            {selectedItem.jenis && <div><span className="text-slate-500 text-xs">Jenis:</span> <br />{selectedItem.jenis}</div>}
                                            {selectedItem.ownership && <div><span className="text-slate-500 text-xs">Ownership:</span> <br />{selectedItem.ownership}</div>}
                                        </div>
                                    </div>
                                )}
                                {(selectedItem.unitValue || selectedItem.totalSumInsured) && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Financials</p>
                                        <div className="text-sm text-slate-900 grid grid-cols-2 gap-2">
                                            {selectedItem.unitValue && <div><span className="text-slate-500 text-xs">Nilai/Unit:</span> <br />{selectedItem.unitValue}</div>}
                                            {selectedItem.totalSumInsured && <div><span className="text-slate-500 text-xs">Sum Insured:</span> <br />{selectedItem.totalSumInsured}</div>}
                                        </div>
                                    </div>
                                )}
                                {selectedItem.receipt && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Resi Pembelian</p>
                                        {selectedItem.receipt.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setGalleryImages([selectedItem.receipt as string]);
                                                    setIsGalleryOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">image</span> View Receipt Image
                                            </button>
                                        ) : (
                                            <a href={selectedItem.receipt} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
                                                <span className="material-symbols-outlined text-sm">receipt_long</span> View Receipt PDF
                                            </a>
                                        )}
                                    </div>
                                )}
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

            {isGalleryOpen && galleryImages.length > 0 && (
                <ImageGalleryModal
                    isOpen={isGalleryOpen}
                    onClose={() => setIsGalleryOpen(false)}
                    images={galleryImages}
                />
            )}
        </div>
    );
}
