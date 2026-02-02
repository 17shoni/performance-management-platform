import Header from '../components/Header';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useEffect, useState, useRef } from 'react';


function Tasks({ role }) {
  const formRef = useRef(null);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    employee: '',
    priority: 'medium',
  });
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchTasks();
  }, []);


  useEffect(() => {
    if (currentUserId && role !== 'employee') {
      fetchEmployees();
    }
  }, [currentUserId, role]);



  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('me/');
      setCurrentUserId(res.data.id);
      console.log('Current user ID:', res.data.id, 'Role:', res.data.role);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      toast.error('Session issue - please login again');
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('tasks/');
      console.log('Tasks loaded:', res.data);
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      toast.error('Could not load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!currentUserId) {
      console.log('Waiting for currentUserId...');
      return;
    }

    try {
      const res = await api.get('users/');
      console.log('All users response:', res.data);

      let filtered = res.data.filter(u => u.role === 'employee');

      if (role === 'supervisor') {
        filtered = filtered.filter(u => u.supervisor === currentUserId);
        console.log('Supervisor filtered team:', filtered);
      } else if (role === 'admin') {
        console.log('Admin - all employees:', filtered);
      }

      if (filtered.length === 0) {
        toast.info(role === 'supervisor' ? 'No team members assigned to you' : 'No employees found');
      }

      setEmployees(filtered);
    } catch (err) {
      console.error('Failed to load employees:', err);
      toast.error('Could not load employee list');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        deadline: form.deadline,
        priority: form.priority,
      };
      if (role !== 'employee') {
        payload.employee_id = form.employee; // use ID for write
      }

      if (editingTask) {
        await api.patch(`tasks/${editingTask.id}/`, payload);
        toast.success('Task updated successfully! 🎉');
        setEditingTask(null);
      } else {
        await api.post('tasks/', payload);
        toast.success('Task created successfully! 🎉');
      }

      setForm({
        title: '',
        description: '',
        deadline: '',
        employee: '',
        priority: 'medium',
      });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline || '',
      employee: task.employee?.id || (typeof task.employee === 'number' ? task.employee : ''),
      priority: task.priority || 'medium',
    });

    setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.delete(`tasks/${id}/`);
      toast.success('Task deleted successfully');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.patch(`tasks/${id}/`, { completed_at: true });
      toast.success('Task marked as completed! ');
      fetchTasks();
    } catch (err) {
      toast.error('Cannot complete task');
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setForm({
      title: '',
      description: '',
      deadline: '',
      employee: '',
      priority: 'medium',
    });
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      low: 'bg-green-100 text-green-800 border border-green-300',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
            My Tasks
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            {role === 'employee'
              ? 'Create and manage your personal tasks'
              : 'Assign and manage tasks for employees'}
          </p>

          {/* Form */}
          <div ref={formRef} className="bg-white/95 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Task title"
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Task details..."
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                <input
                  name="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {role !== 'employee' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Employee *</label>
                  <select
                    name="employee"
                    value={form.employee}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.length === 0 ? (
                      <option disabled>No employees available</option>
                    ) : (
                      employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.username} ({emp.first_name} {emp.last_name || ''})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 md:col-span-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-linear-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg text-lg"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>

                {editingTask && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-300 text-gray-800 py-4 rounded-xl font-bold hover:bg-gray-400 transition text-lg"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tasks List */}
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Current Tasks</h2>

          {loading ? (
            <div className="text-center py-16 text-gray-500 animate-pulse text-xl">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 text-gray-600 bg-white/80 rounded-2xl shadow-lg border border-gray-100">
              No tasks yet. Create one above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                        {task.priority && getPriorityBadge(task.priority)}
                      </div>
                      <p className="text-gray-600 line-clamp-2">{task.description || 'No description'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                    <div>
                      Deadline: <span className="font-medium">{task.deadline || 'None'}</span>
                    </div>
                    <div>
                      Status: <span className="font-medium capitalize">{task.status}</span>
                    </div>
                    {task.employee && (
                      <div>
                        Assigned to: <span className="font-medium text-blue-700">
                          {typeof task.employee === 'string' ? task.employee : task.employee?.username || 'Unassigned'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {(role === 'employee' && task.employee?.id === currentUserId) ||
                     role === 'supervisor' || role === 'admin' ? (
                      <>
                        <button
                          onClick={() => handleEdit(task)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(task.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm transition"
                        >
                          Delete
                        </button>
                      </>
                    ) : null}

                    {role === 'employee' && task.status !== 'completed' && (
                      <button
                        onClick={() => handleComplete(task.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm transition"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Tasks;