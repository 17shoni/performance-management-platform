import { useEffect, useState } from 'react';
import Header from '../components/Header';
import api from '../services/api';
import toast from 'react-hot-toast';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
    supervisor: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchSupervisors();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('users/');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await api.get('users/');
      const sups = res.data.filter(u => u.role === 'supervisor');
      setSupervisors(sups);
    } catch (err) {
      console.error('Failed to load supervisors', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form };
      if (form.role !== 'employee') {
        delete payload.supervisor;
      }
      await api.post('users/', payload);
      toast.success('User created successfully 🎉');
      setForm({
        username: '',
        email: '',
        password: '',
        role: 'employee',
        supervisor: '',
      });
      fetchUsers();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const firstError = Object.values(data)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error('Failed to create user');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`users/${id}/`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Users (Admin)</h1>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New User</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              name="username"
              placeholder="Username *"
              value={form.username}
              onChange={handleChange}
              className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={creating}
            />
            <input
              name="email"
              type="email"
              placeholder="Email *"
              value={form.email}
              onChange={handleChange}
              className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={creating}
            />
            <input
              name="password"
              type="password"
              placeholder="Password *"
              value={form.password}
              onChange={handleChange}
              className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={creating}
            />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={creating}
            >
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>

            {form.role === 'employee' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Supervisor (optional)
                </label>
                <select
                  name="supervisor"
                  value={form.supervisor}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={creating}
                >
                  <option value="">No Supervisor</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.username} ({sup.first_name} {sup.last_name || ''})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className={`md:col-span-2 py-4 rounded-xl font-bold transition text-white ${
                creating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg'
              }`}
            >
              {creating ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  Creating...
                </div>
              ) : (
                'Create User'
              )}
            </button>
          </form>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-gray-800">All Users</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500 animate-pulse">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
            No users yet. Create one above!
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Username</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Supervisor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{user.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'supervisor'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {user.supervisor ? user.supervisor.username : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg text-xs transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;