'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { existsSync, readdirSync, unlinkSync } from 'fs';
import path from 'path';

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
        const stmt = getDb().prepare('SELECT value FROM system_settings WHERE key = ?');
        const row = stmt.get(key) as { value: string } | undefined;
        if (row && row.value) {
            return JSON.parse(row.value) as T;
        }
    } catch (error) {
        console.error(`Error getting setting ${key}:`, error);
    }
    return defaultValue;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
    try {
        const stmt = getDb().prepare(`
      INSERT INTO system_settings (key, value) 
      VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
        stmt.run(key, JSON.stringify(value));
        revalidatePath('/settings');
        revalidatePath('/');
    } catch (error) {
        console.error(`Error setting setting ${key}:`, error);
        throw new Error('Failed to save setting');
    }
}

export async function resetAllData(): Promise<void> {
    try {
        // Delete all items
        getDb().prepare('DELETE FROM items').run();
        // Delete all settings (including user profile, categories, etc.)
        getDb().prepare('DELETE FROM system_settings').run();
        // Delete all activity logs
        try {
            getDb().prepare('DELETE FROM activity_logs').run();
        } catch {
            // ignore if table doesn't exist yet
        }

        // Clear uploaded images
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (existsSync(uploadsDir)) {
            const files = readdirSync(uploadsDir);
            for (const file of files) {
                try {
                    unlinkSync(path.join(uploadsDir, file));
                } catch {
                    // skip files that can't be deleted
                }
            }
        }

        // Revalidate the entire layout so all pages (incl locations, activity-log) show fresh data
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error('Error resetting data:', error);
        throw new Error('Failed to reset data');
    }
}

