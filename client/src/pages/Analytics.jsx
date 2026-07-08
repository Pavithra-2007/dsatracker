import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import analyticsService from '../services/analyticsService';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart,
  Line, Legend,
} from 'recharts';

// ── Color Palettes ────────────────────────────────────────────────────────────
const DIFFICULTY_COLORS = {
  Easy:   '#22c55e',
  Medium: '#eab308',
  Hard:   '#ef4444',
};

const TOPIC_COLORS = [
  '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',
  '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe',
  '#7c3aed', '#6d28d9',
];

const PLATFORM_COLORS = [
  '#f97316', '#3b82f6', '#22c55e',
  '#eab308', '#ec4899', '#06b6d4', '#8b5cf6',
];

// ── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm shadow-xl">
      {label && <p className="text-gray-400 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill }} className="font-semibold">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

// ── Section Wrapper ────────────────────────────────────────────────────────
const ChartCard = ({ title, children, className = '' }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 ${className}`}>
    <h3 className="text-white font-semibold mb-5">{title}</h3>
    {children}
  </div>
);

// ── Stat Mini Card ─────────────────────────────────────────────────────────
const MiniStat = ({ label, value, color = 'text-white' }) => (
  <div className="bg-gray-800 rounded-xl p-4 text-center">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-gray-400 text-xs mt-1">{label}</p>
  </div>
);

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await analyticsService.getAnalytics();
        setData(res.data);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent
                          rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { overview, byTopic, byDifficulty, byPlatform, byCompany, monthly, weekly, contestHistory } = data;

  // ── Format monthly data ──────────────────────────────────────────────────
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyFormatted = (monthly || []).map((m) => ({
    name: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
    Problems: m.count,
  }));

  // ── Format difficulty data ────────────────────────────────────────────────
  const difficultyFormatted = (byDifficulty || []).map((d) => ({
    name: d._id,
    Total: d.total,
    Solved: d.solved,
  }));

  // ── Format topic data (top 10) ────────────────────────────────────────────
  const topicFormatted = (byTopic || []).slice(0, 10).map((t) => ({
    name: t._id,
    count: t.count,
  }));

  // ── Format platform pie ───────────────────────────────────────────────────
  const platformFormatted = (byPlatform || []).map((p) => ({
    name: p._id,
    value: p.count,
  }));

  // ── Format company data (top 8) ───────────────────────────────────────────
  const companyFormatted = (byCompany || []).slice(0, 8).map((c) => ({
    name: c._id,
    count: c.count,
  }));

  // ── Format contest rating ──────────────────────────────────────────────────
  const contestFormatted = (contestHistory || [])
    .filter((c) => c.ratingAfter)
    .map((c) => ({
      name: c.name,
      Rating: c.ratingAfter,
      Change: c.ratingChange,
    }));

  return (
    <DashboardLayout title="Analytics">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-gray-400 text-sm mt-1">Your complete DSA progress breakdown</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <MiniStat label="Total"          value={overview?.totalProblems || 0} color="text-white"        />
        <MiniStat label="Solved"         value={overview?.solvedCount   || 0} color="text-green-400"   />
        <MiniStat label="Easy"           value={overview?.easyCount     || 0} color="text-green-400"   />
        <MiniStat label="Medium"         value={overview?.mediumCount   || 0} color="text-yellow-400"  />
        <MiniStat label="Hard"           value={overview?.hardCount     || 0} color="text-red-400"     />
        <MiniStat label="Streak"         value={`${overview?.currentStreak || 0}d`} color="text-orange-400" />
        <MiniStat label="Best Streak"    value={`${overview?.longestStreak || 0}d`} color="text-violet-400" />
      </div>

      {/* Row 1: Monthly Progress + Difficulty */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Monthly Progress */}
        <ChartCard title="Monthly Progress" className="lg:col-span-2">
          {monthlyFormatted.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              No data yet — solve some problems!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyFormatted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Problems" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Difficulty Breakdown */}
        <ChartCard title="By Difficulty">
          {difficultyFormatted.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={difficultyFormatted} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                <Bar dataKey="Total"  fill="#374151"  radius={[0, 4, 4, 0]} />
                <Bar dataKey="Solved" radius={[0, 4, 4, 0]}
                  fill="#22c55e"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>

      {/* Row 2: Topics Bar + Platform Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Topics */}
        <ChartCard title="Top Topics (Solved)" className="lg:col-span-2">
          {topicFormatted.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topicFormatted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {topicFormatted.map((_, i) => (
                    <Cell key={i} fill={TOPIC_COLORS[i % TOPIC_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Platform Pie */}
        <ChartCard title="By Platform">
          {platformFormatted.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              No data yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={platformFormatted}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {platformFormatted.map((_, i) => (
                      <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="space-y-1.5 mt-2">
                {platformFormatted.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: PLATFORM_COLORS[i % PLATFORM_COLORS.length] }}
                      />
                      <span className="text-gray-400 text-xs">{p.name}</span>
                    </div>
                    <span className="text-white text-xs font-semibold">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

      </div>

      {/* Row 3: Company Bar + Contest Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Company */}
        <ChartCard title="By Company">
          {companyFormatted.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              Tag problems with companies to see data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={companyFormatted} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Contest Rating */}
        <ChartCard title="Contest Rating History">
          {contestFormatted.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              Add contests to see rating history
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={contestFormatted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="Rating"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ fill: '#7c3aed', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>

      {/* Weekly Progress */}
      <ChartCard title="Weekly Progress (Last 8 Weeks)">
        {(weekly || []).length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
            No weekly data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={(weekly || []).map((w) => ({
              name: `Week ${w._id}`,
              Problems: w.count,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Problems" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

    </DashboardLayout>
  );
};

export default Analytics;