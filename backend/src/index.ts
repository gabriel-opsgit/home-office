import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { initDb } from './db';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'taskhub_secret_key_123';

app.use(cors());
app.use(express.json());

// Serve Static Files from Frontend
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

const db = initDb();

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

// Users list (for Admin to assign)
app.get('/api/users', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const users = db.prepare('SELECT id, name FROM users WHERE role = "user"').all();
  res.json(users);
});

// Tasks
app.get('/api/tasks', authenticate, (req: any, res) => {
  let tasks;
  if (req.user.role === 'admin') {
    tasks = db.prepare(`
      SELECT tasks.*, users.name as assigned_name 
      FROM tasks 
      LEFT JOIN users ON tasks.assigned_to = users.id
      ORDER BY created_at DESC
    `).all();
  } else {
    tasks = db.prepare('SELECT * FROM tasks WHERE assigned_to = ? ORDER BY created_at DESC').all(req.user.id);
  }
  res.json(tasks);
});

app.post('/api/tasks', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { title, description, client_name, due_date, priority, assigned_to } = req.body;
  const result = db.prepare('INSERT INTO tasks (title, description, client_name, due_date, priority, assigned_to) VALUES (?, ?, ?, ?, ?, ?)').run(
    title, description, client_name, due_date, priority, assigned_to);
  res.json({ id: result.lastInsertRowid });
});

app.patch('/api/tasks/:id', authenticate, (req: any, res) => {
  const { title, description, client_name, due_date, priority, assigned_to, status } = req.body;
  const task: any = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  
  if (req.user.role !== 'admin' && task.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  let completedAt = task.completed_at;
  if (status === 'concluido' && task.status !== 'concluido') {
    completedAt = new Date().toISOString();
  } else if (status && status !== 'concluido') {
    completedAt = null;
  }

  if (req.user.role === 'admin') {
    db.prepare(`
      UPDATE tasks SET title = ?, description = ?, client_name = ?, due_date = ?, priority = ?, assigned_to = ?, status = ?, completed_at = ? WHERE id = ?
    `).run(
      title ?? task.title,
      description ?? task.description,
      client_name ?? task.client_name,
      due_date ?? task.due_date,
      priority ?? task.priority,
      assigned_to ?? task.assigned_to,
      status ?? task.status,
      completedAt,
      req.params.id
    );
  } else {
    db.prepare('UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?').run(
      status ?? task.status, completedAt, req.params.id);
  }
  
  res.json({ success: true });
});

// Comments
app.get('/api/tasks/:id/comments', authenticate, (req: any, res) => {
  const comments = db.prepare(`
    SELECT comments.*, users.name as user_name 
    FROM comments 
    JOIN users ON comments.user_id = users.id 
    WHERE task_id = ? 
    ORDER BY created_at ASC
  `).all(req.params.id);
  res.json(comments);
});

app.post('/api/tasks/:id/comments', authenticate, (req: any, res) => {
  const { content } = req.body;
  db.prepare('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)').run(
    req.params.id, req.user.id, content);
  res.json({ success: true });
});

// Delete Task (Admin only)
app.delete('/api/tasks/:id', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM comments WHERE task_id = ?').run(req.params.id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Delete Comment (Admin or comment author)
app.delete('/api/comments/:id', authenticate, (req: any, res) => {
  const comment: any = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  if (req.user.role !== 'admin' && comment.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// SPA Routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
