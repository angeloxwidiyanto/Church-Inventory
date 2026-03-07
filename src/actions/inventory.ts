'use server';

import db, { Item } from '@/lib/db';
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

    const stmt = db.prepare(`
    INSERT INTO items (name, serialNumber, category, location, purchaseDate, condition, status, notes, images, journey)
    VALUES (@name, @serialNumber, @category, @location, @purchaseDate, @condition, @status, @notes, @images, @journey)
  `);
    const info = stmt.run({
        ...data,
        images: data.images || null,
        journey: JSON.stringify([creationEvent]),
    });
    revalidatePath('/');
    return info.lastInsertRowid;
}

export async function updateItem(id: number, data: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>) {
    // Determine changes for the journey log
    const currentItem = await getItemById(id);
    if (!currentItem) return;

    const newEvents = [];
    const now = new Date().toISOString();

    if (data.location && currentItem.location !== data.location) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Moved', description: 'Location changed', previousValue: currentItem.location, newValue: data.location });
    }
    if (data.status && currentItem.status !== data.status) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Status Change', description: 'Status updated', previousValue: currentItem.status, newValue: data.status });
    }
    if (data.condition && currentItem.condition !== data.condition) {
        newEvents.push({ id: uuidv4(), date: now, type: 'Condition Change', description: 'Condition updated', previousValue: currentItem.condition, newValue: data.condition });
    }

    let journey = currentItem.journey ? JSON.parse(currentItem.journey) : [];

    // Check if there are newly supplied manual events in data.journey
    if (data.journey) {
        const parsedSupplied = typeof data.journey === 'string' ? JSON.parse(data.journey) : data.journey;
        // if user manually pushed a note, we just overwrite the journey since they pass back the full array
        journey = parsedSupplied;
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

export async function bulkInsertItems(items: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[]) {
    const insert = db.prepare(`
        INSERT INTO items (name, serialNumber, category, location, purchaseDate, condition, status, notes, images, journey)
        VALUES (@name, @serialNumber, @category, @location, @purchaseDate, @condition, @status, @notes, @images, @journey)
    `);

    const insertMany = db.transaction((itemsList) => {
        for (const i of itemsList) {
            insert.run({
                ...i,
                images: i.images || null,
                journey: i.journey || null,
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
