'use server';

import db, { Item, JourneyEvent } from '@/lib/db';
import { revalidatePath } from 'next/cache';

import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function uploadImages(formData: FormData): Promise<string[]> {
    const files = formData.getAll('images') as File[];
    const uploadedPaths: string[] = [];

    for (const file of files) {
        if (!file.name || file.size === 0) continue;
        const buffer = await file.arrayBuffer();
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `${uuidv4()}.${extension}`;

        // Save to public/uploads
        const filepath = path.join(process.cwd(), 'public/uploads', filename);
        await writeFile(filepath, Buffer.from(buffer));

        uploadedPaths.push(`/uploads/${filename}`);
    }

    return uploadedPaths;
}

export async function uploadReceipt(formData: FormData): Promise<string | null> {
    const file = formData.get('receipt') as File | null;
    if (!file || !file.name || file.size === 0) return null;

    const buffer = await file.arrayBuffer();
    const extension = file.name.split('.').pop() || 'pdf';
    const filename = `receipt-${uuidv4()}.${extension}`;

    const filepath = path.join(process.cwd(), 'public/uploads', filename);
    await writeFile(filepath, Buffer.from(buffer));

    return `/uploads/${filename}`;
}

export async function getItems(): Promise<Item[]> {
    const stmt = db.prepare('SELECT * FROM items ORDER BY createdAt DESC');
    return stmt.all() as Item[];
}

export async function getItemById(id: number): Promise<Item | undefined> {
    const stmt = db.prepare('SELECT * FROM items WHERE id = ?');
    return stmt.get(id) as Item | undefined;
}

export async function createItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    const creationEvent = {
        id: uuidv4(),
        date: new Date().toISOString(),
        type: 'Created',
        description: 'Item added to inventory'
    };

    let journey = data.journey && data.journey !== '[]' && data.journey !== '' ? JSON.parse(data.journey) : [];
    journey = [creationEvent, ...journey];

    const stmt = db.prepare(`
    INSERT INTO items (
        name, serialNumber, category, location, purchaseDate, condition, status, notes, images, journey,
        assuranceCategory, brand, tipe, jenis, receipt, unitValue, totalSumInsured, ownership
    )
    VALUES (
        @name, @serialNumber, @category, @location, @purchaseDate, @condition, @status, @notes, @images, @journey,
        @assuranceCategory, @brand, @tipe, @jenis, @receipt, @unitValue, @totalSumInsured, @ownership
    )
  `);
    const info = stmt.run({
        ...data,
        images: data.images || null,
        journey: JSON.stringify(journey),
        assuranceCategory: data.assuranceCategory || null,
        brand: data.brand || null,
        tipe: data.tipe || null,
        jenis: data.jenis || null,
        receipt: data.receipt || null,
        unitValue: data.unitValue || null,
        totalSumInsured: data.totalSumInsured || null,
        ownership: data.ownership || null,
    });
    revalidatePath('/');
    return info.lastInsertRowid;
}

