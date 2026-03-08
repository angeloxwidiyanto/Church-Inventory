import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { reopenDatabase } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Load the zip file
        const zip = new AdmZip(buffer);

        // 1. Extract and overwrite the database
        const dbEntry = zip.getEntry('backup.sqlite');
        if (!dbEntry) {
            return NextResponse.json({ error: 'Invalid backup format: backup.sqlite missing from zip' }, { status: 400 });
        }

        const dbPath = path.join(process.cwd(), 'data', 'inventory.sqlite');
        fs.writeFileSync(dbPath, dbEntry.getData());

        // Clear out WAL and SHM files if they exist to prevent corruption from older instance states
        const walPath = `${dbPath}-wal`;
        const shmPath = `${dbPath}-shm`;
        if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
        if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

        // Re-open the database connection so the server uses the restored data
        reopenDatabase();

        // 2. Extract the uploads folder
        const uploadsDest = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDest)) {
            fs.mkdirSync(uploadsDest, { recursive: true });
        }

        // Find all files that are inside the 'uploads' directory in the zip
        const uploadsEntries = zip.getEntries().filter(e => e.entryName.startsWith('uploads/'));
        for (const entry of uploadsEntries) {
            if (!entry.isDirectory) {
                // 'uploads/image.jpg' -> 'image.jpg'
                const relativePath = entry.entryName.substring('uploads/'.length);
                const fullDestPath = path.join(uploadsDest, relativePath);

                // Ensure parent directories exist
                const parentDir = path.dirname(fullDestPath);
                if (!fs.existsSync(parentDir)) {
                    fs.mkdirSync(parentDir, { recursive: true });
                }

                fs.writeFileSync(fullDestPath, entry.getData());
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Restore failed:', error);
        return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
    }
}

