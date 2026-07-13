import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/ui/Modal';
import ProblemForm from '../components/problems/ProblemForm';
import ProblemFilters from '../components/problems/ProblemFilters';
import Badge from '../components/ui/Badge';
import AddProblemModal from '../components/problems/AddProblemModal';
import problemService from '../services/problemService';
import toast from 'react-hot-toast';

const PLATFORM_STYLES = {
  LeetCode:      { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400',  dot: 'bg-yellow-400'  },
  Codeforces:    { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400',    dot: 'bg-blue-400'    },
  GeeksForGeeks: { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400',   dot: 'bg-green-400'   },
  HackerRank:    { bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',text: 'text-emerald-400', dot: 'bg-emerald-400' },
  CodeChef:      { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400',  dot: 'bg-orange-400'  },
  AtCoder:       { bg: 'bg-gray-500/10',   border: 'border-gray-500/20',   text: 'text-gray-300',    dot: 'bg-gray-400'    },
  Custom:        { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400',  dot: 'bg-violet-400'  },
};

const defaultFilters = {
  search: '', topic: '', difficulty: '',
  status: '', platform: '', company: '', isFavorite: '',
};

const Problems = () => {
  const [problems, setProblems]         = useState([]);
  const [allProblems, setAllProblems]   = useState([]); // for platform counts
  const [loading, setLoading]           = useState(true);
  const [formLoading, setFormLoading]   = useState(false);
  const [filters, setFilters]           = useState(defaultFilters);
  const [pagination, setPagination]     = useState({ page: 1, pages: 1, total: 0 });
  const [activePlatform, setActivePlatform] = useState('All');

  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAutoModal, setShowAutoModal]     = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);

  // Fetch all problems once for platform counts
  useEffect(() => {
    problemService.getProblems({ limit: 1000 }).then((res) => {
      setAllProblems(res.data || []);
    }).catch(() => {});
  }, []);

  const fetchProblems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      if (activePlatform !== 'All') params.platform = activePlatform;
      const res = await problemService.getProblems(params);
      setProblems(res.data || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      toast.error('Failed to load problems');
    } finally {
      setLoading(false);
    }
  }, [filters, activePlatform]);

  useEffect(() => {
    const t = setTimeout(() => fetchProblems(1), 300);
    return () => clearTimeout(t);
  }, [fetchProblems]);

  // Platform stats from allProblems
  const platformCounts = allProblems.reduce((acc, p) => {
    acc[p.platform] = (acc[p.platform] || 0) + 1;
    return acc;
  }, {});

  const platforms = ['All', ...Object.keys(platformCounts).sort()];

  const handleAdd = async (data) => {
    setFormLoading(true);
    try {
      await problemService.createProblem(data);
      toast.success('Problem added! 🎉');
      setShowAddModal(false);
      fetchProblems(1);
      // Refresh counts
      problemService.getProblems({ limit: 1000 }).then((res) => setAllProblems(res.data || []));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add problem');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (data) => {
    setFormLoading(true);
    try {
      await problemService.updateProblem(selectedProblem._id, data);
      toast.success('Problem updated!');
      setShowEditModal(false);
      setSelectedProblem(null);
      fetchProblems(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem?')) return;
    try {
      await problemService.deleteProblem(id);
      toast.success('Problem deleted');
      fetchProblems(pagination.page);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggleFavorite = async (problem) => {
    try {
      await problemService.updateProblem(problem._id, { isFavorite: !problem.isFavorite });
      fetchProblems(pagination.page);
    } catch {
      toast.error('Failed to update');
    }
  };

  const pStyle = (platform) => PLATFORM_STYLES[platform] || PLATFORM_STYLES.Custom;

  return (
    <DashboardLayout title="Problems">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Problem Tracker</h2>
          <p className="text-gray-400 text-sm mt-1">
            {allProblems.length} problems across {Object.keys(platformCounts).length} platforms
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAutoModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700
                       text-white font-semibold px-4 py-2.5 rounded-xl transition"
          >
            ⚡ Add Problem
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700
                       border border-gray-700 text-gray-300 font-medium
                       px-4 py-2.5 rounded-xl transition"
          >
            ✏️ Manual
          </button>
        </div>
      </div>

      {/* Platform Tab Cards */}
      {Object.keys(platformCounts).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-5">
          {/* All card */}
          <button
            onClick={() => setActivePlatform('All')}
            className={`p-3 rounded-xl border text-left transition ${
              activePlatform === 'All'
                ? 'bg-violet-600/20 border-violet-500/50'
                : 'bg-gray-900 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${activePlatform === 'All' ? 'bg-violet-400' : 'bg-gray-600'}`} />
              <span className={`text-xs font-medium ${activePlatform === 'All' ? 'text-violet-400' : 'text-gray-400'}`}>
                All
              </span>
            </div>
            <p className={`text-xl font-bold ${activePlatform === 'All' ? 'text-white' : 'text-gray-300'}`}>
              {allProblems.length}
            </p>
          </button>

          {/* Per-platform cards */}
          {Object.entries(platformCounts).sort().map(([platform, count]) => {
            const s = pStyle(platform);
            const isActive = activePlatform === platform;
            return (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform)}
                className={`p-3 rounded-xl border text-left transition ${
                  isActive
                    ? `${s.bg} ${s.border}`
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${isActive ? s.dot : 'bg-gray-600'}`} />
                  <span className={`text-xs font-medium truncate ${isActive ? s.text : 'text-gray-400'}`}>
                    {platform}
                  </span>
                </div>
                <p className={`text-xl font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                  {count}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4">
        <ProblemFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(defaultFilters)}
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

        {/* Active platform header */}
        {activePlatform !== 'All' && (
          <div className={`px-5 py-3 border-b border-gray-800 flex items-center justify-between
                           ${pStyle(activePlatform).bg}`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${pStyle(activePlatform).dot}`} />
              <span className={`text-sm font-semibold ${pStyle(activePlatform).text}`}>
                {activePlatform}
              </span>
              <span className="text-gray-500 text-sm">
                — {pagination.total} problems
              </span>
            </div>
            <button
              onClick={() => setActivePlatform('All')}
              className="text-gray-500 hover:text-gray-300 text-xs transition"
            >
              Clear filter ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent
                            rounded-full animate-spin" />
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400 mb-1">
              {activePlatform === 'All' ? 'No problems found' : `No ${activePlatform} problems`}
            </p>
            <p className="text-gray-600 text-xs">
              {activePlatform !== 'All' && 'Try adding problems from this platform'}
            </p>
            <button
              onClick={() => setShowAutoModal(true)}
              className="mt-4 text-violet-400 hover:text-violet-300 text-sm"
            >
              Add your first problem →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800/60">
                  <th className="text-left px-5 py-3 font-medium">Title</th>
                  <th className="text-left px-5 py-3 font-medium">Topic</th>
                  <th className="text-left px-5 py-3 font-medium">Difficulty</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  {activePlatform === 'All' && (
                    <th className="text-left px-5 py-3 font-medium">Platform</th>
                  )}
                  <th className="text-left px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {problems.map((p) => {
                  const ps = pStyle(p.platform);
                  return (
                    <tr key={p._id} className="hover:bg-gray-800/25 transition group">

                      {/* Title */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleFavorite(p)}
                            className={`text-sm flex-shrink-0 transition ${
                              p.isFavorite
                                ? 'text-yellow-400'
                                : 'text-gray-700 group-hover:text-gray-500 hover:text-yellow-400'
                            }`}
                          >⭐</button>
                          <div>
                            <button
                              onClick={() => { setSelectedProblem(p); setShowDetailModal(true); }}
                              className="text-white text-sm font-medium hover:text-violet-400
                                         transition text-left leading-snug"
                            >
                              {p.title}
                            </button>
                            {p.companies?.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {p.companies.slice(0, 2).map((c) => (
                                  <span key={c} className="text-xs text-gray-600">{c}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          {p.isBookmarked && (
                            <span className="text-blue-400 text-xs flex-shrink-0">🔖</span>
                          )}
                        </div>
                      </td>

                      {/* Topic */}
                      <td className="px-5 py-3.5">
                        <span className="text-gray-400 text-sm">{p.topic}</span>
                      </td>

                      {/* Difficulty */}
                      <td className="px-5 py-3.5">
                        <Badge
                          label={p.difficulty}
                          color={
                            p.difficulty === 'Easy'   ? 'green'  :
                            p.difficulty === 'Medium' ? 'yellow' : 'red'
                          }
                        />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <Badge
                          label={p.status}
                          color={
                            p.status === 'Solved'        ? 'green'  :
                            p.status === 'Revised'       ? 'blue'   :
                            p.status === 'Need Revision' ? 'yellow' : 'gray'
                          }
                        />
                      </td>

                      {/* Platform — only in All tab */}
                      {activePlatform === 'All' && (
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-1 rounded-lg font-medium
                                           ${ps.bg} ${ps.text}`}>
                            {p.platform}
                          </span>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100
                                        transition">
                          {p.problemLink && (
                            <a
                              href={p.problemLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-500 hover:text-blue-400 transition text-sm"
                              title="Open problem"
                            >🔗</a>
                          )}
                          <button
                            onClick={() => { setSelectedProblem(p); setShowEditModal(true); }}
                            className="text-gray-500 hover:text-violet-400 transition text-sm"
                          >✏️</button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="text-gray-500 hover:text-red-400 transition text-sm"
                          >🗑️</button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800">
            <p className="text-gray-500 text-sm">
              Page {pagination.page} of {pagination.pages} · {pagination.total} problems
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchProblems(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm
                           disabled:opacity-40 hover:bg-gray-700 transition"
              >← Prev</button>
              <button
                onClick={() => fetchProblems(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm
                           disabled:opacity-40 hover:bg-gray-700 transition"
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <>
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}
          title="Add Problem" size="lg">
          <ProblemForm onSubmit={handleAdd} loading={formLoading} />
        </Modal>

        <Modal isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setSelectedProblem(null); }}
          title="Edit Problem" size="lg">
          {selectedProblem && (
            <ProblemForm onSubmit={handleEdit} initialData={selectedProblem}
              loading={formLoading} />
          )}
        </Modal>

        <Modal isOpen={showDetailModal}
          onClose={() => { setShowDetailModal(false); setSelectedProblem(null); }}
          title={selectedProblem?.title || 'Problem Detail'} size="md">
          {selectedProblem && (
            <div className="space-y-4">
              {/* Platform badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                               font-medium ${pStyle(selectedProblem.platform).bg}
                               ${pStyle(selectedProblem.platform).text}`}>
                <span className={`w-2 h-2 rounded-full ${pStyle(selectedProblem.platform).dot}`} />
                {selectedProblem.platform}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Difficulty</p>
                  <Badge label={selectedProblem.difficulty}
                    color={selectedProblem.difficulty === 'Easy' ? 'green' :
                           selectedProblem.difficulty === 'Medium' ? 'yellow' : 'red'} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Status</p>
                  <Badge label={selectedProblem.status}
                    color={selectedProblem.status === 'Solved'        ? 'green'  :
                           selectedProblem.status === 'Revised'       ? 'blue'   :
                           selectedProblem.status === 'Need Revision' ? 'yellow' : 'gray'} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Topic</p>
                  <p className="text-white text-sm">{selectedProblem.topic}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Time Taken</p>
                  <p className="text-white text-sm">{selectedProblem.timeTaken || 0} mins</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Attempts</p>
                  <p className="text-white text-sm">{selectedProblem.attempts}</p>
                </div>
                {selectedProblem.dateSolved && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Date Solved</p>
                    <p className="text-white text-sm">
                      {new Date(selectedProblem.dateSolved).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {selectedProblem.companies?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs mb-2">Companies</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProblem.companies.map((c) => (
                      <Badge key={c} label={c} color="violet" />
                    ))}
                  </div>
                </div>
              )}

              {selectedProblem.tags?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProblem.tags.map((t) => (
                      <Badge key={t} label={t} color="gray" />
                    ))}
                  </div>
                </div>
              )}

              {selectedProblem.notes && (
                <div>
                  <p className="text-gray-500 text-xs mb-2">Notes</p>
                  <pre className="bg-gray-800 rounded-xl p-4 text-gray-300 text-sm
                                  whitespace-pre-wrap font-mono overflow-auto max-h-48">
                    {selectedProblem.notes}
                  </pre>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {selectedProblem.problemLink && (
                  <a href={selectedProblem.problemLink} target="_blank" rel="noreferrer"
                    className="flex-1 text-center bg-blue-600 hover:bg-blue-700
                               text-white text-sm font-medium py-2.5 rounded-xl transition">
                    🔗 Open Problem
                  </a>
                )}
                {selectedProblem.codeLink && (
                  <a href={selectedProblem.codeLink} target="_blank" rel="noreferrer"
                    className="flex-1 text-center bg-gray-700 hover:bg-gray-600
                               text-white text-sm font-medium py-2.5 rounded-xl transition">
                    💻 View Code
                  </a>
                )}
              </div>
            </div>
          )}
        </Modal>

        <AddProblemModal
          isOpen={showAutoModal}
          onClose={() => setShowAutoModal(false)}
          onSaved={() => {
            fetchProblems(1);
            problemService.getProblems({ limit: 1000 }).then((res) => setAllProblems(res.data || []));
          }}
        />
      </>

    </DashboardLayout>
  );
};

export default Problems;