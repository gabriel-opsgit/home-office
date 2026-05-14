import React, { useState, useEffect } from 'react';
import { LogOut, CheckCircle, Circle, MessageSquare, Plus, Trash2, User, Edit2, Save, X, Briefcase, Calendar, Filter, AlertCircle, EyeOff, Eye, Search } from 'lucide-react';
import './styles/main.css';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Filters & Search State
  const [filterUser, setFilterUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);

  // New Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState('normal');
  const [newAssignee, setNewAssignee] = useState('');

  // Edit Task State
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editClient, setEditClient] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('normal');
  const [editAssignee, setEditAssignee] = useState('');

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token) {
      fetchTasks();
      if (user.role === 'admin') fetchUsers();
    }
  }, [token]);

  const fetchTasks = async () => {
    const res = await fetch(`${API_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setTasks(data);
  };

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setUsers(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Erro ao conectar com servidor');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        title: newTitle, 
        description: newDesc, 
        client_name: newClient, 
        due_date: newDueDate,
        priority: newPriority,
        assigned_to: newAssignee 
      })
    });
    setNewTitle('');
    setNewDesc('');
    setNewClient('');
    setNewDueDate('');
    setNewPriority('normal');
    fetchTasks();
  };

  const updateStatus = async (taskId: number, newStatus: string) => {
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    fetchTasks();
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Tem certeza que deseja apagar esta demanda?')) return;
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchTasks();
  };

  const startEditing = (task: any) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditClient(task.client_name || '');
    setEditDueDate(task.due_date || '');
    setEditPriority(task.priority || 'normal');
    setEditAssignee(task.assigned_to);
  };

  const saveEdit = async (taskId: number) => {
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        title: editTitle, 
        description: editDesc, 
        client_name: editClient,
        due_date: editDueDate,
        priority: editPriority,
        assigned_to: editAssignee 
      })
    });
    setEditingTaskId(null);
    fetchTasks();
  };

  const isOverdue = (date: string) => {
    if (!date) return false;
    return new Date(date + "T00:00:00") < new Date(new Date().setHours(0,0,0,0));
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!token) {
    return (
      <div className="login-container">
        <form className="card" onSubmit={handleLogin}>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--primary)' }}>Home Office</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>Acesse seu painel de demandas</p>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Usuário</label>
            <input value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button style={{ background: 'var(--primary)', color: 'white', width: '100%', padding: '14px' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Acessar Painel'}
          </button>
        </form>
      </div>
    );
  }

  const filteredTasks = tasks
    .filter(t => !filterUser || t.assigned_to === parseInt(filterUser))
    .filter(t => !filterStatus || t.status === filterStatus)
    .filter(t => !filterDate || t.due_date === filterDate)
    .filter(t => !hideCompleted || t.status !== 'concluido')
    .filter(t => {
      const search = searchTerm.toLowerCase();
      return t.title.toLowerCase().includes(search) || 
             (t.client_name && t.client_name.toLowerCase().includes(search)) ||
             (t.description && t.description.toLowerCase().includes(search));
    });

  return (
    <div className="dashboard">
      <header className="header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Olá, {user.name} 👋</h1>
          <p style={{ color: 'var(--text-muted)' }}>Você tem {tasks.filter(t => t.status !== 'concluido').length} tarefas ativas.</p>
        </div>
        <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 20px' }}>
          <LogOut size={18} /> Sair
        </button>
      </header>

      {user.role === 'admin' && (
        <section className="admin-panel">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
            <Plus size={24}/> Criar Nova Demanda
          </h3>
          <form onSubmit={createTask} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Título</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="Relatório" />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cliente</label>
              <input value={newClient} onChange={e => setNewClient(e.target.value)} placeholder="Cliente" />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Prioridade</label>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Entrega</label>
              <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Responsável</label>
              <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} required>
                <option value="">Membro...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Descrição</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="O que precisa ser feito?" />
            </div>
            <button style={{ background: 'var(--primary)', color: 'white', padding: '12px 24px', height: '45px', gridColumn: '1 / -1' }}>
              Direcionar Tarefa
            </button>
          </form>
        </section>
      )}

      <section className="admin-panel" style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            <Filter size={20}/> Filtros & Busca
          </h3>
          <button 
            onClick={() => setHideCompleted(!hideCompleted)}
            style={{ background: hideCompleted ? 'var(--primary)' : '#e2e8f0', color: hideCompleted ? 'white' : 'var(--text)', padding: '6px 12px', fontSize: '12px' }}
          >
            {hideCompleted ? <EyeOff size={14}/> : <Eye size={14}/>} {hideCompleted ? 'Mostrando Apenas Ativas' : 'Limpar Dashboard (Ocultar Concluídas)'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>BUSCAR</label>
            <div style={{ position: 'relative' }}>
              <input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Título, cliente ou desc..." 
                style={{ paddingLeft: '35px', fontSize: '13px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>
          {user.role === 'admin' && (
            <div>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>PESSOA</label>
              <select value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ padding: '8px', fontSize: '13px' }}>
                <option value="">Todas</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>STATUS</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px', fontSize: '13px' }}>
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="fazendo">Fazendo</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>
          <button 
            onClick={() => { setFilterUser(''); setFilterStatus(''); setFilterDate(''); setSearchTerm(''); setHideCompleted(false); }}
            style={{ background: '#e2e8f0', color: 'var(--text)', height: '42px', alignSelf: 'end', fontSize: '12px' }}
          >
            Resetar Tudo
          </button>
        </div>
      </section>

      <div className="task-grid">
        {filteredTasks.map(task => (
          <div key={task.id} className={`task-card ${task.status}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <select 
                className={`status-select status-${task.status}`}
                value={task.status} 
                onChange={(e) => updateStatus(task.id, e.target.value)}
              >
                <option value="pendente">Pendente</option>
                <option value="fazendo">Fazendo</option>
                <option value="concluido">Concluído</option>
              </select>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`priority-tag priority-${task.priority || 'normal'}`}>
                  {task.priority || 'normal'}
                </span>
                {user.role === 'admin' && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {editingTaskId === task.id ? (
                      <>
                        <button className="delete-btn" onClick={() => saveEdit(task.id)} style={{ color: 'var(--success)' }}>
                          <Save size={18} />
                        </button>
                        <button className="delete-btn" onClick={() => setEditingTaskId(null)}>
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="delete-btn" onClick={() => startEditing(task)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="delete-btn" onClick={() => deleteTask(task.id)}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {editingTaskId === task.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ fontWeight: 'bold' }} />
                <input value={editClient} onChange={e => setEditClient(e.target.value)} placeholder="Cliente" />
                <select value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
                <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} style={{ resize: 'none' }} />
                <select value={editAssignee} onChange={e => setEditAssignee(e.target.value)}>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <h3 style={{ 
                  fontSize: '1.2rem', 
                  marginBottom: '0.5rem',
                  textDecoration: task.status === 'concluido' ? 'line-through' : 'none',
                  color: task.status === 'concluido' ? 'var(--text-muted)' : 'var(--text)'
                }}>
                  {task.title}
                </h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  {task.client_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px' }}>
                      <Briefcase size={14} /> {task.client_name}
                    </div>
                  )}
                  {task.due_date && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: isOverdue(task.due_date) && task.status !== 'concluido' ? 'var(--danger)' : 'var(--text-muted)', 
                      fontWeight: 'bold', 
                      fontSize: '12px' 
                    }}>
                      <Calendar size={14} /> {new Date(task.due_date + "T00:00:00").toLocaleDateString('pt-BR')}
                      {isOverdue(task.due_date) && task.status !== 'concluido' && <AlertCircle size={14} />}
                    </div>
                  )}
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '10px' }}>{task.description}</p>
                
                {task.status === 'concluido' && task.completed_at && (
                  <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 'bold', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> Concluído em: {formatDateTime(task.completed_at)}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f3f4f6', borderRadius: '8px', alignSelf: 'flex-start' }}>
              <User size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '12px', fontWeight: '700' }}>{user.role === 'admin' ? task.assigned_name : user.name}</span>
            </div>
            
            <TaskComments taskId={task.id} token={token} userRole={user.role} userId={user.id} />
          </div>
        ))}
      </div>
      {filteredTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '16px', border: '1px dashed var(--border)', marginTop: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Nenhuma demanda encontrada para os filtros aplicados.</p>
        </div>
      )}
    </div>
  );
}

