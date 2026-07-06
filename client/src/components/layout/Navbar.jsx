import { useAuth } from '../../context/AuthContext';

const Navbar = ({ title = 'Dashboard' }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center
                       justify-between px-6 sticky top-0 z-30">
      <h2 className="text-white font-semibold text-lg">{title}</h2>

      <div className="flex items-center gap-4">
        {/* Streak badge */}
        {user?.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20
                          px-3 py-1.5 rounded-lg">
            <span className="text-sm">🔥</span>
            <span className="text-orange-400 text-sm font-semibold">
              {user.currentStreak} day streak
            </span>
          </div>
        )}

        {/* Avatar */}
        <div className="w-8 h-8 bg-violet-700 rounded-full flex items-center justify-center
                        text-white text-sm font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Navbar;