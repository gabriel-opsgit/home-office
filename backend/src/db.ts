import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

export async function initDb() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
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
  const tableInfo = await db.all("PRAGMA table_info(tasks)");
  const columns = tableInfo.map(col => col.name);
  
  if (!columns.includes('client_name')) {
    await db.exec('ALTER TABLE tasks ADD COLUMN client_name TEXT');
  }
  if (!columns.includes('due_date')) {
    await db.exec('ALTER TABLE tasks ADD COLUMN due_date TEXT');
  }
  if (!columns.includes('priority')) {
    await db.exec("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'normal'");
  }
  if (!columns.includes('completed_at')) {
    await db.exec("ALTER TABLE tasks ADD COLUMN completed_at DATETIME");
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
    const existing = await db.get('SELECT * FROM users WHERE username = ?', user.username);
    if (!existing) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.run('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)', 
        user.name, user.username, hashedPassword, user.role);
    }
  }

  return db;
}
