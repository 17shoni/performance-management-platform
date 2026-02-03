import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    role: 'employee',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setErrors({});
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password2) {
      setErrors({ password: ['Passwords do not match.'] });
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      const data = error.response?.data;

      if (data && typeof data === 'object') {
        setErrors(data); // 
      } else {
        setErrors({ general: ['Registration failed.'] });
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Create an Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="username"
            placeholder="Username"
            required
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {errors.username && (
            <p className="text-sm text-red-600">{errors.username[0]}</p>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email[0]}</p>
          )}

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password[0]}</p>
          )}

          <input
            type="password"
            name="password2"
            placeholder="Confirm password"
            required
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              name="first_name"
              placeholder="First name"
              onChange={handleChange}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              name="last_name"
              placeholder="Last name"
              onChange={handleChange}
              className="px-4 py-2 border rounded-lg"
            />
          </div>

          <select
            disabled
            value="employee"
            className="w-full px-4 py-2 border rounded-lg bg-gray-100"
          >
            <option>Employee</option>
          </select>

          {errors.general && (
            <p className="text-sm text-red-600 text-center">
              {errors.general[0]}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold text-white
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
