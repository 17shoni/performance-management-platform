import { useEffect, useState } from 'react';
import Header from '../components/Header';
import api from '../services/api';

function Attendance({ role }) {
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]); // for sup/admin list
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === 'employee') {
      fetchOwnAttendance();
    } else {
      fetchEmployees();
    }
  }, [role]);

  // attendance for employee
  const fetchOwnAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('attendance/');
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to fetch own attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // get current user's ID and role details
      const meRes = await api.get('me/');
      const currentUserId = meRes.data.id;

      const usersRes = await api.get('users/');
      let filtered = usersRes.data.filter(u => u.role === 'employee');

      if (role === 'supervisor') {
        // filter employees assigned to this supervisor
        filtered = filtered.filter(u => u.supervisor === currentUserId);
      }

      setEmployees(filtered);
    } catch (err) {
      console.error('Failed to load employees or user info:', err);
    } finally {
      setLoading(false);
    }
  };

  // enables supervisor or admin to load attendance for specific employee
  const fetchEmployeeAttendance = async (empId) => {
    setLoading(true);
    try {
      const res = await api.get(`attendance/?employee=${empId}`);
      setHistory(res.data || []);
      setSelectedEmployee(empId);
    } catch (err) {
      console.error('Failed to load employee attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clock in applies to only employee
  const handleClockIn = async () => {
    try {
      await api.post('clock-in/');
      setMessage('Clocked in successfully! 🎉');
      fetchOwnAttendance();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Already clocked in today');
    }
  };

  // Clock out applies to only employee
  const handleClockOut = async () => {
    try {
      await api.post('clock-out/');
      setMessage('Clocked out successfully! ');
      fetchOwnAttendance();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'No active clock-in found');
    }
  };

  const backToList = () => {
    setSelectedEmployee(null);
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          {role === 'employee' ? 'My Attendance' :
           selectedEmployee ? 'Employee Attendance' : 'Team / Company Attendance'}
        </h1>

        <p className="text-lg text-gray-600 mb-10">
          {role === 'employee' ? 'Track your daily clock-ins and hours worked' :
           selectedEmployee ? 'Viewing attendance for selected employee' :
           role === 'supervisor' ? 'View and monitor your team\'s attendance' :
           'View and manage attendance for all employees'}
        </p>

        {/* clock in and out buttons only visible to employees */}
        {role === 'employee' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <button
              onClick={handleClockIn}
              className="group relative bg-linear-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold py-16 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <span className="relative z-10">Clock In Now</span>
            </button>

            <button
              onClick={handleClockOut}
              className="group relative bg-linear-to-r from-red-500 to-rose-600 text-white text-2xl font-bold py-16 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-red-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <span className="relative z-10">Clock Out Now</span>
            </button>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`text-center text-lg font-medium mb-8 p-4 rounded-xl ${
            message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* for supervisor & admin only when not viewing one employee */}
        {!selectedEmployee && role !== 'employee' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {role === 'admin' ? 'All Employees' : 'Your Team'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.length === 0 ? (
                <p className="text-gray-500 col-span-full text-center py-8">No employees found</p>
              ) : (
                employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => fetchEmployeeAttendance(emp.id)}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-2xl hover:border-blue-300 cursor-pointer transition-all duration-300 flex items-center space-x-4"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                      {emp.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {emp.full_name || emp.username}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {emp.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* attendance history */}
        <div className="card">
          <div className="p-6 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedEmployee ? 'Attendance History' : 'Your Attendance History'}
              </h2>
              {selectedEmployee && (
                <button
                  onClick={backToList}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                >
                  Back to List
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500 animate-pulse">Loading records...</div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No attendance records found</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((record) => (
                <div key={record.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Clock In: {new Date(record.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {record.clock_out && (
                          <> • Clock Out: {new Date(record.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${record.hours_worked ? 'text-green-600' : 'text-orange-600'}`}>
                        {record.hours_worked ? `${record.hours_worked} hrs` : 'Active'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Attendance;