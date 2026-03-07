'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { bulkInsertItems } from '@/actions/inventory';
import { useRouter } from 'next/navigation';

interface ParsedItem {
    name: string;
    serialNumber: string;
    category: string;
    location: string;
    purchaseDate: string;
    condition: string;
    status: string;
    notes: string;
    assuranceCategory: string;
    brand: string;
    tipe: string;
    jenis: string;
    receipt: string;
    unitValue: string;
    totalSumInsured: string;
    ownership: string;
    images: null;
    journey: null;
}

const CSV_HEADERS = [
    'Name', 'Serial Number', 'Category', 'Location', 'Purchase Date',
    'Condition', 'Status', 'Assurance Category', 'Brand', 'Tipe',
    'Jenis', 'Unit Value', 'Total Sum Insured', 'Ownership', 'Notes'
];

export default function CSVUploadButton() {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        const sampleRow = [
            'Sample Item', 'SN-001', 'A/V Equipment', 'Main Hall', '2024-01-15',
            'New', 'Available', 'EEI', 'Samsung', 'LED TV', 'Electronics',
            '5000000', '10000000', 'Church', 'A sample note'
        ];
        const csvContent = [CSV_HEADERS.join(','), sampleRow.map(v => `"${v}"`).join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'inventory_import_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const itemsData: ParsedItem[] = results.data.map((row: any) => ({
                        name: row.name || row.Name || row.Item || 'Unknown Item',
                        serialNumber: row.serialNumber || row['Serial Number'] || row.SN || '',
                        category: row.category || row.Category || 'Consumable',
                        location: row.location || row.Location || 'Storage',
                        purchaseDate: row.purchaseDate || row['Purchase Date'] || '',
                        condition: row.condition || row.Condition || 'Good',
                        status: row.status || row.Status || 'Available',
                        notes: row.notes || row.Notes || '',
                        assuranceCategory: row.assuranceCategory || row['Assurance Category'] || '',
                        brand: row.brand || row.Brand || '',
                        tipe: row.tipe || row.Tipe || '',
                        jenis: row.jenis || row.Jenis || '',
                        receipt: row.receipt || row.Receipt || '',
                        unitValue: row.unitValue || row['Unit Value'] || '',
                        totalSumInsured: row.totalSumInsured || row['Total Sum Insured'] || '',
                        ownership: row.ownership || row.Ownership || '',
                        images: null,
                        journey: null,
                    }));

                    if (itemsData.length === 0) {
                        alert('No valid rows found in CSV.');
                        return;
                    }

                    setParsedItems(itemsData);
                    setShowPreview(true);
                } catch (error) {
                    console.error('Failed to parse CSV:', error);
                    alert('Failed to parse CSV. Ensure your format matches the expected schema.');
                }
            },
            error: (error) => {
                console.error('CSV Parse Error:', error);
                alert('Failed to parse CSV file.');
            }
        });

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleConfirmInsert = async () => {
        setIsUploading(true);
        try {
            await bulkInsertItems(parsedItems);
            alert(`Successfully imported ${parsedItems.length} items.`);
            setShowPreview(false);
            setParsedItems([]);
            router.refresh();
        } catch (error) {
            console.error('Failed to import CSV:', error);
            alert('Failed to import items. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveRow = (index: number) => {
        setParsedItems(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <>
            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <div className="flex items-center gap-2">
                <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                    title="Download CSV template"
                >
                    <span className="material-symbols-outlined text-base">description</span> CSV Template
                </button>
                <button
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Bulk Import CSV
                </button>
            </div>

            {/* Preview / Confirmation Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Confirm CSV Import</h3>
                                <p className="text-sm text-slate-500">
                                    Review {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''} before importing. Remove any unwanted rows.
                                </p>
                            </div>
                            <button onClick={() => { setShowPreview(false); setParsedItems([]); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            {parsedItems.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">inbox</span>
                                    All rows have been removed. Nothing to import.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse min-w-[900px]">
                                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                            <tr>
                                                <th className="text-left px-3 py-2.5 font-semibold text-slate-600">#</th>
                                                <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Name</th>
                                                <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Category</th>
                                                <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Location</th>
                                                <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Condition</th>
                                                <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Status</th>
                                                <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Brand</th>
                                                <th className="text-left px-3 py-2.5 font-semibold text-slate-600">S/N</th>
                                                <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Unit Value</th>
                                                <th className="text-center px-3 py-2.5 font-semibold text-slate-600">Remove</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {parsedItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-3 py-2 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                    <td className="px-3 py-2 font-semibold text-slate-900 max-w-[180px] truncate">{item.name}</td>
                                                    <td className="px-3 py-2 text-slate-600">{item.category}</td>
                                                    <td className="px-3 py-2 text-slate-600">{item.location}</td>
                                                    <td className="px-3 py-2 text-slate-600">{item.condition}</td>
                                                    <td className="px-3 py-2 text-slate-600">{item.status}</td>
                                                    <td className="px-3 py-2 text-slate-600">{item.brand || '—'}</td>
                                                    <td className="px-3 py-2 text-slate-600 font-mono text-xs">{item.serialNumber || '—'}</td>
                                                    <td className="px-3 py-2 text-slate-600">{item.unitValue || '—'}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            onClick={() => handleRemoveRow(idx)}
                                                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                            title="Remove this row"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                <span className="font-semibold text-slate-700">{parsedItems.length}</span> item{parsedItems.length !== 1 ? 's' : ''} ready to import
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowPreview(false); setParsedItems([]); }}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmInsert}
                                    disabled={isUploading || parsedItems.length === 0}
                                    className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    {isUploading ? 'Importing...' : `Confirm & Import ${parsedItems.length} Items`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
