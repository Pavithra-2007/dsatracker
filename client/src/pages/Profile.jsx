import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProgressBar from '../components/ui/ProgressBar';
import CodingProfiles from '../components/profile/CodingProfiles';
import LeetCodeSync from '../components/profile/LeetCodeSync';
import { useAuth } from '../context/AuthContext';
import goalService from '../services/goalService';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const ACHIEVEMENTS = [
  { icon: '🥇', label: 'First Problem',  desc: 'Solved first problem',    check: (u) => u.totalProblems >= 1   },
  { icon: '💪', label: '10 Problems',    desc: 'Solved 10 problems',       check: (u) => u.totalProblems >= 10  },
  { icon: '🚀', label: '50 Problems',    desc: 'Solved 50 problems',       check: (u) => u.totalProblems >= 50  },
  { icon: '💯', label: '100 Problems',   desc: 'Solved 100 problems',      check: (u) => u.totalProblems >= 100 },
  { icon: '🔥', label: '7 Day Streak',   desc: '7 consecutive days',       check: (u) => u.longestStreak >= 7   },
  { icon: '⚡', label: '30 Day Streak',  desc: '30 consecutive days',      check: (u) => u.longestStreak >= 30  },
];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [goals, setGoals]             = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [editMode, setEditMode]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [profileForm, setProfileForm] = useState({
    name:   user?.name   || '',
    avatar: user?.avatar || '',
  });
  const [goalForm, setGoalForm] = useState({
    daily:   user?.settings?.dailyGoal   || 3,
    weekly:  user?.settings?.weeklyGoal  || 15,
    monthly: user?.settings?.monthlyGoal || 60,
  });

  useEffect(() => {
    goalService.getGoals()
      .then((res) => setGoals(res.data || []))
      .catch(() => toast.error('Failed to load goals'))
      .finally(() => setGoalsLoading(false));
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

  const inputClass = `w-full bg-gray-800/80 border border-gray-700 text-white rounded-xl
    px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none
    focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition`;

  return (
    <DashboardLayout title="Profile">

      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Profile</h2>
        <p className="text-gray-400 text-sm mt-1">Manage your account, goals and coding profiles</p>
      </div>

      {/* ── Row 1: Avatar card + Stats ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">

        {/* Avatar Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-violet-900/40 to-gray-900
                        border border-violet-500/20 rounded-2xl p-6 flex flex-col
                        items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500
                            to-violet-800 flex items-center justify-center
                            text-3xl font-bold text-white shadow-lg shadow-violet-500/20">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar"
                    className="w-full h-full rounded-full object-cover" />
                : user?.name?.charAt(0).toUpperCase()
              }
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500
                            rounded-full border-2 border-gray-950 flex items-center
                            justify-center">
              <span className="text-xs">✓</span>
            </div>
          </div>

          <h3 className="text-white font-bold text-lg leading-tight">{user?.name}</h3>
          <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
          <p className="text-gray-600 text-xs mt-2">Member since {joinedDate}</p>

          {/* Edit toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className="mt-4 w-full bg-gray-800 hover:bg-gray-700 border border-gray-700
                       text-gray-300 text-sm font-medium py-2 rounded-xl transition"
          >
            {editMode ? 'Cancel' : '✏️ Edit Profile'}
          </button>

          {/* Edit form */}
          {editMode && (
            <div className="w-full mt-3 space-y-3 text-left">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name</label>
                <input value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Avatar URL</label>
                <input value={profileForm.avatar}
                  onChange={(e) => setProfileForm((p) => ({ ...p, avatar: e.target.value }))}
                  placeholder="https://..." className={inputClass} />
              </div>
              <button onClick={handleProfileSave} disabled={saving}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50
                           text-white text-sm font-medium py-2.5 rounded-xl transition">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Problems', value: user?.totalProblems || 0,
              icon: '📝', color: 'text-white',        bg: 'from-gray-800 to-gray-900'              },
            { label: 'Current Streak', value: `${user?.currentStreak || 0}d`,
              icon: '🔥', color: 'text-orange-400',   bg: 'from-orange-900/30 to-gray-900'         },
            { label: 'Best Streak',    value: `${user?.longestStreak || 0}d`,
              icon: '⚡', color: 'text-yellow-400',   bg: 'from-yellow-900/20 to-gray-900'         },
            { label: 'Daily Goal',     value: `${user?.settings?.dailyGoal || 3}/day`,
              icon: '📅', color: 'text-blue-400',     bg: 'from-blue-900/20 to-gray-900'           },
            { label: 'Weekly Goal',    value: `${user?.settings?.weeklyGoal || 15}/wk`,
              icon: '📆', color: 'text-violet-400',   bg: 'from-violet-900/20 to-gray-900'         },
            { label: 'Monthly Goal',   value: `${user?.settings?.monthlyGoal || 60}/mo`,
              icon: '🗓️', color: 'text-green-400',    bg: 'from-green-900/20 to-gray-900'          },
          ].map((s) => (
            <div key={s.label}
              className={`bg-gradient-to-br ${s.bg} border border-gray-800
                          rounded-2xl p-4 flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 2: Goals + Achievements ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Set Goals */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🎯 Goals</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { key: 'daily',   label: 'Daily',   icon: '📅' },
              { key: 'weekly',  label: 'Weekly',  icon: '📆' },
              { key: 'monthly', label: 'Monthly', icon: '🗓️' },
            ].map(({ key, label, icon }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1.5">{icon} {label}</label>
                <input type="number" value={goalForm[key]}
                  onChange={(e) => setGoalForm((p) => ({ ...p, [key]: e.target.value }))}
                  min="1" className={inputClass} />
              </div>
            ))}
          </div>

          {/* Goal Progress */}
          <div className="space-y-3 mb-4">
            {goalsLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent
                                rounded-full animate-spin" />
              </div>
            ) : goals.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-3">
                Update goals to track progress
              </p>
            ) : (
              goals.map((g) => {
                const pct = g.target > 0
                  ? Math.min(Math.round((g.achieved / g.target) * 100), 100) : 0;
                const color =
                  pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-violet-500' : 'bg-yellow-500';
                const label =
                  g.type === 'daily' ? '📅 Daily' :
                  g.type === 'weekly' ? '📆 Weekly' : '🗓️ Monthly';
                return (
                  <div key={g.type || g._id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-300 text-xs font-medium">{label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 text-xs">{g.achieved}/{g.target}</span>
                        <span className={`text-xs font-bold ${
                          pct >= 100 ? 'text-green-400' :
                          pct >= 50  ? 'text-violet-400' : 'text-yellow-400'
                        }`}>{pct}%</span>
                        {g.isCompleted && <span className="text-green-400 text-xs">✅</span>}
                      </div>
                    </div>
                    <ProgressBar value={pct} color={color} height="h-1.5" />
                  </div>
                );
              })
            )}
          </div>

          <button onClick={handleGoalSave} disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50
                       text-white text-sm font-semibold py-2.5 rounded-xl transition">
            {saving ? 'Saving...' : 'Update Goals'}
          </button>
        </div>

        {/* Achievements */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🏆 Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = user ? a.check(user) : false;
              return (
                <div key={a.label}
                  className={`p-3 rounded-xl border text-center transition ${
                    unlocked
                      ? 'bg-gradient-to-br from-violet-900/40 to-gray-900 border-violet-500/30'
                      : 'bg-gray-800/30 border-gray-800 opacity-40'
                  }`}>
                  <p className={`text-2xl mb-1.5 ${unlocked ? '' : 'grayscale'}`}>{a.icon}</p>
                  <p className={`text-xs font-semibold ${unlocked ? 'text-white' : 'text-gray-500'}`}>
                    {a.label}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">{a.desc}</p>
                  {unlocked && (
                    <span className="inline-block mt-1.5 text-xs bg-violet-500/20
                                     text-violet-400 px-1.5 py-0.5 rounded">
                      Unlocked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Coding Profiles ───────────────────────────────────── */}
      <div className="mb-4">
        <CodingProfiles user={user} updateUser={updateUser} />
      </div>

      {/* ── Row 4: LeetCode Sync ─────────────────────────────────────── */}
      <div>
        <LeetCodeSync
          savedUsername={user?.codingProfiles?.leetcode?.username || ''}
          onSynced={() => window.location.reload()}
        />
      </div>

    </DashboardLayout>
  );
};

export default Profile;