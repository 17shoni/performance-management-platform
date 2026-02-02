import { Link } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

function Header() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('notifications/?unread=true');
        setUnreadCount(res.data.count || 0);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchUnread();
    // refreshes every 60 seconds
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.removeItem('accessToken');
    toast.success('Logged out successfully! ');
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-linear-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* logo */}
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="text-4xl font-extrabold tracking-tight">
            <span className="text-red-400">K</span>
            <span className="text-white">ONVERGENZ</span>
          </div>
          <span className="text-sm font-medium opacity-90 hidden md:inline">Performance Management System</span>
        </Link>

        {/* notifications and logout */}
        <div className="flex items-center space-x-6">
          <Link to="/notifications" className="relative group">
            <BellIcon className="h-7 w-7 text-white hover:text-blue-200 transition" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <button
            onClick={logout}
            className="bg-red-500/90 hover:bg-red-600 px-5 py-2 rounded-lg font-medium transition transform hover:scale-105 text-sm md:text-base"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;