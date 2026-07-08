import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Badge from '../components/ui/Badge';
import revisionService from '../services/revisionService';
import toast from 'react-hot-toast';

const STEP_LABELS = ['Day 1', 'Day 3', 'Day 7', 'Day 15', 'Day 30', 'Day 60'];

const RevisionCard = ({ revision, onMark, onSkip }) => {
  const p = revision.problem;
  const step = revision.currentStep;
  const isOverdue = new Date(revision.scheduledDates[step]) < new Date();

  return (
    <div className={`bg-gray-900 border rounded-2xl p-5 transition
      ${isOverdue ? 'border-red-500/30' : 'border-gray-800 hover:border-gray-700'}`}>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isOverdue && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-lg">
                Overdue
              </span>
            )}
            <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-lg">
              {STEP_LABELS[step] || 'Final'}
            </span>
          </div>
          <h3 className="text-white font-semibold text-sm truncate">{p?.title}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{p?.topic} · {p?.platform}</p>
        </div>

        <Badge
          label={p?.difficulty}
          color={
            p?.difficulty === 'Easy'   ? 'green'  :
            p?.difficulty === 'Medium' ? 'yellow' : 'red'
          }
        />
      </div>

      {/* Revision Steps */}
      <div className="flex gap-1 mb-4">
        {STEP_LABELS.map((label, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${
              i < step  ? 'bg-green-500'  :
              i === step ? 'bg-violet-500' :
              'bg-gray-800'
            }`}
          />
        ))}
      </div>

      {/* Date */}
      <p className="text-gray-500 text-xs mb-4">
        Scheduled:{' '}
        <span className={isOverdue ? 'text-red-400' : 'text-gray-400'}>
          {new Date(revision.scheduledDates[step]).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
        {' '}· Step {step + 1} of {STEP_LABELS.length}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onMark(revision._id)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm
                     font-medium py-2 rounded-xl transition"
        >
          ✅ Mark Revised
        </button>
        <button
          onClick={() => onSkip(revision._id)}
          className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-400
                     hover:text-white text-sm font-medium py-2 rounded-xl transition"
        >
          Skip
        </button>
      </div>

    </div>
  );
};

const Revision = () => {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRevisions = async () => {
    try {
      const res = await revisionService.getRevisions();
      setRevisions(res.data || []);
    } catch {
      toast.error('Failed to load revisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevisions();
  }, []);

  const handleMark = async (id) => {
    setActionLoading(id);
    try {
      await revisionService.markRevised(id);
      toast.success('Marked as revised! 🎉');
      setRevisions((prev) => prev.filter((r) => r._id !== id));
    } catch {
      toast.error('Failed to mark as revised');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (id) => {
    setActionLoading(id);
    try {
      await revisionService.skipRevision(id);
      toast.success('Revision rescheduled by 2 days');
      fetchRevisions();
    } catch {
      toast.error('Failed to skip revision');
    } finally {
      setActionLoading(null);
    }
  };

  // Split into overdue and due today
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const overdue = revisions.filter((r) => {
    const date = new Date(r.scheduledDates[r.currentStep]);
    return date < startOfDay;
  });

  const dueToday = revisions.filter((r) => {
    const date = new Date(r.scheduledDates[r.currentStep]);
    return date >= startOfDay && date <= today;
  });

  if (loading) {
    return (
      <DashboardLayout title="Revision">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent
                          rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Revision">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Revision Queue</h2>
        <p className="text-gray-400 text-sm mt-1">
          Spaced repetition: Day 1 → 3 → 7 → 15 → 30 → 60
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{overdue.length}</p>
          <p className="text-gray-400 text-sm mt-1">Overdue</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{dueToday.length}</p>
          <p className="text-gray-400 text-sm mt-1">Due Today</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{revisions.length}</p>
          <p className="text-gray-400 text-sm mt-1">Total Due</p>
        </div>
      </div>

      {/* Empty State */}
      {revisions.length === 0 && (
        <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-2xl">
          <p className="text-5xl mb-4">🎉</p>
          <h3 className="text-white font-semibold text-lg mb-2">
            All caught up!
          </h3>
          <p className="text-gray-400 text-sm">
            No revisions due. Solve more problems to build your queue.
          </p>
        </div>
      )}

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-white font-semibold">Overdue</h3>
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
              {overdue.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdue.map((r) => (
              <RevisionCard
                key={r._id}
                revision={r}
                onMark={handleMark}
                onSkip={handleSkip}
              />
            ))}
          </div>
        </div>
      )}

      {/* Due Today Section */}
      {dueToday.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-white font-semibold">Due Today</h3>
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
              {dueToday.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dueToday.map((r) => (
              <RevisionCard
                key={r._id}
                revision={r}
                onMark={handleMark}
                onSkip={handleSkip}
              />
            ))}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default Revision;