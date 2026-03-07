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

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Initialize default settings if they don't exist
try {
  const insertSetting = db.prepare('INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)');
  insertSetting.run('categories', JSON.stringify(['A/V Equipment', 'Office Furniture', 'Consumable']));
  insertSetting.run('assurance_categories', JSON.stringify(['EEI', 'Mov Alat musik', 'Mov', 'Other']));
  insertSetting.run('locations', JSON.stringify(['Main Hall', 'Storage A', 'Office', 'Youth Room', 'Kitchen']));
} catch (e) {
  console.error("Failed to initialize default settings", e);
}


// Safe migrations for new columns
try { db.exec('ALTER TABLE items ADD COLUMN images TEXT;'); } catch (e) { /* ignore */ }
try { db.exec('ALTER TABLE items ADD COLUMN journey TEXT;'); } catch (e) { /* ignore */ }
try { db.exec('ALTER TABLE items ADD COLUMN assuranceCategory TEXT;'); } catch (e) { /* ignore */ }
try { db.exec('ALTER TABLE items ADD COLUMN brand TEXT;'); } catch (e) { /* ignore */ }
try { db.exec('ALTER TABLE items ADD COLUMN tipe TEXT;'); } catch (e) { /* ignore */ }
try { db.exec('ALTER TABLE items ADD COLUMN jenis TEXT;'); } catch (e) { /* ignore */ }
try { db.exec('ALTER TABLE items ADD COLUMN receipt TEXT;'); } catch (e) { /* ignore */ }
try { db.exec('ALTER TABLE items ADD COLUMN unitValue TEXT;'); } catch (e) { /* ignore */ }
try { db.exec('ALTER TABLE items ADD COLUMN totalSumInsured TEXT;'); } catch (e) { /* ignore */ }
try { db.exec('ALTER TABLE items ADD COLUMN ownership TEXT;'); } catch (e) { /* ignore */ }

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
  assuranceCategory: string | null;
  brand: string | null;
  tipe: string | null;
  jenis: string | null;
  receipt: string | null; // Path to PDF/Image
  unitValue: string | null;
  totalSumInsured: string | null;
  ownership: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyEvent {
  id: string; // unique ID for the event, e.g. timestamp or uuid
  date: string; // ISO timestamp
  type: 'Created' | 'Moved' | 'Status Change' | 'Condition Change' | 'Maintenance' | 'Note' | 'Detail Change' | 'Financial Change';
  description: string;
  previousValue?: string;
  newValue?: string;
}

export default db;
