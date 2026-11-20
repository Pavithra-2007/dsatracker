import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import { useAuth } from '../context/useAuth';
import analyticsService from '../services/analyticsService';
import revisionService from '../services/revisionService';
import problemService from '../services/problemService';
import topicService from '../services/topicService';
import goalService from '../services/goalService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [recentProblems, setRecentProblems] = useState([]);
  const [activities, setActivities] = useState([]);
  const [topics, setTopics] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setError(false);
        const [analyticsRes, revisionsRes, problemsRes, heatmapRes, topicsRes, goalsRes] = await Promise.all([
          analyticsService.getAnalytics(),
          revisionService.getRevisions(),
          problemService.getProblems({ limit: 5 }),
          analyticsService.getHeatmap(),
          topicService.getTopics(),
          goalService.getGoals(),
        ]);
        setAnalytics(analyticsRes.data);
        setRevisions(revisionsRes.data || []);
        setRecentProblems(problemsRes.data || []);
        setActivities(heatmapRes.data || []);
        setTopics(topicsRes.data || []);
        setGoals(goalsRes.data || []);
      } catch {
        setError(true);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [reloadKey]);

  const overview = analytics?.overview || {};
  const weeklyActivity = useMemo(() => {
    const counts = new Map(activities.map((item) => [String(item.date).slice(0, 10), item.problemsSolved || 0]));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      const key = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
      return { day: date.toLocaleDateString('en-IN', { weekday: 'short' }), Problems: counts.get(key) || 0 };
    });
  }, [activities]);
  const topTopics = useMemo(() => topics
    .filter((topic) => topic.total > 0)
    .sort((a, b) => b.solved - a.solved || b.total - a.total)
    .slice(0, 5), [topics]);
  const dailyGoal = goals.find((goal) => goal.type === 'daily');

  const difficultyData = [
    { label: 'Easy',   value: overview.easyCount   || 0, color: 'bg-green-500',  text: 'text-green-400'  },
    { label: 'Medium', value: overview.mediumCount  || 0, color: 'bg-yellow-500', text: 'text-yellow-400' },
    { label: 'Hard',   value: overview.hardCount    || 0, color: 'bg-red-500',    text: 'text-red-400'    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !analytics) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <p className="text-white font-semibold">Dashboard data couldn’t load</p>
          <p className="text-gray-400 text-sm mt-1">Check your connection and try again.</p>
          <button onClick={() => { setLoading(true); setReloadKey((key) => key + 1); }}
            className="mt-4 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm">
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">

      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-400 mt-1">Here's your progress summary</p>
        {dailyGoal && (
          <p className="text-gray-500 text-sm mt-2">
            Daily goal: <span className="text-violet-300">{dailyGoal.achieved} / {dailyGoal.target}</span> problems
          </p>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="📝"
          label="Total Problems"
          value={overview.totalProblems || 0}
          color="violet"
        />
        <StatCard
          icon="✅"
          label="Problems Solved"
          value={overview.solvedCount || 0}
          color="green"
        />
        <StatCard
          icon="🔥"
          label="Current Streak"
          value={`${overview.currentStreak || 0} days`}
          sub={`Longest: ${overview.longestStreak || 0} days`}
          color="orange"
        />
        <StatCard
          icon="🔄"
          label="Revision Due"
          value={revisions.length}
          color="blue"
        />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Difficulty Breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Difficulty Breakdown</h3>
          <div className="space-y-4">
            {difficultyData.map((d) => (
              <div key={d.label}>
                <div className="flex justify-between mb-1.5">
                  <span className={`text-sm font-medium ${d.text}`}>{d.label}</span>
                  <span className="text-gray-400 text-sm">{d.value} solved</span>
                </div>
                <ProgressBar
                  value={overview.solvedCount > 0
                    ? (d.value / overview.solvedCount) * 100
                    : 0}
                  color={d.color}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Revision Due */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">
            Revision Due
            {revisions.length > 0 && (
              <span className="ml-2 bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                {revisions.length}
              </span>
            )}
          </h3>
          {revisions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-gray-400 text-sm">No revisions due today!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revisions.slice(0, 4).map((r) => (
                <div key={r._id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {r.problem?.title}
                    </p>
                    <p className="text-gray-500 text-xs">{r.problem?.topic}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg ml-2 flex-shrink-0
                    ${r.problem?.difficulty === 'Easy'   ? 'bg-green-500/20 text-green-400'  : ''}
                    ${r.problem?.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400': ''}
                    ${r.problem?.difficulty === 'Hard'   ? 'bg-red-500/20 text-red-400'      : ''}
                  `}>
                    {r.problem?.difficulty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topic Progress */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Top Topics</h3>
          {topTopics.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📚</p>
              <p className="text-gray-400 text-sm">No problems added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topTopics.map((topic) => (
                <Link key={topic.name} to={`/problems?topic=${encodeURIComponent(topic.name)}`}
                  className="flex items-center justify-between gap-3 group">
                  <span className="text-gray-300 text-sm truncate group-hover:text-white">{topic.name}</span>
                  <span className="text-gray-500 text-xs flex-shrink-0">{topic.solved}/{topic.total}</span>
                </Link>
              ))}
            </div>
          )}
          <Link to="/topics" className="inline-flex mt-4 text-violet-400 hover:text-violet-300 text-xs font-medium">
            Open DSA roadmap →
          </Link>
        </div>

      </div>

      {/* Activity and weekly pace */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-6">
        <section className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5" aria-labelledby="weekly-activity-title">
          <div className="mb-4">
            <h3 id="weekly-activity-title" className="text-white font-semibold">This week</h3>
            <p className="text-gray-500 text-xs mt-1">Problems solved each day</p>
          </div>
          {weeklyActivity.every((item) => item.Problems === 0) ? (
            <div className="h-40 flex items-center justify-center text-gray-500 text-sm">Solve a problem to start your weekly activity.</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} width={24} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#1f2937' }} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 12 }} />
                <Bar dataKey="Problems" fill="#8b5cf6" radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
        <div className="xl:col-span-3">
          <ActivityHeatmap activities={activities} />
        </div>
      </div>

      {/* Recent Problems */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Recent Problems</h3>
        {recentProblems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">➕</p>
            <p className="text-gray-400 text-sm">No problems added yet. Start tracking!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="text-left pb-3 font-medium">Title</th>
                  <th className="text-left pb-3 font-medium">Topic</th>
                  <th className="text-left pb-3 font-medium">Difficulty</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-left pb-3 font-medium">Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentProblems.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-800/50 transition">
                    <td className="py-3 text-white text-sm font-medium">{p.title}</td>
                    <td className="py-3 text-gray-400 text-sm">{p.topic}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-lg
                        ${p.difficulty === 'Easy'   ? 'bg-green-500/20 text-green-400'  : ''}
                        ${p.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400': ''}
                        ${p.difficulty === 'Hard'   ? 'bg-red-500/20 text-red-400'      : ''}
                      `}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-lg
                        ${p.status === 'Solved'        ? 'bg-green-500/20 text-green-400'   : ''}
                        ${p.status === 'Revised'       ? 'bg-blue-500/20 text-blue-400'     : ''}
                        ${p.status === 'Need Revision' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                        ${p.status === 'Not Started'   ? 'bg-gray-500/20 text-gray-400'     : ''}
                      `}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 text-sm">{p.platform}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
};

export default Dashboard;
