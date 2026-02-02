import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import api from '../services/api';

function Dashboard({ role }) {
  const [data, setData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null); // for viewed employee
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const viewedEmployeeId = new URLSearchParams(location.search).get('employee');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = 'reports/';
        if (viewedEmployeeId && (role === 'supervisor' || role === 'admin')) {
          url += `?employee=${viewedEmployeeId}`;
        }

        const res = await api.get(url);
        if (viewedEmployeeId) {
          setEmployeeData(res.data);
        } else {
          setData(res.data);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [viewedEmployeeId, role]);

  const viewEmployee = (empId) => {
    navigate(`/dashboard?employee=${empId}`);
  };

  const backToOverview = () => {
    navigate('/dashboard');
  };

  if (loading) return <div className="p-10 text-center text-xl animate-pulse">Loading...</div>;
  if (error) return <div className="p-10 text-center text-red-600 text-xl">{error}</div>;

  const displayData = viewedEmployeeId ? employeeData : data;
  const isViewingOther = !!viewedEmployeeId;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              {isViewingOther ? `${displayData?.full_name || 'Employee'}'s Dashboard` : 'Performance Dashboard'}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              {role === 'employee' ? 'Your personal performance overview' :
               role === 'supervisor' ? 'Your team performance overview' :
               'Company-wide performance overview'}
            </p>
          </div>

          {isViewingOther && (
            <button
              onClick={backToOverview}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Back to Overview
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Attendance Rate</h3>
            <p className="text-6xl font-bold text-green-600">
              {displayData?.attendance_percent || 0}%
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">On-time Tasks</h3>
            <p className="text-6xl font-bold text-blue-600">
              {displayData?.on_time_percent || 0}%
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Average Rating</h3>
            <p className="text-6xl font-bold text-purple-600">
              {displayData?.average_rating || 0} / 5
            </p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-lg text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">Total Tasks:</span>{' '}
              {displayData?.total_tasks || 0}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Completed Tasks:</span>{' '}
              {displayData?.completed_tasks || 0}
            </p>
          </div>
        </div>

        {/* employee list for Supervisor and Admin  */}
        {!isViewingOther && (role === 'supervisor' || role === 'admin') && data?.employees?.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              {role === 'admin' ? 'All Employees' : 'Your Team'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.employees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => viewEmployeeDashboard(emp.id)}
                  className="group bg-linear-to-br from-white to-blue-50 p-6 rounded-2xl shadow-lg border border-blue-100 hover:shadow-2xl hover:border-blue-300 cursor-pointer transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition mb-4">
                    {emp.full_name || emp.username}
                  </h3>

                  <div className="space-y-3 text-gray-700">
                    <p className="flex items-center">
                      <span className="w-32 font-medium">Attendance:</span>
                      <span className="font-bold text-green-600">{emp.attendance_percent}%</span>
                    </p>
                    <p className="flex items-center">
                      <span className="w-32 font-medium">On-time:</span>
                      <span className="font-bold text-blue-600">{emp.on_time_percent}%</span>
                    </p>
                    <p className="flex items-center">
                      <span className="w-32 font-medium">Avg Rating:</span>
                      <span className="font-bold text-purple-600">{emp.average_rating} / 5</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-4">
                      Tasks: <strong>{emp.total_tasks}</strong> • Completed: <strong>{emp.completed_tasks}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;