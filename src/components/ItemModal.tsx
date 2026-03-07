'use client';

import { Item } from '@/lib/db';
import { useState, useEffect } from 'react';
import { createItem, updateItem, uploadImages } from '@/actions/inventory';
import { useRouter } from 'next/navigation';

export default function ItemModal({
    isOpen,
    onClose,
    item,
    onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    item: Item | null;
    onSuccess: () => void;
}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: item?.name || '',
        category: item?.category || 'A/V Equipment',
        location: item?.location || '',
        purchaseDate: item?.purchaseDate || '',
        condition: item?.condition || 'New',
        status: item?.status || 'In Use',
        serialNumber: item?.serialNumber || '',
        notes: item?.notes || ''
    });

    const [existingImages, setExistingImages] = useState<string[]>(
        item?.images ? JSON.parse(item.images) : []
    );
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    useEffect(() => {
        return () => {
            // Cleanup previews to avoid memory leaks
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...filesArray]);

            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const handleRemoveExisting = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveNew = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            const newUrls = [...prev];
            URL.revokeObjectURL(newUrls[index]);
            newUrls.splice(index, 1);
            return newUrls;
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let uploadedUrls: string[] = [];

            if (selectedFiles.length > 0) {
                const uploadFormData = new FormData();
                selectedFiles.forEach(file => uploadFormData.append('images', file));
                uploadedUrls = await uploadImages(uploadFormData);
            }

            const allImages = [...existingImages, ...uploadedUrls];

            const finalData = {
                ...formData,
                images: allImages.length > 0 ? JSON.stringify(allImages) : null,
                journey: item?.journey || null
            };

            if (item) {
                await updateItem(item.id, finalData);
            } else {
                await createItem(finalData);
            }
            onSuccess();
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to save item');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{item ? 'Edit Item' : 'Add New Inventory Item'}</h3>
                        <p className="text-sm text-slate-500">
                            {item ? 'Update details for this asset' : 'Enter details to track a new asset in the system'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all cursor-pointer">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-8 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Item Name *</label>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                    placeholder="e.g. 2024 Dell Monitor"
                                    type="text"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Serial Number</label>
                                <input
                                    name="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                    placeholder="e.g. SN-12345"
                                    type="text"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Category *</label>
                                <select
                                    required
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                >
                                    <option>A/V Equipment</option>
                                    <option>Office Furniture</option>
                                    <option>Consumable</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Location *</label>
                                <input
                                    required
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                    placeholder="e.g. Storage B"
                                    type="text"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Purchase Date</label>
                                <input
                                    name="purchaseDate"
                                    value={formData.purchaseDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                    type="date"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Condition *</label>
                                <select
                                    required
                                    name="condition"
                                    value={formData.condition}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                >
                                    <option>New</option>
                                    <option>Good</option>
                                    <option>Fair</option>
                                    <option>Broken</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Status *</label>
                                <select
                                    required
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                >
                                    <option>In Use</option>
                                    <option>Available</option>
                                    <option>Maintenance</option>
                                    <option>Low Stock</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                    placeholder="Additional details, warranty info..."
                                    rows={3}
                                ></textarea>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Item Images</label>
                                <div className="flex flex-col gap-3 mb-3">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2.5 file:px-4
                                            file:rounded-lg file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-primary/10 file:text-primary
                                            hover:file:bg-primary/20
                                            cursor-pointer transition-all"
                                    />
                                </div>
                                {(existingImages.length > 0 || previewUrls.length > 0) && (
                                    <div className="flex gap-3 overflow-x-auto py-2">
                                        {existingImages.map((url, i) => (
                                            <div key={`exist-${i}`} className="relative w-20 h-20 shrink-0 rounded-lg border border-slate-200 overflow-hidden group">
                                                <img src={url} alt={`Existing ${i + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExisting(i)}
                                                    className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                        {previewUrls.map((url, i) => (
                                            <div key={`new-${i}`} className="relative w-20 h-20 shrink-0 rounded-lg border border-blue-200 overflow-hidden group">
                                                <div className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-10 font-bold leading-none">NEW</div>
                                                <img src={url} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveNew(i)}
                                                    className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={isSubmitting}
                            type="submit"
                            className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-blue-700 rounded-lg shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : (item ? 'Save Changes' : 'Create Asset')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