export async function updateItem(id: number, data: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>) {
    // Determine changes for the journey log
    const currentItem = await getItemById(id);
    if (!currentItem) return;

    const newEvents: { id: string; date: string; type: string; description: string; previousValue?: string; newValue?: string }[] = [];
    const now = new Date().toISOString();

    // Helper to safely compare (treat null/undefined/empty string as equal)
    const changed = (field: keyof Item) => {
        const oldVal = (currentItem[field] as string | null) || '';
        const newVal = (data[field as keyof typeof data] as string | null) || '';
        return oldVal !== newVal;
    };

    // --- Core operational changes ---
    if (data.location !== undefined && changed('location')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Moved', description: 'Location changed', previousValue: currentItem.location || '', newValue: data.location || '' });
    }
    if (data.status !== undefined && changed('status')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Status Change', description: 'Status updated', previousValue: currentItem.status || '', newValue: data.status || '' });
    }
    if (data.condition !== undefined && changed('condition')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Condition Change', description: 'Condition updated', previousValue: currentItem.condition || '', newValue: data.condition || '' });
    }

    // --- Detail / metadata changes ---
    if (data.name !== undefined && changed('name')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Detail Change', description: 'Name changed', previousValue: currentItem.name || '', newValue: data.name || '' });
    }
    if (data.category !== undefined && changed('category')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Detail Change', description: 'Category changed', previousValue: currentItem.category || '', newValue: data.category || '' });
    }
    if (data.assuranceCategory !== undefined && changed('assuranceCategory')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Detail Change', description: 'Assurance Category changed', previousValue: currentItem.assuranceCategory || '', newValue: data.assuranceCategory || '' });
    }
    if (data.brand !== undefined && changed('brand')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Detail Change', description: 'Brand changed', previousValue: currentItem.brand || '', newValue: data.brand || '' });
    }
    if (data.tipe !== undefined && changed('tipe')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Detail Change', description: 'Tipe changed', previousValue: currentItem.tipe || '', newValue: data.tipe || '' });
    }
    if (data.jenis !== undefined && changed('jenis')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Detail Change', description: 'Jenis changed', previousValue: currentItem.jenis || '', newValue: data.jenis || '' });
    }
    if (data.serialNumber !== undefined && changed('serialNumber')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Detail Change', description: 'Serial Number changed', previousValue: currentItem.serialNumber || '', newValue: data.serialNumber || '' });
    }
    if (data.ownership !== undefined && changed('ownership')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Detail Change', description: 'Ownership changed', previousValue: currentItem.ownership || '', newValue: data.ownership || '' });
    }
    if (data.notes !== undefined && changed('notes')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Note', description: 'Notes updated' });
    }

    // --- Financial changes ---
    if (data.unitValue !== undefined && changed('unitValue')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Financial Change', description: 'Unit Value changed', previousValue: currentItem.unitValue || '', newValue: data.unitValue || '' });
    }
    if (data.totalSumInsured !== undefined && changed('totalSumInsured')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Financial Change', description: 'Total Sum Insured changed', previousValue: currentItem.totalSumInsured || '', newValue: data.totalSumInsured || '' });
    }
    if (data.purchaseDate !== undefined && changed('purchaseDate')) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Financial Change', description: 'Purchase Date changed', previousValue: currentItem.purchaseDate || '', newValue: data.purchaseDate || '' });
    }

    let journey = currentItem.journey ? JSON.parse(currentItem.journey) : [];

    // Check if there are newly supplied manual events in data.journey
    if (data.journey) {
        const parsedSupplied = typeof data.journey === 'string' ? JSON.parse(data.journey) : data.journey;
        // Merge auto-detected events with user-supplied journey
        journey = [...newEvents, ...parsedSupplied];
    } else {
        journey = [...newEvents, ...journey];
    }

    const finalData = { ...data, journey: JSON.stringify(journey) };

    const updates = Object.keys(finalData).map(key => `${key} = @${key}`).join(', ');

    if (!updates) return;

    const stmt = db.prepare(`
    UPDATE items 
    SET ${updates}, updatedAt = CURRENT_TIMESTAMP
    WHERE id = @id
  `);

    stmt.run({ ...finalData, id });
    revalidatePath('/');
}

export async function deleteItem(id: number) {
    const stmt = db.prepare('DELETE FROM items WHERE id = ?');
    stmt.run(id);
    revalidatePath('/');
}

export async function getStats() {
    const totalItemsStmt = db.prepare('SELECT COUNT(*) as count FROM items');
    const locationsStmt = db.prepare('SELECT COUNT(DISTINCT location) as count FROM items');

    return {
        totalItems: (totalItemsStmt.get() as { count: number }).count,
        locations: (locationsStmt.get() as { count: number }).count,
    };
}

export async function getLocationsStats(): Promise<{ name: string; count: number }[]> {
    const stmt = db.prepare(`
        SELECT location as name, COUNT(*) as count 
        FROM items 
        GROUP BY location 
        ORDER BY count DESC
    `);
    return stmt.all() as { name: string; count: number }[];
}

export interface UnifiedActivityLog extends JourneyEvent {
    itemId: number;
    itemName: string;
}

export async function getAllActivityLogs(): Promise<UnifiedActivityLog[]> {
    const items = await getItems();
    const allLogs: UnifiedActivityLog[] = [];

    for (const item of items) {
        if (item.journey) {
            try {
                const journeyEvents = JSON.parse(item.journey) as import('@/lib/db').JourneyEvent[];
                for (const event of journeyEvents) {
                    allLogs.push({
                        ...event,
                        itemId: item.id,
                        itemName: item.name
                    });
                }
            } catch (e) {
                console.error(`Error parsing journey for item ${item.id}`, e);
            }
        }
    }

    // Sort chronologically, newest first
    return allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function bulkInsertItems(items: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[]) {
    const insert = db.prepare(`
        INSERT INTO items (
            name, serialNumber, category, location, purchaseDate, condition, status, notes, images, journey,
            assuranceCategory, brand, tipe, jenis, receipt, unitValue, totalSumInsured, ownership
        )
        VALUES (
            @name, @serialNumber, @category, @location, @purchaseDate, @condition, @status, @notes, @images, @journey,
            @assuranceCategory, @brand, @tipe, @jenis, @receipt, @unitValue, @totalSumInsured, @ownership
        )
    `);

    const insertMany = db.transaction((itemsList) => {
        for (const i of itemsList) {
            insert.run({
                ...i,
                images: i.images || null,
                journey: i.journey || null,
                assuranceCategory: i.assuranceCategory || null,
                brand: i.brand || null,
                tipe: i.tipe || null,
                jenis: i.jenis || null,
                receipt: i.receipt || null,
                unitValue: i.unitValue || null,
                totalSumInsured: i.totalSumInsured || null,
                ownership: i.ownership || null,
            });
        }
    });

    insertMany(items);
    revalidatePath('/');
}

export async function bulkDeleteItems(ids: number[]) {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM items WHERE id IN (${placeholders})`);
    stmt.run(...ids);
    revalidatePath('/');
}
