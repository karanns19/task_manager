import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, createTask, updateTask, deleteTask } from '../utils/api';
import './Dashboard.css';

export default function Dashboard() {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'To Do',
        deadline: '',
        reminder_time: ''
    });
    const navigate = useNavigate();

    // Check authentication on component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        fetchTasks();
    }, [navigate]);

    // Filter tasks when status filter changes
    useEffect(() => {
        if (statusFilter === 'all') {
            setFilteredTasks(tasks);
        } else {
            setFilteredTasks(tasks.filter(task => task.status === statusFilter));
        }
    }, [tasks, statusFilter]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await getTasks();
            if (response.success) {
                setTasks(response.data);
            } else {
                setError('Failed to fetch tasks');
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const response = await createTask(formData);
            if (response.success) {
                setTasks(prev => [response.data, ...prev]);
                setShowCreateModal(false);
                setFormData({ title: '', description: '', status: 'To Do', deadline: '', reminder_time: '' });
            } else {
                setError(response.message || 'Failed to create task');
            }
        } catch (err) {
            setError(err.message || 'Failed to create task');
        }
    };

    const handleUpdateTask = async (e) => {
        e.preventDefault();
        try {
            const response = await updateTask(editingTask.id, formData);
            if (response.success) {
                setTasks(prev => prev.map(task => 
                    task.id === editingTask.id ? response.data : task
                ));
                setEditingTask(null);
                setFormData({ title: '', description: '', status: 'To Do', deadline: '', reminder_time: '' });
            } else {
                setError(response.message || 'Failed to update task');
            }
        } catch (err) {
            setError(err.message || 'Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        
        try {
            const response = await deleteTask(taskId);
            if (response.success) {
                setTasks(prev => prev.filter(task => task.id !== taskId));
            } else {
                setError(response.message || 'Failed to delete task');
            }
        } catch (err) {
            setError(err.message || 'Failed to delete task');
        }
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            status: task.status,
            deadline: task.deadline ? task.deadline.split('T')[0] : '',
            reminder_time: task.reminder_time ? task.reminder_time.split('T')[0] : ''
        });
    };

    const closeModals = () => {
        setShowCreateModal(false);
        setEditingTask(null);
        setFormData({ title: '', description: '', status: 'To Do', deadline: '', reminder_time: '' });
        setError('');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Done': return 'status-done';
            case 'In Progress': return 'status-progress';
            default: return 'status-todo';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Done':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                );
            case 'In Progress':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                    </svg>
                );
            default:
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                );
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const isOverdue = (deadline) => {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
    };

    const getTasksByStatus = (status) => {
        return filteredTasks.filter(task => task.status === status);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading your tasks...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div className="dashboard-title">
                        <h1>My Tasks</h1>
                        <p>Manage and organize your daily tasks efficiently</p>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add Task
                    </button>
                </div>

                <div className="dashboard-controls">
                    <div className="filter-controls">
                        <button 
                            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            All Tasks ({tasks.length})
                        </button>
                        <button 
                            className={`filter-btn ${statusFilter === 'To Do' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('To Do')}
                        >
                            To Do ({tasks.filter(t => t.status === 'To Do').length})
                        </button>
                        <button 
                            className={`filter-btn ${statusFilter === 'In Progress' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('In Progress')}
                        >
                            In Progress ({tasks.filter(t => t.status === 'In Progress').length})
                        </button>
                        <button 
                            className={`filter-btn ${statusFilter === 'Done' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('Done')}
                        >
                            Done ({tasks.filter(t => t.status === 'Done').length})
                        </button>
                    </div>
                    
                    <div className="view-controls">
                        <button 
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="8" y1="6" x2="21" y2="6"/>
                                <line x1="8" y1="12" x2="21" y2="12"/>
                                <line x1="8" y1="18" x2="21" y2="18"/>
                                <line x1="3" y1="6" x2="3.01" y2="6"/>
                                <line x1="3" y1="12" x2="3.01" y2="12"/>
                                <line x1="3" y1="18" x2="3.01" y2="18"/>
                            </svg>
                            List
                        </button>
                        <button 
                            className={`view-btn ${viewMode === 'board' ? 'active' : ''}`}
                            onClick={() => setViewMode('board')}
                            title="Board View"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <line x1="9" y1="9" x2="9" y2="21"/>
                                <line x1="15" y1="9" x2="15" y2="21"/>
                            </svg>
                            Board
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="error-banner">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        {error}
                        <button className="error-close" onClick={() => setError('')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                )}

                <div className="tasks-container">
                    {filteredTasks.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <polyline points="10,9 9,9 8,9"/>
                                </svg>
                            </div>
                            <h3>No tasks found</h3>
                            <p>
                                {statusFilter === 'all' 
                                    ? "You don't have any tasks yet. Create your first task to get started!"
                                    : `No tasks with status "${statusFilter}". Try creating a new task or changing the filter.`
                                }
                            </p>
                            {statusFilter === 'all' && (
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    Create Your First Task
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* List View */}
                            {viewMode === 'list' && (
                                <div className="tasks-list">
                                    {filteredTasks.map(task => (
                                        <div key={task.id} className="task-list-item">
                                            <div className="task-list-content">
                                                <div className="task-list-header">
                                                    <div className={`task-status ${getStatusColor(task.status)}`}>
                                                        {getStatusIcon(task.status)}
                                                        <span>{task.status}</span>
                                                    </div>
                                                    <div className="task-actions">
                                                        <button 
                                                            className="task-action-btn"
                                                            onClick={() => openEditModal(task)}
                                                            title="Edit task"
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            className="task-action-btn task-action-delete"
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            title="Delete task"
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3,6 5,6 21,6"/>
                                                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="task-list-body">
                                                    <h3 className="task-title">{task.title}</h3>
                                                    {task.description && (
                                                        <p className="task-description">{task.description}</p>
                                                    )}
                                                </div>
                                                <div className="task-list-footer">
                                                    <div className="task-meta">
                                                        {task.deadline && (
                                                            <div className={`task-deadline ${isOverdue(task.deadline) ? 'overdue' : ''}`}>
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10"/>
                                                                    <polyline points="12,6 12,12 16,14"/>
                                                                </svg>
                                                                <span>Due: {formatDate(task.deadline)}</span>
                                                                {isOverdue(task.deadline) && <span className="overdue-badge">Overdue</span>}
                                                            </div>
                                                        )}
                                                        {task.reminder_time && (
                                                            <div className="task-reminder">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                                                </svg>
                                                                <span>Reminder: {formatDate(task.reminder_time)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="task-date">
                                                        Created: {formatDate(task.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Board View */}
                            {viewMode === 'board' && (
                                <div className="tasks-board">
                                    <div className="board-column">
                                        <div className="board-column-header">
                                            <h3>To Do</h3>
                                            <span className="column-count">{getTasksByStatus('To Do').length}</span>
                                        </div>
                                        <div className="board-column-content">
                                            {getTasksByStatus('To Do').map(task => (
                                                <div key={task.id} className="board-task-card" draggable>
                                                    <div className="board-task-header">
                                                        <h4 className="board-task-title">{task.title}</h4>
                                                        <div className="board-task-actions">
                                                            <button 
                                                                className="task-action-btn"
                                                                onClick={() => openEditModal(task)}
                                                                title="Edit task"
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                                </svg>
                                                            </button>
                                                            <button 
                                                                className="task-action-btn task-action-delete"
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                title="Delete task"
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3,6 5,6 21,6"/>
                                                                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {task.description && (
                                                        <p className="board-task-description">{task.description}</p>
                                                    )}
                                                    {task.deadline && (
                                                        <div className={`board-task-deadline ${isOverdue(task.deadline) ? 'overdue' : ''}`}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10"/>
                                                                <polyline points="12,6 12,12 16,14"/>
                                                            </svg>
                                                            <span>{formatDate(task.deadline)}</span>
                                                            {isOverdue(task.deadline) && <span className="overdue-badge">Overdue</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="board-column">
                                        <div className="board-column-header">
                                            <h3>In Progress</h3>
                                            <span className="column-count">{getTasksByStatus('In Progress').length}</span>
                                        </div>
                                        <div className="board-column-content">
                                            {getTasksByStatus('In Progress').map(task => (
                                                <div key={task.id} className="board-task-card" draggable>
                                                    <div className="board-task-header">
                                                        <h4 className="board-task-title">{task.title}</h4>
                                                        <div className="board-task-actions">
                                                            <button 
                                                                className="task-action-btn"
                                                                onClick={() => openEditModal(task)}
                                                                title="Edit task"
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                                </svg>
                                                            </button>
                                                            <button 
                                                                className="task-action-btn task-action-delete"
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                title="Delete task"
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3,6 5,6 21,6"/>
                                                                    <line x1="15" y1="12" x2="9" y2="12"/>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {task.description && (
                                                        <p className="board-task-description">{task.description}</p>
                                                    )}
                                                    {task.deadline && (
                                                        <div className={`board-task-deadline ${isOverdue(task.deadline) ? 'overdue' : ''}`}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10"/>
                                                                <polyline points="12,6 12,12 16,14"/>
                                                            </svg>
                                                            <span>{formatDate(task.deadline)}</span>
                                                            {isOverdue(task.deadline) && <span className="overdue-badge">Overdue</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="board-column">
                                        <div className="board-column-header">
                                            <h3>Done</h3>
                                            <span className="column-count">{getTasksByStatus('Done').length}</span>
                                        </div>
                                        <div className="board-column-content">
                                            {getTasksByStatus('Done').map(task => (
                                                <div key={task.id} className="board-task-card" draggable>
                                                    <div className="board-task-header">
                                                        <h4 className="board-task-title">{task.title}</h4>
                                                        <div className="board-task-actions">
                                                            <button 
                                                                className="task-action-btn"
                                                                onClick={() => openEditModal(task)}
                                                                title="Edit task"
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                                </svg>
                                                            </button>
                                                            <button 
                                                                className="task-action-btn task-action-delete"
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                title="Delete task"
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3,6 5,6 21,6"/>
                                                                    <line x1="15" y1="12" x2="9" y2="12"/>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {task.description && (
                                                        <p className="board-task-description">{task.description}</p>
                                                    )}
                                                    {task.deadline && (
                                                        <div className={`board-task-deadline ${isOverdue(task.deadline) ? 'overdue' : ''}`}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10"/>
                                                                <polyline points="12,6 12,12 16,14"/>
                                                            </svg>
                                                            <span>{formatDate(task.deadline)}</span>
                                                            {isOverdue(task.deadline) && <span className="overdue-badge">Overdue</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Task</h2>
                            <button className="modal-close" onClick={closeModals}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateTask} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="title" className="form-label">Task Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="form-input"
                                    placeholder="Enter task title"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description" className="form-label">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="form-input"
                                    placeholder="Enter task description (optional)"
                                    rows="3"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="status" className="form-label">Status</label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="form-input"
                                    >
                                        <option value="To Do">To Do</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="deadline" className="form-label">Deadline</label>
                                    <input
                                        type="date"
                                        id="deadline"
                                        name="deadline"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="reminder_time" className="form-label">Reminder</label>
                                <input
                                    type="date"
                                    id="reminder_time"
                                    name="reminder_time"
                                    value={formData.reminder_time}
                                    onChange={(e) => setFormData({...formData, reminder_time: e.target.value})}
                                    className="form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModals}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Task</h2>
                            <button className="modal-close" onClick={closeModals}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateTask} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="edit-title" className="form-label">Task Title *</label>
                                <input
                                    type="text"
                                    id="edit-title"
                                    name="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="form-input"
                                    placeholder="Enter task title"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-description" className="form-label">Description</label>
                                <textarea
                                    id="edit-description"
                                    name="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="form-input"
                                    placeholder="Enter task description (optional)"
                                    rows="3"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="edit-status" className="form-label">Status</label>
                                    <select
                                        id="edit-status"
                                        name="status"
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="form-input"
                                    >
                                        <option value="To Do">To Do</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-deadline" className="form-label">Deadline</label>
                                    <input
                                        type="date"
                                        id="edit-deadline"
                                        name="deadline"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-reminder_time" className="form-label">Reminder</label>
                                <input
                                    type="date"
                                    id="edit-reminder_time"
                                    name="reminder_time"
                                    value={formData.reminder_time}
                                    onChange={(e) => setFormData({...formData, reminder_time: e.target.value})}
                                    className="form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModals}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Update Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}