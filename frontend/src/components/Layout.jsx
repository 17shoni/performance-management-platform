import { Link, Outlet } from 'react-router-dom';

function Layout({ role }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
      <div className="h-20"></div>

      <div className="flex">
        {/* sidebar */}
        <aside className="w-72 bg-white shadow-2xl h-screen p-8 fixed overflow-y-auto">
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900">Menu</h3>
            <p className="text-sm text-gray-600 mt-2">Logged in as <span className="font-semibold capitalize">{role}</span></p>
          </div>

          <nav>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/dashboard"
                  className="flex items-center p-4 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition font-medium text-lg"
                >
                  🏠 Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/attendance"
                  className="flex items-center p-4 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition font-medium text-lg"
                >
                  ⏰ Attendance
                </Link>
              </li>
              <li>
                <Link
                  to="/tasks"
                  className="flex items-center p-4 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition font-medium text-lg"
                >
                  📋 Tasks
                </Link>
              </li>
              <li>
                <Link
                  to="/notifications"
                  className="flex items-center p-4 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition font-medium text-lg"
                >
                  🔔 Notifications
                </Link>
              </li>

              {(role === 'supervisor' || role === 'admin') && (
                <li>
                  <Link
                    to="/ratings"
                    className="flex items-center p-4 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition font-medium text-lg"
                  >
                    ⭐ Rate Tasks
                  </Link>
                </li>
              )}

              {role === 'admin' && (
                <li>
                  <Link
                    to="/admin-users"
                    className="flex items-center p-4 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition font-medium text-lg"
                  >
                    👥 Manage Users
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 ml-72 p-8 pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;