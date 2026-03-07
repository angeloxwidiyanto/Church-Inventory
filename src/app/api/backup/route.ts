import db from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

export async function GET() {
    const backupPath = path.join(process.cwd(), 'data', 'backup.sqlite');

    try {
        // Perform safe SQLite backup
        await db.backup(backupPath);

        // Create a new zip
        const zip = new AdmZip();

        // Add the database to the root of the zip
        zip.addLocalFile(backupPath);

        // Add the uploads folder if it exists
        const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
        if (fs.existsSync(uploadsPath)) {
            // This adds the contents of the uploads folder to an 'uploads' directory inside the zip
            zip.addLocalFolder(uploadsPath, 'uploads');
        }

        // Generate the zip buffer
        const zipBuffer = zip.toBuffer();

        // Clean up the temporary backup file
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
        }

        return new NextResponse(zipBuffer as unknown as Blob, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="inventory-backup.zip"',
            },
        });
    } catch (error) {
        console.error('Backup failed:', error);
        return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
    }
}
