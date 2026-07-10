import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/ui/Modal';
import ProblemForm from '../components/problems/ProblemForm';
import ProblemFilters from '../components/problems/ProblemFilters';
import Badge from '../components/ui/Badge';
import problemService from '../services/problemService';
import { DIFFICULTY_COLORS, STATUS_COLORS } from '../constants';
import toast from 'react-hot-toast';
import AddProblemModal from '../components/problems/AddProblemModal';
const defaultFilters = {
  search: '', topic: '', difficulty: '',
  status: '', platform: '', company: '', isFavorite: '',
};

const Problems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
const [showAutoModal, setShowAutoModal] = useState(false);
  const fetchProblems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await problemService.getProblems(params);
      setProblems(res.data || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      toast.error('Failed to load problems');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchProblems(1), 300);
    return () => clearTimeout(timeout);
  }, [fetchProblems]);

  const handleAdd = async (data) => {
    setFormLoading(true);
    try {
      await problemService.createProblem(data);
      toast.success('Problem added! 🎉');
      setShowAddModal(false);
      fetchProblems(1);
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
      await problemService.updateProblem(problem._id, {
        isFavorite: !problem.isFavorite,
      });
      fetchProblems(pagination.page);
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <DashboardLayout title="Problems">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Problem Tracker</h2>
          <p className="text-gray-400 text-sm mt-1">
            {pagination.total} problems total
          </p>
        </div>
        <div className="flex gap-2">
  <button
    onClick={() => setShowAutoModal(true)}
    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700
               text-white font-semibold px-4 py-2.5 rounded-xl transition"
  >
    <span>⚡</span> Add Problem
  </button>
  <button
    onClick={() => setShowAddModal(true)}
    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border
               border-gray-700 text-gray-300 font-medium px-4 py-2.5 rounded-xl transition"
    title="Add manually"
  >
    ✏️ Manual
  </button>
</div>
      </div>

      {/* Filters */}
      <div className="mb-5">
        <ProblemFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(defaultFilters)}
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400">No problems found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-violet-400 hover:text-violet-300 text-sm"
            >
              Add your first problem →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="text-left px-5 py-3 font-medium">Title</th>
                  <th className="text-left px-5 py-3 font-medium">Topic</th>
                  <th className="text-left px-5 py-3 font-medium">Difficulty</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Platform</th>
                  <th className="text-left px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {problems.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-800/40 transition group">

                    {/* Title */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFavorite(p)}
                          className={`text-sm transition ${
                            p.isFavorite ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                          }`}
                        >
                          ⭐
                        </button>
                        <button
                          onClick={() => { setSelectedProblem(p); setShowDetailModal(true); }}
                          className="text-white text-sm font-medium hover:text-violet-400 transition text-left"
                        >
                          {p.title}
                        </button>
                        {p.isBookmarked && (
                          <span className="text-blue-400 text-xs">🔖</span>
                        )}
                      </div>
                      {p.companies?.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {p.companies.slice(0, 2).map((c) => (
                            <span key={c} className="text-xs text-gray-600">{c}</span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Topic */}
                    <td className="px-5 py-3.5 text-gray-400 text-sm">{p.topic}</td>

                    {/* Difficulty */}
                    <td className="px-5 py-3.5">
                      <Badge
                        label={p.difficulty}
                        color={
                          p.difficulty === 'Easy' ? 'green' :
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

                    {/* Platform */}
                    <td className="px-5 py-3.5 text-gray-400 text-sm">{p.platform}</td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {p.problemLink && (
                          <a
                            href={p.problemLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-500 hover:text-blue-400 transition text-sm"
                            title="Open problem"
                          >
                            🔗
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setSelectedProblem(p);
                            setShowEditModal(true);
                          }}
                          className="text-gray-500 hover:text-violet-400 transition text-sm"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
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
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800">
            <p className="text-gray-500 text-sm">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchProblems(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm
                           disabled:opacity-40 hover:bg-gray-700 transition"
              >
                ← Prev
              </button>
              <button
                onClick={() => fetchProblems(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm
                           disabled:opacity-40 hover:bg-gray-700 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Problem"
        size="lg"
      >
        <ProblemForm onSubmit={handleAdd} loading={formLoading} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedProblem(null); }}
        title="Edit Problem"
        size="lg"
      >
        {selectedProblem && (
          <ProblemForm
            onSubmit={handleEdit}
            initialData={selectedProblem}
            loading={formLoading}
          />
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedProblem(null); }}
        title={selectedProblem?.title || 'Problem Detail'}
        size="md"
      >
        {selectedProblem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">Difficulty</p>
                <Badge
                  label={selectedProblem.difficulty}
                  color={
                    selectedProblem.difficulty === 'Easy' ? 'green' :
                    selectedProblem.difficulty === 'Medium' ? 'yellow' : 'red'
                  }
                />
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Status</p>
                <Badge
                  label={selectedProblem.status}
                  color={
                    selectedProblem.status === 'Solved'        ? 'green'  :
                    selectedProblem.status === 'Revised'       ? 'blue'   :
                    selectedProblem.status === 'Need Revision' ? 'yellow' : 'gray'
                  }
                />
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Topic</p>
                <p className="text-white text-sm">{selectedProblem.topic}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Platform</p>
                <p className="text-white text-sm">{selectedProblem.platform}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Time Taken</p>
                <p className="text-white text-sm">{selectedProblem.timeTaken || 0} mins</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Attempts</p>
                <p className="text-white text-sm">{selectedProblem.attempts}</p>
              </div>
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
                <a
                  href={selectedProblem.problemLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center bg-blue-600 hover:bg-blue-700
                             text-white text-sm font-medium py-2.5 rounded-xl transition"
                >
                  🔗 Open Problem
                </a>
              )}
              {selectedProblem.codeLink && (
                <a
                  href={selectedProblem.codeLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center bg-gray-700 hover:bg-gray-600
                             text-white text-sm font-medium py-2.5 rounded-xl transition"
                >
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
  onSaved={() => fetchProblems(1)}
/>
    </DashboardLayout>
  );
};

export default Problems;