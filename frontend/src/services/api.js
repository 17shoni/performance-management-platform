import axios from 'axios';

// const api = axios.create({
//   baseURL: 'https://performance-management-platform-production.up.railway.app/api/', 
//   // baseURL: 'http://127.0.0.1:8000/api/',
// });

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// login function
export const login = (username, password) =>
  api.post('token/', { username, password }).then((res) => {
    localStorage.setItem('accessToken', res.data.access);
    return res.data;
  });

export const register = (data) =>
  api.post('register/', data).then((res) => res.data);

// to decode JWT and get role
export const getRoleFromToken = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null; 
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
};

export const getCurrentUserId = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id; 
  } catch (e) {
    return null;
  }
};

export const clockIn = () => api.post('clock-in/');
export const clockOut = () => api.post('clock-out/');

export const getTasks = () => api.get('tasks/');
export const createTask = (data) => api.post('tasks/', data);
export const completeTask = (id) => api.patch(`tasks/${id}/`, { completed_at: true });

export const createRating = (data) => api.post('ratings/', data);

export const getReports = () => api.get('reports/');
export const getNotifications = () => api.get('notifications/');

export const getUsers = () => api.get('users/');
export const createUser = (data) => api.post('users/', data);

export default api;