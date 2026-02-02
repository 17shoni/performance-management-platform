import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getRoleFromToken } from '../services/api';
import toast from 'react-hot-toast';

function Login({ setRole }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [logoutMsg, setLogoutMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const msg = localStorage.getItem('logoutMessage');
    if (msg) {
      setLogoutMsg(msg);
      localStorage.removeItem('logoutMessage');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      const userRole = getRoleFromToken();
      if (userRole) setRole(userRole);

      toast.success('Login successful');
      navigate('/dashboard');
    } catch (err) {
      const backendError =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid username or password';
      setError(backendError);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white/50">
        <div className="text-center mb-8">
          <div className="text-5xl font-extrabold tracking-tight">
            <span className="text-red-500">K</span>
            <span className="text-blue-600">ONVERGENZ</span>
          </div>
          <p className="text-lg text-gray-700 mt-2 font-medium">
            Soft Development Challenge
          </p>
        </div>

        {logoutMsg && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            {logoutMsg}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 text-sm text-gray-500"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold"
          >
            Sign In
          </button>
        </form>

        {/* 👇 NEW: Register link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Register as Employee
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
