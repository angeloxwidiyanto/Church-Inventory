import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const dbPath = path.join(dataDir, 'inventory.sqlite');

function initializeDatabase(database: InstanceType<typeof Database>) {
  // Enable WAL mode for better performance
  database.pragma('journal_mode = WAL');

  // Define schema
  database.exec(`
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

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      itemId INTEGER,
      itemName TEXT NOT NULL,
      previousValue TEXT,
      newValue TEXT
    );
  `);

  // Initialize default settings if they don't exist
  try {
    const insertSetting = database.prepare('INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)');
    insertSetting.run('categories', JSON.stringify(['A/V Equipment', 'Office Furniture', 'Consumable']));
    insertSetting.run('assurance_categories', JSON.stringify(['EEI', 'Mov Alat musik', 'Mov', 'Other']));
    insertSetting.run('locations', JSON.stringify(['Main Hall', 'Storage A', 'Office', 'Youth Room', 'Kitchen']));
  } catch (e) {
    console.error("Failed to initialize default settings", e);
  }

  // Safe migrations for new columns
  try { database.exec('ALTER TABLE items ADD COLUMN images TEXT;'); } catch { /* ignore */ }
  try { database.exec('ALTER TABLE items ADD COLUMN journey TEXT;'); } catch { /* ignore */ }
  try { database.exec('ALTER TABLE items ADD COLUMN assuranceCategory TEXT;'); } catch { /* ignore */ }
  try { database.exec('ALTER TABLE items ADD COLUMN brand TEXT;'); } catch { /* ignore */ }
  try { database.exec('ALTER TABLE items ADD COLUMN tipe TEXT;'); } catch { /* ignore */ }
  try { database.exec('ALTER TABLE items ADD COLUMN jenis TEXT;'); } catch { /* ignore */ }
  try { database.exec('ALTER TABLE items ADD COLUMN receipt TEXT;'); } catch { /* ignore */ }
  try { database.exec('ALTER TABLE items ADD COLUMN unitValue TEXT;'); } catch { /* ignore */ }
  try { database.exec('ALTER TABLE items ADD COLUMN totalSumInsured TEXT;'); } catch { /* ignore */ }
  try { database.exec('ALTER TABLE items ADD COLUMN ownership TEXT;'); } catch { /* ignore */ }

  // Safe migration for activity_logs table
  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        itemId INTEGER,
        itemName TEXT NOT NULL,
        previousValue TEXT,
        newValue TEXT
      );
    `);
  } catch { /* ignore */ }
}

// ============================================================================
// CRITICAL: Use globalThis to cache the database connection.
//
// In Next.js dev mode, server-side modules get re-evaluated on every hot reload.
// Without globalThis caching, each re-evaluation creates a NEW Database() instance,
// which means:
//   - The old connection stays open (resource leak)
//   - Each module evaluation gets its own separate connection
//   - Changes made through one connection may not be visible through another
//
// By storing the connection on globalThis, we ensure only ONE connection exists
// across all hot reloads. This is a standard Next.js pattern for singletons.
// ============================================================================

// Extend globalThis type for TypeScript
declare global {
  // eslint-disable-next-line no-var
  var __db: InstanceType<typeof Database> | undefined;
}

function getOrCreateDb(): InstanceType<typeof Database> {
  if (!globalThis.__db) {
    globalThis.__db = new Database(dbPath);
    initializeDatabase(globalThis.__db);
    console.log('[db] Created new database connection at:', dbPath);
  }
  return globalThis.__db;
}

// Initialize on first load
getOrCreateDb();

/**
 * Returns the current database instance.
 * Always use getDb() in server actions / API routes.
 * This survives Next.js dev-mode hot reloads via globalThis caching.
 */
export function getDb(): InstanceType<typeof Database> {
  return getOrCreateDb();
}

/**
 * Closes the current database connection and opens a fresh one from the file on disk.
 * Must be called after the restore route replaces the database file.
 */
export function reopenDatabase() {
  try {
    if (globalThis.__db) {
      globalThis.__db.close();
    }
  } catch (e) {
    console.warn('Could not close old database connection:', e);
  }
  globalThis.__db = new Database(dbPath);
  initializeDatabase(globalThis.__db);
  console.log('[db] Database connection reopened from disk.');
}

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
  receipt: string | null;
  unitValue: string | null;
  totalSumInsured: string | null;
  ownership: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyEvent {
  id: string;
  date: string;
  type: 'Created' | 'Moved' | 'Status Change' | 'Condition Change' | 'Maintenance' | 'Note' | 'Detail Change' | 'Financial Change' | 'Deleted' | 'Inspection' | 'Repair' | 'Lent Out' | 'Returned';
  description: string;
  previousValue?: string;
  newValue?: string;
  attachments?: string[];
}