function TaskComments({ taskId, token, userRole, userId }: { taskId: number, token: string, userRole: string, userId: number }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const fetchComments = async () => {
    const res = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setComments(data);
  };

  useEffect(() => { fetchComments(); }, []);

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await fetch(`${API_URL}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: newComment })
    });
    setNewComment('');
    fetchComments();
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm('Deseja apagar este comentário?')) return;
    await fetch(`${API_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchComments();
  };

  return (
    <div className="comments-section" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
        <MessageSquare size={14} /> {comments.length} Comentários
      </div>
      <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '0.75rem' }}>
        {comments.map(c => (
          <div key={c.id} className="comment">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: '800', marginRight: '6px', color: 'var(--primary)', fontSize: '12px' }}>{c.user_name}:</span> 
                {c.content}
              </div>
              {(userRole === 'admin' || c.user_id === userId) && (
                <button 
                  onClick={() => deleteComment(c.id)} 
                  style={{ background: 'transparent', color: '#d1d5db', padding: '2px' }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={addComment} style={{ display: 'flex', gap: '6px' }}>
        <input 
          placeholder="Responder..." 
          value={newComment} 
          onChange={e => setNewComment(e.target.value)}
          style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '20px' }}
        />
        <button style={{ background: 'var(--primary)', color: 'white', padding: '0 12px', borderRadius: '20px', fontSize: '12px' }}>
          Enviar
        </button>
      </form>
    </div>
  );
}

export default App;
