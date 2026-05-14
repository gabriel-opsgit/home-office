import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

let db: any;

export function initDb() {
  db = new Database('./database.sqlite');
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      client_name TEXT,
      assigned_to INTEGER,
      status TEXT DEFAULT 'pendente',
      priority TEXT DEFAULT 'normal',
      due_date TEXT,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      user_id INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(task_id) REFERENCES tasks(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Migration: Ensure all columns exist
  const tableInfo = db.prepare("PRAGMA table_info(tasks)").all();
  const columns = (tableInfo as any[]).map(col => col.name);
  
  if (!columns.includes('client_name')) {
    db.exec('ALTER TABLE tasks ADD COLUMN client_name TEXT');
  }
  if (!columns.includes('due_date')) {
    db.exec('ALTER TABLE tasks ADD COLUMN due_date TEXT');
  }
  if (!columns.includes('priority')) {
    db.exec("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'normal'");
  }
  if (!columns.includes('completed_at')) {
    db.exec("ALTER TABLE tasks ADD COLUMN completed_at DATETIME");
  }

  // Seed Users
  const users = [
    { name: 'Admin', username: 'admin', password: 'admin123', role: 'admin' },
    { name: 'Rafaela', username: 'rafaela', password: '123', role: 'user' },
    { name: 'Gabriel', username: 'gabriel', password: '123', role: 'user' },
    { name: 'Caio', username: 'caio', password: '123', role: 'user' },
    { name: 'Henrique', username: 'henrique', password: '123', role: 'user' },
    { name: 'Bruno', username: 'bruno', password: '123', role: 'user' },
  ];

  for (const user of users) {
    const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(user.username);
    if (!existing) {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      db.prepare('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)').run(
        user.name, user.username, hashedPassword, user.role);
    }
  }

  return db;
}

export { db };
