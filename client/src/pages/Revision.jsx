import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Badge from '../components/ui/Badge';
import revisionService from '../services/revisionService';
import toast from 'react-hot-toast';

const STEP_LABELS = ['Day 1', 'Day 3', 'Day 7', 'Day 15', 'Day 30', 'Day 60'];

const RevisionCard = ({ revision, onMark, onSkip, showActions = true }) => {
  const p    = revision.problem;
  const step = revision.currentStep;
  const scheduledDate = revision.scheduledDates?.[step];
  const isOverdue = scheduledDate && new Date(scheduledDate) < new Date();

  return (
    <div className={`bg-gray-900 border rounded-2xl p-5 transition
      ${isOverdue ? 'border-red-500/30' : 'border-gray-800 hover:border-gray-700'}`}>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isOverdue && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-lg">
                Overdue
              </span>
            )}
            <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-lg">
              {STEP_LABELS[step] || 'Final'}
            </span>
            <span className="text-gray-600 text-xs">
              Step {Math.min(step + 1, STEP_LABELS.length)}/{STEP_LABELS.length}
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

      {/* Step progress bar */}
      <div className="flex gap-1 mb-4">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${
              i < step   ? 'bg-green-500'  :
              i === step ? 'bg-violet-500' :
              'bg-gray-800'
            }`}
          />
        ))}
      </div>

      {/* Date */}
      {scheduledDate && (
        <p className="text-gray-500 text-xs mb-4">
          {isOverdue ? 'Was due: ' : 'Scheduled: '}
          <span className={isOverdue ? 'text-red-400' : 'text-gray-400'}>
            {new Date(scheduledDate).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </p>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={() => onMark(revision._id)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white
                       text-sm font-medium py-2 rounded-xl transition"
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
      )}

      {/* Completed badge */}
      {!showActions && revision.isComplete && (
        <div className="text-center py-1">
          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-lg">
            ✅ Fully Completed
          </span>
        </div>
      )}
    </div>
  );
};

const Revision = () => {
  const [data, setData] = useState({
    overdue: [], dueToday: [], upcoming: [], completed: [],
    stats: { overdue: 0, dueToday: 0, upcoming: 0, completed: 0, total: 0 },
  });
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('due');

  const fetchAll = async () => {
    try {
      const res = await revisionService.getAllRevisions();
      setData(res.data);
    } catch {
      toast.error('Failed to load revisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleMark = async (id) => {
    try {
      await revisionService.markRevised(id);
      toast.success('Marked as revised! 🎉');
      fetchAll();
    } catch {
      toast.error('Failed to mark as revised');
    }
  };

  const handleSkip = async (id) => {
    try {
      await revisionService.skipRevision(id);
      toast.success('Rescheduled by 2 days');
      fetchAll();
    } catch {
      toast.error('Failed to skip');
    }
  };

  const tabs = [
    { key: 'due',      label: 'Due Today', count: data.stats.dueToday,  color: 'text-yellow-400' },
    { key: 'overdue',  label: 'Overdue',   count: data.stats.overdue,   color: 'text-red-400'    },
    { key: 'upcoming', label: 'Upcoming',  count: data.stats.upcoming,  color: 'text-blue-400'   },
    { key: 'done',     label: 'Completed', count: data.stats.completed, color: 'text-green-400'  },
  ];

  const currentList =
    activeTab === 'due'      ? data.dueToday  :
    activeTab === 'overdue'  ? data.overdue   :
    activeTab === 'upcoming' ? data.upcoming  :
    data.completed;

  const emptyMessages = {
    due:      { icon: '🎉', text: 'Nothing due today!' },
    overdue:  { icon: '✅', text: 'No overdue revisions!' },
    upcoming: { icon: '📅', text: 'No upcoming revisions. Solve problems to build queue.' },
    done:     { icon: '🏆', text: 'No completed revisions yet.' },
  };

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

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Revision Queue</h2>
        <p className="text-gray-400 text-sm mt-1">
          Spaced repetition — Day 1 → 3 → 7 → 15 → 30 → 60
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',     value: data.stats.total,     color: 'text-white'        },
          { label: 'Overdue',   value: data.stats.overdue,   color: 'text-red-400'      },
          { label: 'Due Today', value: data.stats.dueToday,  color: 'text-yellow-400'   },
          { label: 'Upcoming',  value: data.stats.upcoming,  color: 'text-blue-400'     },
          { label: 'Completed', value: data.stats.completed, color: 'text-green-400'    },
        ].map((s) => (
          <div key={s.label}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-violet-600 text-white'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs ${
              activeTab === tab.key ? 'text-violet-200' : tab.color
            }`}>
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {currentList.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl">
          <p className="text-4xl mb-3">{emptyMessages[activeTab].icon}</p>
          <p className="text-gray-400 text-sm">{emptyMessages[activeTab].text}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map((r) => (
            <RevisionCard
              key={r._id}
              revision={r}
              onMark={handleMark}
              onSkip={handleSkip}
              showActions={activeTab === 'due' || activeTab === 'overdue'}
            />
          ))}
        </div>
      )}

    </DashboardLayout>
  );
};

export default Revision;