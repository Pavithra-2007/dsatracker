import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProgressBar from '../components/ui/ProgressBar';
import { useAuth } from '../context/AuthContext';
import goalService from '../services/goalService';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import CodingProfiles from '../components/profile/CodingProfiles';
import LeetCodeSync from '../components/profile/LeetCodeSync';
const Profile = () => {
  const { user, updateUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    avatar: user?.avatar || '',
  });
  const [goalForm, setGoalForm] = useState({
    daily: user?.settings?.dailyGoal || 3,
    weekly: user?.settings?.weeklyGoal || 15,
    monthly: user?.settings?.monthlyGoal || 60,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await goalService.getGoals();
        setGoals(res.data || []);
      } catch {
        toast.error('Failed to load goals');
      } finally {
        setGoalsLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const res = await authService.updateProfile(profileForm);
      updateUser(res.data);
      toast.success('Profile updated!');
      setEditMode(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleGoalSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        goalService.setGoal({ type: 'daily',   target: Number(goalForm.daily)   }),
        goalService.setGoal({ type: 'weekly',  target: Number(goalForm.weekly)  }),
        goalService.setGoal({ type: 'monthly', target: Number(goalForm.monthly) }),
      ]);

      // Also update settings on user
      await authService.updateProfile({
        settings: {
          dailyGoal:   Number(goalForm.daily),
          weeklyGoal:  Number(goalForm.weekly),
          monthlyGoal: Number(goalForm.monthly),
        },
      });

      toast.success('Goals updated!');

      const res = await goalService.getGoals();
      setGoals(res.data || []);
    } catch {
      toast.error('Failed to update goals');
    } finally {
      setSaving(false);
    }
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'N/A';

  const inputClass = `w-full bg-gray-800 border border-gray-700 text-white rounded-xl
    px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none
    focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition`;

  return (
    <DashboardLayout title="Profile">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Profile</h2>
        <p className="text-gray-400 text-sm mt-1">
          Manage your account and goals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Profile Card */}
        <div className="lg:col-span-1 space-y-4">

          {/* Avatar + Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 bg-violet-700 rounded-full flex items-center
                            justify-center text-3xl font-bold text-white mx-auto mb-4">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-white font-bold text-lg">{user?.name}</h3>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
            <p className="text-gray-600 text-xs mt-2">Joined {joinedDate}</p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-orange-400 text-xl font-bold">
                  {user?.currentStreak || 0}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">Current Streak</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-violet-400 text-xl font-bold">
                  {user?.longestStreak || 0}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">Best Streak</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 col-span-2">
                <p className="text-green-400 text-xl font-bold">
                  {user?.totalProblems || 0}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">Total Problems</p>
              </div>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Edit Profile</h3>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-violet-400 hover:text-violet-300 text-sm transition"
              >
                {editMode ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editMode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Name</label>
                  <input
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Avatar URL
                  </label>
                  <input
                    value={profileForm.avatar}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, avatar: e.target.value }))
                    }
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
                <button
                  onClick={handleProfileSave}
                  disabled={saving}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50
                             text-white text-sm font-medium py-2.5 rounded-xl transition"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Name</span>
                  <span className="text-white text-sm">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Email</span>
                  <span className="text-white text-sm">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Theme</span>
                  <span className="text-white text-sm capitalize">
                    {user?.settings?.theme || 'dark'}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right — Goals */}
        <div className="lg:col-span-2 space-y-4">

          {/* Set Goals */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Set Goals</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { key: 'daily',   label: 'Daily Goal',   icon: '📅' },
                { key: 'weekly',  label: 'Weekly Goal',  icon: '📆' },
                { key: 'monthly', label: 'Monthly Goal', icon: '🗓️' },
              ].map(({ key, label, icon }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    {icon} {label}
                  </label>
                  <input
                    type="number"
                    value={goalForm[key]}
                    onChange={(e) =>
                      setGoalForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                    min="1"
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleGoalSave}
              disabled={saving}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50
                         text-white text-sm font-semibold py-2.5 rounded-xl transition"
            >
              {saving ? 'Saving...' : 'Update Goals'}
            </button>
          </div>

          {/* Goal Progress */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Goal Progress</h3>

            {goalsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent
                                rounded-full animate-spin" />
              </div>
            ) : goals.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                Set goals above to track your progress
              </p>
            ) : (
              <div className="space-y-5">
                {goals.map((g) => {
                  const pct = g.target > 0
                    ? Math.min(Math.round((g.achieved / g.target) * 100), 100)
                    : 0;

                  const color =
                    pct >= 100 ? 'bg-green-500'  :
                    pct >= 50  ? 'bg-violet-500' :
                    'bg-yellow-500';

                  const label =
                    g.type === 'daily'   ? '📅 Daily'   :
                    g.type === 'weekly'  ? '📆 Weekly'  :
                    '🗓️ Monthly';

                  return (
                    <div key={g.type || g._id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm font-medium">
                          {label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">
                            {g.achieved}/{g.target}
                          </span>
                          <span className={`text-xs font-semibold ${
                            pct >= 100 ? 'text-green-400' :
                            pct >= 50  ? 'text-violet-400' :
                            'text-yellow-400'
                          }`}>
                            {pct}%
                          </span>
                          {g.isCompleted && (
                            <span className="text-green-400 text-xs">✅</span>
                          )}
                        </div>
                      </div>
                      <ProgressBar value={pct} color={color} height="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Achievements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: '🥇', label: 'First Problem',
                  desc: 'Solved your first problem',
                  unlocked: (user?.totalProblems || 0) >= 1,
                },
                {
                  icon: '💪', label: '10 Problems',
                  desc: 'Solved 10 problems',
                  unlocked: (user?.totalProblems || 0) >= 10,
                },
                {
                  icon: '🚀', label: '50 Problems',
                  desc: 'Solved 50 problems',
                  unlocked: (user?.totalProblems || 0) >= 50,
                },
                {
                  icon: '💯', label: '100 Problems',
                  desc: 'Solved 100 problems',
                  unlocked: (user?.totalProblems || 0) >= 100,
                },
                {
                  icon: '🔥', label: '7 Day Streak',
                  desc: '7 consecutive days',
                  unlocked: (user?.longestStreak || 0) >= 7,
                },
                {
                  icon: '⚡', label: '30 Day Streak',
                  desc: '30 consecutive days',
                  unlocked: (user?.longestStreak || 0) >= 30,
                },
              ].map((a) => (
                <div
                  key={a.label}
                  className={`p-4 rounded-xl border text-center transition ${
                    a.unlocked
                      ? 'bg-violet-500/10 border-violet-500/30'
                      : 'bg-gray-800/50 border-gray-800 opacity-40'
                  }`}
                >
                  <p className="text-2xl mb-1">{a.icon}</p>
                  <p className={`text-xs font-semibold ${
                    a.unlocked ? 'text-white' : 'text-gray-500'
                  }`}>
                    {a.label}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
        {/* Coding Profiles */}
<div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
  <h3 className="text-white font-semibold mb-4">🖥️ Coding Profiles</h3>
  <p className="text-gray-500 text-xs mb-4">
    Save your handles so we can auto-link your profiles in future.
  </p>
  <CodingProfiles user={user} updateUser={updateUser} />
  {/* LeetCode Sync */}
<LeetCodeSync
  savedUsername={user?.codingProfiles?.leetcode?.username || ''}
  onSynced={() => window.location.reload()}
/>
</div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;