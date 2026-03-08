'use client';

import { Item } from '@/lib/db';
import { useState, useEffect } from 'react';
import { createItem, updateItem, uploadImages, uploadReceipt } from '@/actions/inventory';
import { getSetting } from '@/actions/settings';
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
        notes: item?.notes || '',
        assuranceCategory: item?.assuranceCategory || '',
        brand: item?.brand || '',
        tipe: item?.tipe || '',
        jenis: item?.jenis || '',
        unitValue: item?.unitValue || '',
        totalSumInsured: item?.totalSumInsured || '',
        ownership: item?.ownership || ''
    });

    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [existingReceipt, setExistingReceipt] = useState<string | null>(item?.receipt || null);

    const TABS = [
        { id: 'basic', label: 'Basic Info' },
        { id: 'specs', label: 'Specifications' },
        { id: 'financial', label: 'Financial' },
        { id: 'media', label: 'Media & Notes' }
    ] as const;
    type TabId = typeof TABS[number]['id'];
    const [activeTab, setActiveTab] = useState<TabId>('basic');

    const [existingImages, setExistingImages] = useState<string[]>(
        item?.images ? JSON.parse(item.images) : []
    );
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    // Dynamic Settings State
    const [availableCategories, setAvailableCategories] = useState<string[]>(['A/V Equipment', 'Office Furniture', 'Consumable']);
    const [availableAssurance, setAvailableAssurance] = useState<string[]>(['EEI', 'Mov Alat musik', 'Mov', 'Other']);
    const [availableLocations, setAvailableLocations] = useState<string[]>(['Main Hall', 'Storage A', 'Office', 'Youth Room', 'Kitchen']);

    useEffect(() => {
        if (isOpen) {
            getSetting<string[]>('categories', ['A/V Equipment', 'Office Furniture', 'Consumable']).then(setAvailableCategories);
            getSetting<string[]>('assurance_categories', ['EEI', 'Mov Alat musik', 'Mov', 'Other']).then(setAvailableAssurance);
            getSetting<string[]>('locations', ['Main Hall', 'Storage A', 'Office', 'Youth Room', 'Kitchen']).then(locs => {
                setAvailableLocations(locs);
                if (!item?.location && locs.length > 0) {
                    setFormData(prev => ({ ...prev, location: locs[0] }));
                }
            });
        }
    }, [isOpen, item?.location]);

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

            let receiptUrl = existingReceipt;
            if (receiptFile) {
                const receiptFormData = new FormData();
                receiptFormData.append('receipt', receiptFile);
                const uploadedReceipt = await uploadReceipt(receiptFormData);
                if (uploadedReceipt) {
                    receiptUrl = uploadedReceipt;
                }
            }

            const allImages = [...existingImages, ...uploadedUrls];

            const finalData = {
                ...formData,
                images: allImages.length > 0 ? JSON.stringify(allImages) : null,
                journey: item?.journey || null,
                receipt: receiptUrl
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

    const handleNextTab = () => {
        const currentIndex = TABS.findIndex(t => t.id === activeTab);
        if (currentIndex < TABS.length - 1) setActiveTab(TABS[currentIndex + 1].id);
    };

    const handlePrevTab = () => {
        const currentIndex = TABS.findIndex(t => t.id === activeTab);
        if (currentIndex > 0) setActiveTab(TABS[currentIndex - 1].id);
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

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-8 space-y-6 flex-1 overflow-y-auto max-h-[60vh]">
                        {activeTab === 'basic' && (
                            <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Category *</label>
                                    <select
                                        required
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                    >
                                        <option value="" disabled>Select a category</option>
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                                    <select
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-slate-800"
                                        required
                                    >
                                        <option value="" disabled>Select Location...</option>
                                        {availableLocations.map((cat, idx) => (
                                            <option key={idx} value={cat}>{cat}</option>
                                        ))}
                                    </select>
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
                            </div>
                        )}

                        {activeTab === 'specs' && (
                            <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Brand</label>
                                    <input
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        placeholder="e.g. Yamaha"
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipe</label>
                                    <input
                                        name="tipe"
                                        value={formData.tipe}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        placeholder="e.g. Clavinova CLP-735"
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Jenis</label>
                                    <input
                                        name="jenis"
                                        value={formData.jenis}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        placeholder="e.g. Alat Musik"
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
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Ownership</label>
                                    <input
                                        name="ownership"
                                        value={formData.ownership}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        placeholder="e.g. Church Property"
                                        type="text"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'financial' && (
                            <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Purchase Date</label>
                                    <input
                                        value={formData.purchaseDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        type="date"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Assurance Category</label>
                                    <select
                                        name="assuranceCategory"
                                        value={formData.assuranceCategory}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                    >
                                        <option value="">-- None --</option>
                                        {availableAssurance.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nilai / unit</label>
                                    <input
                                        name="unitValue"
                                        value={formData.unitValue}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        placeholder="e.g. Rp 25.000.000"
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Total Sum Insured</label>
                                    <input
                                        name="totalSumInsured"
                                        value={formData.totalSumInsured}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        placeholder="e.g. Rp 25.000.000"
                                        type="text"
                                    />
                                </div>
                                <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Resi Pembelian (Receipt PDF/Image)</label>
                                    {existingReceipt && !receiptFile && (
                                        <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                            <a href={existingReceipt} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">description</span>
                                                <span className="font-medium">Current Receipt Attached</span>
                                            </a>
                                            <button type="button" onClick={() => setExistingReceipt(null)} className="text-sm text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors">Remove</button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2.5 file:px-4
                                            file:rounded-lg file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-slate-100 file:text-slate-700
                                            hover:file:bg-slate-200
                                            cursor-pointer transition-all border border-slate-200 rounded-lg
                                        "
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'media' && (
                            <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                                                cursor-pointer transition-all
                                                border border-slate-200 rounded-lg p-1"
                                        />
                                    </div>
                                    {(existingImages.length > 0 || previewUrls.length > 0) && (
                                        <div className="flex gap-3 overflow-x-auto py-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                            {existingImages.map((url, i) => (
                                                <div key={`exist-${i}`} className="relative w-24 h-24 shrink-0 rounded-lg border shadow-sm border-slate-200 overflow-hidden group bg-white">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={url} alt={`Existing ${i + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveExisting(i)}
                                                        className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                        title="Remove Image"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            ))}
                                            {previewUrls.map((url, i) => (
                                                <div key={`new-${i}`} className="relative w-24 h-24 shrink-0 rounded-lg border-2 shadow-sm border-blue-400 overflow-hidden group bg-white">
                                                    <div className="absolute top-1 right-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm z-10 font-bold tracking-wider leading-none">NEW</div>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={url} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveNew(i)}
                                                        className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                                                        title="Remove Added Image"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Additional Notes</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none min-h-[120px]"
                                        placeholder="Warranty info, historical context, specific instructions..."
                                    ></textarea>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex gap-2">
                            {activeTab !== 'basic' && (
                                <button
                                    type="button"
                                    onClick={handlePrevTab}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span> Back
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>

                            {activeTab !== 'media' ? (
                                <button
                                    type="button"
                                    onClick={handleNextTab}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                                >
                                    Next <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                            ) : (
                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-blue-700 rounded-lg shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Saving...</>
                                    ) : (
                                        <><span className="material-symbols-outlined text-[18px]">{item ? 'save' : 'add_circle'}</span> {item ? 'Save Changes' : 'Create Asset'}</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
