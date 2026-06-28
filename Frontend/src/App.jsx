import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Clock, Trash2, AlertCircle, Search, AlertTriangle, Bell } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [systemNotifications, setSystemNotifications] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  
  useEffect(() => {
    if (tasks.length > 0) {
      checkTimeDeadlines();
    }
  }, [tasks]);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_URL);
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  
  const checkTimeDeadlines = () => {
    const alerts = [];
    const now = new Date();

    tasks.forEach(task => {
      if (task.status === 'Completed' || !task.dueDate) return;

      const taskDate = new Date(task.dueDate);
      
      const diffTime = taskDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffTime < 0) {
        alerts.push(`🚨 Overdue: The deadline for "${task.title}" has passed!`);
      } else if (diffDays <= 1) {
        alerts.push(`⏳ Due Soon: "${task.title}" is expiring within the next 24 hours!`);
      }
    });

    setSystemNotifications(alerts);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is strictly required!');
      return;
    }
    setError('');

    try {
      const response = await axios.post(API_URL, { title, description, dueDate, status });
      setTasks([response.data, ...tasks]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setStatus('Pending');
      triggerToast('Task created successfully! 🎉');
    } catch (err) {
      console.error('Error creating task:', err);
      triggerToast('Failed to create task.', 'error');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    let nextStatus = 'In Progress';
    if (currentStatus === 'In Progress') nextStatus = 'Completed';
    if (currentStatus === 'Completed') nextStatus = 'Pending';

    try {
      const response = await axios.put(`${API_URL}/${id}`, { status: nextStatus });
      setTasks(tasks.map((task) => (task._id === id ? response.data : task)));
      triggerToast(`Status updated to ${nextStatus}! 🔄`);
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTasks(tasks.filter((task) => task._id !== id));
      triggerToast('Task permanently deleted.', 'error');
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Helper helper to generate inline status alerts for specific cards
  const getDeadlineAlert = (dueDate, status) => {
    if (status === 'Completed' || !dueDate) return null;
    const now = new Date();
    const taskDate = new Date(dueDate);
    const diffTime = taskDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) {
      return { text: 'Overdue! 🚨', color: '#f87171', bg: '#ef444415' };
    }
    if (diffDays <= 1) {
      return { text: 'Due Soon! ⏳', color: '#fbbf24', bg: '#fbbf2415' };
    }
    return null;
  };

  const totalTasks = tasks.length;
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const progressCount = tasks.filter(t => t.status === 'In Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === 'All' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={styles.container}>
      <style>{hoverAndGlobalStyles}</style>
      
      {toast.show && (
        <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981'}}>
          {toast.message}
        </div>
      )}

      <div style={styles.wrapper}>
        
        {/* Header Section */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.logo}>COLL-EDGE Connect Tracker</h1>
            <p style={styles.subtitle}>Streamline your professional workflow seamlessly</p>
          </div>
          
          <div style={styles.filterContainer}>
            {['All', 'Pending', 'In Progress', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  ...styles.filterBtn,
                  ...(filter === tab ? styles.filterBtnActive : {}),
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

      
        {systemNotifications.length > 0 && (
          <div style={styles.notificationCenter}>
            <h4 style={styles.notificationTitle}>
              <Bell size={16} /> Live Smart Reminders ({systemNotifications.length})
            </h4>
            <div style={styles.notificationList}>
              {systemNotifications.map((note, index) => (
                <div key={index} style={styles.notificationItem}>{note}</div>
              ))}
            </div>
          </div>
        )}

       
        <section style={styles.statsRow}>
          <div style={styles.statCard}><span style={styles.statNum}>{totalTasks}</span><span style={styles.statLabel}>Total Tasks</span></div>
          <div style={{...styles.statCard, borderLeft: '4px solid #94a3b8'}}><span style={styles.statNum}>{pendingCount}</span><span style={styles.statLabel}>Pending</span></div>
          <div style={{...styles.statCard, borderLeft: '4px solid #fbbf24'}}><span style={styles.statNum}>{progressCount}</span><span style={styles.statLabel}>In Progress</span></div>
          <div style={{...styles.statCard, borderLeft: '4px solid #34d399'}}><span style={styles.statNum}>{completedCount}</span><span style={styles.statLabel}>Completed</span></div>
        </section>

        
        <div style={styles.searchWrapper}>
          <Search size={18} color="#64748b" style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search tasks instantly by title or description details..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchBar}
          />
        </div>

      
        <div style={styles.grid}>
          
          
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <PlusCircle size={20} color="#3b82f6" /> Create New Task
            </h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div>
                <label style={styles.label}>Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Complete submission document"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={styles.input}
                />
                {error && (
                  <p style={styles.errorText}>
                    <AlertCircle size={14} /> {error}
                  </p>
                )}
              </div>

              <div>
                <label style={styles.label}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe your goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...styles.input, resize: 'none' }}
                />
              </div>

              <div>
                <label style={styles.label}>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={styles.select}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <button type="submit" className="submit-btn" style={styles.submitBtn}>
                Add Task
              </button>
            </form>
          </div>

         
          <div style={styles.taskListContainer}>
            {filteredTasks.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={{ color: '#64748b', fontSize: '14px' }}>No active tasks found matching your filters.</p>
              </div>
            ) : (
              <div style={styles.taskGrid}>
                {filteredTasks.map((task) => {
                  const alertBadge = getDeadlineAlert(task.dueDate, task.status);
                  return (
                    <div key={task._id} style={styles.taskCard}>
                      <div>
                       
                        {alertBadge && (
                          <div style={{...styles.cardAlertBanner, color: alertBadge.color, backgroundColor: alertBadge.bg}}>
                            <AlertTriangle size={12} /> {alertBadge.text}
                          </div>
                        )}

                        <div style={styles.taskHeader}>
                          <h3
                            style={{
                              ...styles.taskTitle,
                              ...(task.status === 'Completed' ? styles.taskTitleCompleted : {}),
                            }}
                          >
                            {task.title}
                          </h3>
                          <button
                            onClick={() => handleToggleStatus(task._id, task.status)}
                            title="Click to cycle status status"
                            style={{
                              ...styles.badge,
                              ...(task.status === 'Completed' ? styles.badgeCompleted : task.status === 'In Progress' ? styles.badgeProgress : styles.badgePending),
                            }}
                          >
                            {task.status}
                          </button>
                        </div>
                        <p style={styles.taskDesc}>{task.description || 'No description provided.'}</p>
                      </div>

                      <div style={styles.taskFooter}>
                        <span style={styles.taskDate}>
                          <Clock size={14} /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}
                        </span>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="delete-btn"
                          style={styles.deleteBtn}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '40px 20px',
    position: 'relative'
  },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    animation: 'slideIn 0.3s ease'
  },
  wrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    paddingBottom: '24px',
    borderBottom: '1px solid #1e293b',
    marginBottom: '24px',
  },
  logo: {
    fontSize: '32px',
    fontWeight: '800',
    margin: 0,
    background: 'linear-gradient(to right, #3b82f6, #10b981)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '14px',
    margin: '4px 0 0 0',
  },
  filterContainer: {
    backgroundColor: '#1e293b',
    padding: '4px',
    borderRadius: '12px',
    display: 'flex',
    border: '1px solid #334155',
  },
  filterBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  },
  notificationCenter: {
    backgroundColor: '#1e293b90',
    border: '1px solid #f59e0b40',
    borderRadius: '16px',
    padding: '16px 20px',
    marginBottom: '24px',
  },
  notificationTitle: {
    margin: '0 0 10px 0',
    color: '#fbbf24',
    fontSize: '14px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  notificationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  notificationItem: {
    fontSize: '13px',
    color: '#cbd5e1',
    backgroundColor: '#0f172a50',
    padding: '8px 12px',
    borderRadius: '8px',
    borderLeft: '3px solid #fbbf24'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: '#1e293b80',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statNum: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#f8fafc'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  searchWrapper: {
    position: 'relative',
    marginBottom: '32px',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)'
  },
  searchBar: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#1e293b60',
    border: '1px solid #334155',
    borderRadius: '14px',
    padding: '14px 14px 14px 48px',
    fontSize: '14px',
    color: '#f8fafc',
    outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px',
    alignItems: 'start',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #334155',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    width: '100%',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
  },
  errorText: {
    color: '#f87171',
    fontSize: '12px',
    margin: '6px 0 0 0',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '8px',
  },
  taskListContainer: {
    gridColumn: 'span 2',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    border: '2px dashed #334155',
    borderRadius: '16px',
  },
  taskGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  taskCard: {
    backgroundColor: '#1e293b70',
    border: '1px solid #334155',
    padding: '20px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '180px',
  },
  cardAlertBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '700',
    padding: '6px 12px',
    borderRadius: '8px',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em'
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '8px',
  },
  taskTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: 0,
    color: '#f1f5f9',
  },
  taskTitleCompleted: {
    textDecoration: 'line-through',
    color: '#64748b',
  },
  taskDesc: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '0 0 16px 0',
  },
  badge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid transparent',
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
  badgePending: { backgroundColor: '#47556930', color: '#94a3b8', borderColor: '#475569' },
  badgeProgress: { backgroundColor: '#d9770620', color: '#fbbf24', borderColor: '#d9770640' },
  badgeCompleted: { backgroundColor: '#05966920', color: '#34d399', borderColor: '#05966940' },
  taskFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #33415560',
  },
  taskDate: {
    fontSize: '12px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
};

const hoverAndGlobalStyles = `
  .submit-btn:hover { background-color: #2563eb !important; }
  .delete-btn:hover { color: #f87171 !important; background-color: #ef444410 !important; }
  input:focus, textarea:focus, select:focus, input[type="text"]:focus { border-color: #3b82f6 !important; }
  
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
    opacity: 0.8;
  }

  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (max-width: 900px) {
    div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
    .task-list-container { grid-column: span 1 !important; }
  }
`;

export default App;