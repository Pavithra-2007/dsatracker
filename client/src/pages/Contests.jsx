import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import contestService from '../services/contestService';
import syncService from '../services/syncService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const PLATFORMS = ['LeetCode', 'Codeforces', 'CodeChef', 'AtCoder', 'HackerRank', 'Other'];

const defaultForm = {
  name: '', platform: 'LeetCode', rank: '',
  solved: '', totalProblems: '', ratingChange: '',
  ratingAfter: '', date: '', notes: '',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-300 font-medium mb-1 truncate max-w-48">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }} className="font-bold text-base">
          Rating: {e.value}
        </p>
      ))}
    </div>
  );
};

const Contests = () => {
  const { user } = useAuth();
  const [contests, setContests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [syncing, setSyncing]         = useState(false);
  const [syncResult, setSyncResult]   = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [editContest, setEditContest] = useState(null);
  const [form, setForm]               = useState(defaultForm);
  const [activeTab, setActiveTab]     = useState('all');

  const fetchContests = async () => {
    try {
      const res = await contestService.getContests();
      setContests(res.data || []);
    } catch {
      toast.error('Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContests(); }, []);

  // ── Sync from LeetCode ──────────────────────────────────────────────────
  const handleSync = async () => {
    const username = user?.codingProfiles?.leetcode?.username;
    if (!username) {
      toast.error('Save your LeetCode username in Profile first');
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await syncService.syncContests(username);
      const data = res.data;
      setSyncResult(data);

      if (data.imported > 0) {
        toast.success(`✅ ${data.imported} contests imported!`);
        fetchContests();
      } else {
        toast.success('Already up to date!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const openAdd = () => {
    setEditContest(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (contest) => {
    setEditContest(contest);
    setForm({
      ...contest,
      date: contest.date ? new Date(contest.date).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Contest name is required'); return; }
    setFormLoading(true);
    try {
      const payload = {
        ...form,
        rank:          Number(form.rank)          || null,
        solved:        Number(form.solved)        || 0,
        totalProblems: Number(form.totalProblems) || 0,
        ratingChange:  Number(form.ratingChange)  || 0,
        ratingAfter:   Number(form.ratingAfter)   || null,
      };
      if (editContest) {
        await contestService.updateContest(editContest._id, payload);
        toast.success('Contest updated!');
      } else {
        await contestService.createContest(payload);
        toast.success('Contest added! 🏆');
      }
      setShowModal(false);
      fetchContests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contest?')) return;
    try {
      await contestService.deleteContest(id);
      toast.success('Contest deleted');
      fetchContests();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────
  const platforms = [...new Set(contests.map((c) => c.platform))];

  const filtered = activeTab === 'all'
    ? contests
    : contests.filter((c) => c.platform === activeTab);

  const ratingData = [...contests]
    .filter((c) => c.ratingAfter)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((c) => ({
      name:   c.name.length > 18 ? c.name.slice(0, 18) + '…' : c.name,
      Rating: c.ratingAfter,
      Change: c.ratingChange,
    }));

  const bestRating   = Math.max(...contests.filter(c => c.ratingAfter).map(c => c.ratingAfter), 0);
  const totalSolved  = contests.reduce((s, c) => s + (c.solved || 0), 0);
  const bestRank     = Math.min(...contests.filter(c => c.rank).map(c => c.rank), Infinity);

  const inputClass = `w-full bg-gray-800 border border-gray-700 text-white rounded-xl
    px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none
    focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition`;

  if (loading) {
    return (
      <DashboardLayout title="Contests">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Contests">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Contest Tracker</h2>
          <p className="text-gray-400 text-sm mt-1">{contests.length} contests logged</p>
        </div>
        <div className="flex gap-2">
          {/* Sync from LeetCode */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400
                       disabled:opacity-50 text-black font-semibold
                       px-4 py-2.5 rounded-xl transition"
          >
            {syncing ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent
                                 rounded-full animate-spin" />
                Syncing...
              </>
            ) : '⚡ Sync LeetCode'}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700
                       text-white font-semibold px-4 py-2.5 rounded-xl transition"
          >
            + Add Contest
          </button>
        </div>
      </div>

      {/* Sync Result Banner */}
      {syncResult && (
        <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-4 mb-5
                        flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-yellow-400 text-lg">⚡</span>
            <div>
              <p className="text-white text-sm font-semibold">
                LeetCode Sync Complete
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                {syncResult.imported} imported · {syncResult.skipped} already existed ·{' '}
                {syncResult.total} total found
              </p>
            </div>
          </div>
          {syncResult.ranking && (
            <div className="text-right">
              <p className="text-violet-400 text-sm font-bold">
                Rating: {Math.round(syncResult.ranking.rating)}
              </p>
              <p className="text-gray-500 text-xs">
                Top {syncResult.ranking.topPercentage?.toFixed(1)}%
              </p>
            </div>
          )}
          <button
            onClick={() => setSyncResult(null)}
            className="text-gray-600 hover:text-gray-400 ml-4"
          >✕</button>
        </div>
      )}

      {/* Stats Row */}
      {contests.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Contests',     value: contests.length, color: 'text-white'       },
            { label: 'Best Rating',  value: bestRating || '—', color: 'text-violet-400' },
            { label: 'Best Rank',    value: bestRank === Infinity ? '—' : `#${bestRank}`, color: 'text-yellow-400' },
            { label: 'Total Solved', value: totalSolved, color: 'text-green-400'       },
          ].map((s) => (
            <div key={s.label}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rating Chart */}
      {ratingData.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Rating History</h3>
            <span className="text-violet-400 text-sm font-bold">
              Current: {ratingData[ratingData.length - 1]?.Rating}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                angle={-20}
                textAnchor="end"
                height={50}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="Rating"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ fill: '#7c3aed', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#a78bfa' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Platform Tabs */}
      {platforms.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {['all', ...platforms].map((p) => (
            <button
              key={p}
              onClick={() => setActiveTab(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === p
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {p === 'all' ? `All (${contests.length})` : `${p} (${contests.filter(c => c.platform === p).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Contest Table */}
      {filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl text-center py-16">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-gray-400 mb-2">No contests logged yet</p>
          <p className="text-gray-600 text-xs mb-4">
            Sync from LeetCode or add manually
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleSync}
              className="bg-yellow-500 hover:bg-yellow-400 text-black text-sm
                         font-semibold px-4 py-2 rounded-xl transition"
            >
              ⚡ Sync LeetCode
            </button>
            <button
              onClick={openAdd}
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm
                         font-semibold px-4 py-2 rounded-xl transition"
            >
              + Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800
                               bg-gray-900/80">
                  <th className="text-left px-5 py-3 font-medium">Contest</th>
                  <th className="text-left px-5 py-3 font-medium">Platform</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Rank</th>
                  <th className="text-left px-5 py-3 font-medium">Solved</th>
                  <th className="text-left px-5 py-3 font-medium">Rating</th>
                  <th className="text-left px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-800/30 transition">
                    <td className="px-5 py-3.5">
                      <p className="text-white text-sm font-medium">{c.name}</p>
                      {c.notes && (
                        <p className="text-gray-500 text-xs mt-0.5 truncate max-w-48">
                          {c.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                        c.platform === 'LeetCode'   ? 'bg-yellow-500/20 text-yellow-400' :
                        c.platform === 'Codeforces' ? 'bg-blue-500/20 text-blue-400'    :
                        c.platform === 'CodeChef'   ? 'bg-orange-500/20 text-orange-400':
                        'bg-violet-500/20 text-violet-400'
                      }`}>
                        {c.platform}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-sm">
                      {new Date(c.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-gray-300 text-sm font-medium">
                        {c.rank ? `#${c.rank}` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-gray-300 text-sm">
                        {c.solved}/{c.totalProblems || '?'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {c.ratingAfter ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-sm font-bold">{c.ratingAfter}</span>
                          {c.ratingChange !== 0 && (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                              c.ratingChange > 0
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {c.ratingChange > 0 ? '+' : ''}{c.ratingChange}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-gray-500 hover:text-violet-400 transition text-sm"
                        >✏️</button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="text-gray-500 hover:text-red-400 transition text-sm"
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editContest ? 'Edit Contest' : 'Add Contest'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Contest Name *</label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. LeetCode Weekly Contest 400"
              required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Platform</label>
              <select name="platform" value={form.platform} onChange={handleChange} className={inputClass}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Date *</label>
              <input name="date" type="date" value={form.date} onChange={handleChange}
                required className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Rank</label>
              <input name="rank" type="number" value={form.rank} onChange={handleChange}
                placeholder="1234" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Solved / Total</label>
              <div className="flex gap-2">
                <input name="solved" type="number" value={form.solved} onChange={handleChange}
                  placeholder="3" className={inputClass} />
                <input name="totalProblems" type="number" value={form.totalProblems}
                  onChange={handleChange} placeholder="4" className={inputClass} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Rating After</label>
              <input name="ratingAfter" type="number" value={form.ratingAfter}
                onChange={handleChange} placeholder="1650" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Rating Change</label>
              <input name="ratingChange" type="number" value={form.ratingChange}
                onChange={handleChange} placeholder="+25" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              rows={3} placeholder="What went well, what to improve..."
              className={`${inputClass} resize-none`} />
          </div>
          <button type="submit" disabled={formLoading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50
                       text-white font-semibold py-3 rounded-xl transition">
            {formLoading ? 'Saving...' : editContest ? 'Update Contest' : 'Add Contest'}
          </button>
        </form>
      </Modal>

    </DashboardLayout>
  );
};

export default Contests;