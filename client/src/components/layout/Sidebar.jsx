import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/problems', icon: '📝', label: 'Problems' },
  { path: '/topics', icon: '📚', label: 'Topics' },
  { path: '/revision', icon: '🔄', label: 'Revision' },
  { path: '/analytics', icon: '📊', label: 'Analytics' },
  { path: '/companies', icon: '🏢', label: 'Companies' },
  { path: '/contests', icon: '🏆', label: 'Contests' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800
                      flex flex-col z-40">

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-lg">
          ⚡
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">DSA Tracker</h1>
          <p className="text-gray-500 text-xs">Placement Prep</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
               ${isActive
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-violet-700 rounded-full flex items-center justify-center
                          text-white text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;