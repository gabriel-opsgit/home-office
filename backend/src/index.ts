import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { initDb } from './db';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'taskhub_secret_key_123';

app.use(cors());
app.use(express.json());

let db: any;

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
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE username = ?', username);
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

// Users list (for Admin to assign)
app.get('/api/users', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const users = await db.all('SELECT id, name FROM users WHERE role = "user"');
  res.json(users);
});

// Tasks
app.get('/api/tasks', authenticate, async (req: any, res) => {
  let tasks;
  if (req.user.role === 'admin') {
    tasks = await db.all(`
      SELECT tasks.*, users.name as assigned_name 
      FROM tasks 
      LEFT JOIN users ON tasks.assigned_to = users.id
      ORDER BY created_at DESC
    `);
  } else {
    tasks = await db.all('SELECT * FROM tasks WHERE assigned_to = ? ORDER BY created_at DESC', req.user.id);
  }
  res.json(tasks);
});

app.post('/api/tasks', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { title, description, client_name, due_date, priority, assigned_to } = req.body;
  const result = await db.run('INSERT INTO tasks (title, description, client_name, due_date, priority, assigned_to) VALUES (?, ?, ?, ?, ?, ?)', 
    title, description, client_name, due_date, priority, assigned_to);
  res.json({ id: result.lastID });
});

app.patch('/api/tasks/:id', authenticate, async (req: any, res) => {
  const { title, description, client_name, due_date, priority, assigned_to, status } = req.body;
  const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.id);
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
    await db.run(
      'UPDATE tasks SET title = ?, description = ?, client_name = ?, due_date = ?, priority = ?, assigned_to = ?, status = ?, completed_at = ? WHERE id = ?',
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
    // Regular users can only update status (and indirectly completed_at)
    await db.run('UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?', 
      status ?? task.status, completedAt, req.params.id);
  }
  
  res.json({ success: true });
});

// Comments
app.get('/api/tasks/:id/comments', authenticate, async (req: any, res) => {
  const comments = await db.all(`
    SELECT comments.*, users.name as user_name 
    FROM comments 
    JOIN users ON comments.user_id = users.id 
    WHERE task_id = ? 
    ORDER BY created_at ASC
  `, req.params.id);
  res.json(comments);
});

app.post('/api/tasks/:id/comments', authenticate, async (req: any, res) => {
  const { content } = req.body;
  await db.run('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)', 
    req.params.id, req.user.id, content);
  res.json({ success: true });
});

// Delete Task (Admin only)
app.delete('/api/tasks/:id', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await db.run('DELETE FROM comments WHERE task_id = ?', req.params.id);
  await db.run('DELETE FROM tasks WHERE id = ?', req.params.id);
  res.json({ success: true });
});

// Delete Comment (Admin or comment author)
app.delete('/api/comments/:id', authenticate, async (req: any, res) => {
  const comment = await db.get('SELECT * FROM comments WHERE id = ?', req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  if (req.user.role !== 'admin' && comment.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await db.run('DELETE FROM comments WHERE id = ?', req.params.id);
  res.json({ success: true });
});

initDb().then(database => {
  db = database;
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
});
