'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { bulkInsertItems } from '@/actions/inventory';
import { useRouter } from 'next/navigation';

export default function CSVUploadButton() {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    // Map CSV rows to our Item schema. We check for variations in typical headers.
                    const itemsData = results.data.map((row: any) => ({
                        name: row.name || row.Name || row.Item || 'Unknown Item',
                        serialNumber: row.serialNumber || row['Serial Number'] || row.SN || '',
                        category: row.category || row.Category || 'Consumable',
                        location: row.location || row.Location || 'Storage',
                        purchaseDate: row.purchaseDate || row['Purchase Date'] || '',
                        condition: row.condition || row.Condition || 'Good',
                        status: row.status || row.Status || 'Available',
                        notes: row.notes || row.Notes || '',
                        images: null,
                        journey: null,
                    }));

                    if (itemsData.length === 0) {
                        alert('No valid rows found in CSV.');
                        return;
                    }

                    await bulkInsertItems(itemsData);
                    alert(`Successfully imported ${itemsData.length} items.`);
                    router.refresh();
                } catch (error) {
                    console.error('Failed to import CSV:', error);
                    alert('Failed to import CSV. Ensure your format matches the expected schema.');
                } finally {
                    setIsUploading(false);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            },
            error: (error) => {
                console.error('CSV Parse Error:', error);
                alert('Failed to parse CSV file.');
                setIsUploading(false);
            }
        });
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
            <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                {isUploading ? 'Importing...' : 'Bulk Import CSV'}
            </button>
        </>
    );
}
