import Database from 'better-sqlite3';
import { join } from 'path';
import fs from 'fs';

// Ensure the data directory exists with better error handling
const dataDir = join(process.cwd(), 'data');
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create data directory:', error);
  throw new Error('Could not initialize database storage directory');
}

// Initialize database with error handling
let db;
try {
  const dbPath = join(dataDir, 'tasks.db');
  db = new Database(dbPath);
  
  // Test database connection
  db.pragma('journal_mode = WAL');
} catch (error) {
  console.error('Failed to initialize database:', error);
  throw new Error('Database initialization failed');
}

// First create the categories table
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL
  )
`);

// Then create the tasks table with references to categories
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category_id INTEGER,
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )
`);

// Insert default categories if they don't exist
const defaultCategories = [
  { name: 'Work', color: '#4f46e5' },
  { name: 'Personal', color: '#16a34a' },
  { name: 'Shopping', color: '#ea580c' },
  { name: 'Health', color: '#dc2626' },
  { name: 'Education', color: '#9333ea' }
];

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)
`);

for (const category of defaultCategories) {
  insertCategory.run(category.name, category.color);
}

// Check if tables have the correct structure
try {
  // Verify tasks table has all required columns
  const taskColumns = db.prepare("PRAGMA table_info(tasks)").all();
  const requiredColumns = ['id', 'title', 'completed', 'created_at', 'category_id', 'priority', 'due_date'];
  
  const missingColumns = requiredColumns.filter(col => 
    !taskColumns.some(c => c.name === col)
  );
  
  if (missingColumns.length > 0) {
    console.warn(`Missing columns in tasks table: ${missingColumns.join(', ')}`);
    
    // Recreate the table with correct structure if needed
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        category_id INTEGER,
        priority TEXT DEFAULT 'medium',
        due_date TEXT,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);
    
    // Copy existing data
    const existingColumns = taskColumns.map(c => c.name).filter(name => 
      requiredColumns.includes(name)
    ).join(', ');
    
    if (existingColumns.length > 0) {
      db.exec(`INSERT INTO tasks_new (${existingColumns}) SELECT ${existingColumns} FROM tasks`);
    }
    
    // Replace old table with new one
    db.exec(`
      DROP TABLE tasks;
      ALTER TABLE tasks_new RENAME TO tasks;
    `);
  }
} catch (error) {
  console.error('Error checking table structure:', error);
}

export default db;