'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
        const stmt = db.prepare('SELECT value FROM system_settings WHERE key = ?');
        const row = stmt.get(key) as { value: string } | undefined;
        if (row && row.value) {
            return JSON.parse(row.value) as T;
        }
    } catch (error) {
        console.error(`Error getting setting ${key}:`, error);
    }
    return defaultValue;
}

export async function setSetting(key: string, value: any): Promise<void> {
    try {
        const stmt = db.prepare(`
      INSERT INTO system_settings (key, value) 
      VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
        stmt.run(key, JSON.stringify(value));
        revalidatePath('/settings');
        revalidatePath('/'); // Revalidate main page so ItemModal gets fresh data
    } catch (error) {
        console.error(`Error setting setting ${key}:`, error);
        throw new Error('Failed to save setting');
    }
}
