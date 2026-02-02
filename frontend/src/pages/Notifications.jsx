import { useEffect, useState } from 'react';
import Header from '../components/Header';
import api from '../services/api';
import toast from 'react-hot-toast';

function Notifications() {
  const [alerts, setAlerts] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('notifications/');
      // Extract the alerts array safely
      const receivedAlerts = res.data?.alerts || [];
      setAlerts(receivedAlerts);
      console.log('Loaded alerts:', receivedAlerts);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      toast.error('Could not load notifications');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Notifications & Alerts
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Important reminders, deadlines, and pending actions
        </p>

        {loading ? (
          <div className="text-center py-16 text-gray-500 animate-pulse text-xl">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16 text-gray-600 bg-white/80 rounded-2xl shadow-lg border border-gray-100">
            No pending alerts or notifications right now.
            <br />
            <span className="text-sm mt-2 block text-gray-500">
              Check back later for task deadlines and ratings.
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600 text-xl font-bold">
                      !
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Task Alert
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{typeof alert === 'string' ? alert : alert.message}</p>
                    <p className="text-sm text-gray-500 mt-3">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;