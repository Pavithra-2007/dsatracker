import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import contestService from '../services/contestService';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const PLATFORMS = [
  'LeetCode', 'Codeforces', 'CodeChef', 'AtCoder', 'HackerRank', 'Other',
];

const defaultForm = {
  name: '', platform: 'LeetCode', rank: '',
  solved: '', totalProblems: '', ratingChange: '',
  ratingAfter: '', date: '', notes: '',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }} className="font-semibold">
          {e.name}: {e.value}
        </p>
      ))}
    </div>
  );
};

const Contests = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editContest, setEditContest] = useState(null);
  const [form, setForm] = useState(defaultForm);

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

  const openAdd = () => {
    setEditContest(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (contest) => {
    setEditContest(contest);
    setForm({
      ...contest,
      date: contest.date
        ? new Date(contest.date).toISOString().split('T')[0]
        : '',
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Contest name is required');
      return;
    }
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
      toast.error(err.response?.data?.message || 'Failed to save contest');
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

  // Rating chart data
  const ratingData = [...contests]
    .reverse()
    .filter((c) => c.ratingAfter)
    .map((c) => ({
      name: c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name,
      Rating: c.ratingAfter,
    }));

  const inputClass = `w-full bg-gray-800 border border-gray-700 text-white rounded-xl
    px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none
    focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition`;

  if (loading) {
    return (
      <DashboardLayout title="Contests">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent
                          rounded-full animate-spin" />
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
          <p className="text-gray-400 text-sm mt-1">
            {contests.length} contests logged
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700
                     text-white font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <span>+</span> Add Contest
        </button>
      </div>

      {/* Rating Chart */}
      {ratingData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-4">Rating History</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ratingData}>
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
                strokeWidth={2.5}
                dot={{ fill: '#7c3aed', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Contest List */}
      {contests.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl
                        text-center py-16">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-gray-400">No contests logged yet</p>
          <button
            onClick={openAdd}
            className="mt-4 text-violet-400 hover:text-violet-300 text-sm"
          >
            Log your first contest →
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="text-left px-5 py-3 font-medium">Contest</th>
                  <th className="text-left px-5 py-3 font-medium">Platform</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Rank</th>
                  <th className="text-left px-5 py-3 font-medium">Solved</th>
                  <th className="text-left px-5 py-3 font-medium">Rating</th>
                  <th className="text-left px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {contests.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-800/40 transition">

                    <td className="px-5 py-3.5">
                      <p className="text-white text-sm font-medium">{c.name}</p>
                      {c.notes && (
                        <p className="text-gray-500 text-xs truncate max-w-48">
                          {c.notes}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge label={c.platform} color="violet" />
                    </td>

                    <td className="px-5 py-3.5 text-gray-400 text-sm">
                      {new Date(c.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-3.5 text-gray-300 text-sm">
                      #{c.rank || '—'}
                    </td>

                    <td className="px-5 py-3.5 text-gray-300 text-sm">
                      {c.solved}/{c.totalProblems || '?'}
                    </td>

                    <td className="px-5 py-3.5">
                      {c.ratingAfter ? (
                        <div>
                          <span className="text-white text-sm font-semibold">
                            {c.ratingAfter}
                          </span>
                          {c.ratingChange !== 0 && (
                            <span className={`text-xs ml-1.5 ${
                              c.ratingChange > 0
                                ? 'text-green-400'
                                : 'text-red-400'
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
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="text-gray-500 hover:text-red-400 transition text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editContest ? 'Edit Contest' : 'Add Contest'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Contest Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. LeetCode Weekly Contest 400"
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Platform</label>
              <select
                name="platform"
                value={form.platform}
                onChange={handleChange}
                className={inputClass}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Date *</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Rank</label>
              <input
                name="rank"
                type="number"
                value={form.rank}
                onChange={handleChange}
                placeholder="e.g. 1234"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Solved / Total
              </label>
              <div className="flex gap-2">
                <input
                  name="solved"
                  type="number"
                  value={form.solved}
                  onChange={handleChange}
                  placeholder="3"
                  className={inputClass}
                />
                <input
                  name="totalProblems"
                  type="number"
                  value={form.totalProblems}
                  onChange={handleChange}
                  placeholder="4"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Rating After
              </label>
              <input
                name="ratingAfter"
                type="number"
                value={form.ratingAfter}
                onChange={handleChange}
                placeholder="1650"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Rating Change
              </label>
              <input
                name="ratingChange"
                type="number"
                value={form.ratingChange}
                onChange={handleChange}
                placeholder="+25 or -10"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="What went well, what to improve..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50
                       text-white font-semibold py-3 rounded-xl transition"
          >
            {formLoading
              ? 'Saving...'
              : editContest
              ? 'Update Contest'
              : 'Add Contest'}
          </button>

        </form>
      </Modal>

    </DashboardLayout>
  );
};

export default Contests;