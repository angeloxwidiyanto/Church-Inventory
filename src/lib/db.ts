import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const dbPath = path.join(dataDir, 'inventory.sqlite');

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Define schema
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    serialNumber TEXT,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    purchaseDate TEXT,
    condition TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe migrations for new columns
try { db.exec('ALTER TABLE items ADD COLUMN images TEXT;'); } catch (e) { /* ignore */ }
try { db.exec('ALTER TABLE items ADD COLUMN journey TEXT;'); } catch (e) { /* ignore */ }

export interface Item {
  id: number;
  name: string;
  serialNumber: string | null;
  category: string;
  location: string;
  purchaseDate: string | null;
  condition: string;
  status: string;
  notes: string | null;
  images: string | null;
  journey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyEvent {
  id: string; // unique ID for the event, e.g. timestamp or uuid
  date: string; // ISO timestamp
  type: 'Created' | 'Moved' | 'Status Change' | 'Condition Change' | 'Maintenance' | 'Note';
  description: string;
  previousValue?: string;
  newValue?: string;
}

export default db;
