import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProgressBar from '../components/ui/ProgressBar';
import topicService from '../services/topicService';
import toast from 'react-hot-toast';

const TOPIC_ICONS = {
  'Arrays':              '📦',
  'Strings':             '🔤',
  'Linked List':         '🔗',
  'Stack':               '📚',
  'Queue':               '🚶',
  'Trees':               '🌳',
  'BST':                 '🌲',
  'Heap':                '⛰️',
  'Trie':                '🔍',
  'Graph':               '🕸️',
  'DFS':                 '🔄',
  'BFS':                 '🌊',
  'Backtracking':        '↩️',
  'Greedy':              '💰',
  'Dynamic Programming': '🧩',
  'Recursion':           '🔁',
  'Bit Manipulation':    '💡',
  'Sliding Window':      '🪟',
  'Binary Search':       '🎯',
  'Math':                '➗',
  'Sorting':             '🔢',
  'Hashing':             '#️⃣',
  'Prefix Sum':          '➕',
};

const TopicCard = ({ topic }) => {
  const icon = TOPIC_ICONS[topic.name] || '📌';

  const progressColor =
    topic.progress >= 75 ? 'bg-green-500'  :
    topic.progress >= 40 ? 'bg-yellow-500' :
    topic.progress > 0   ? 'bg-violet-500' :
    'bg-gray-700';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5
                    hover:border-gray-700 transition group">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center
                          justify-center text-xl group-hover:bg-gray-700 transition">
            {icon}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{topic.name}</h3>
            <p className="text-gray-500 text-xs">{topic.total} problems</p>
          </div>
        </div>

        {/* Progress % */}
        <span className={`text-sm font-bold ${
          topic.progress >= 75 ? 'text-green-400'  :
          topic.progress >= 40 ? 'text-yellow-400' :
          topic.progress > 0   ? 'text-violet-400' :
          'text-gray-600'
        }`}>
          {topic.progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <ProgressBar value={topic.progress} color={progressColor} height="h-1.5" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <p className="text-white font-semibold text-sm">{topic.solved}</p>
          <p className="text-gray-500 text-xs">Solved</p>
        </div>
        <div className="text-center border-x border-gray-800">
          <p className="text-white font-semibold text-sm">{topic.remaining}</p>
          <p className="text-gray-500 text-xs">Remaining</p>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-sm">{topic.total}</p>
          <p className="text-gray-500 text-xs">Total</p>
        </div>
      </div>

      {/* Difficulty Distribution */}
      {topic.total > 0 && (
        <div className="space-y-1.5">
          <p className="text-gray-600 text-xs mb-2">Difficulty Distribution</p>

          {/* Easy */}
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xs w-12">Easy</span>
            <div className="flex-1">
              <ProgressBar
                value={topic.total > 0 ? (topic.easy / topic.total) * 100 : 0}
                color="bg-green-500"
                height="h-1"
              />
            </div>
            <span className="text-gray-500 text-xs w-4 text-right">{topic.easy}</span>
          </div>

          {/* Medium */}
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-xs w-12">Med</span>
            <div className="flex-1">
              <ProgressBar
                value={topic.total > 0 ? (topic.medium / topic.total) * 100 : 0}
                color="bg-yellow-500"
                height="h-1"
              />
            </div>
            <span className="text-gray-500 text-xs w-4 text-right">{topic.medium}</span>
          </div>

          {/* Hard */}
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-xs w-12">Hard</span>
            <div className="flex-1">
              <ProgressBar
                value={topic.total > 0 ? (topic.hard / topic.total) * 100 : 0}
                color="bg-red-500"
                height="h-1"
              />
            </div>
            <span className="text-gray-500 text-xs w-4 text-right">{topic.hard}</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {topic.total === 0 && (
        <p className="text-gray-600 text-xs text-center py-2">
          No problems added yet
        </p>
      )}

    </div>
  );
};

const Topics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await topicService.getTopics();
        setTopics(res.data || []);
      } catch {
        toast.error('Failed to load topics');
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const totalSolved  = topics.reduce((sum, t) => sum + t.solved, 0);
  const totalProblems = topics.reduce((sum, t) => sum + t.total, 0);
  const overallProgress = totalProblems > 0
    ? Math.round((totalSolved / totalProblems) * 100)
    : 0;

  const filteredTopics = topics.filter((t) => {
    if (filter === 'started')    return t.total > 0;
    if (filter === 'completed')  return t.progress === 100;
    if (filter === 'inprogress') return t.progress > 0 && t.progress < 100;
    if (filter === 'notstarted') return t.total === 0;
    return true;
  });

  const filterBtns = [
    { key: 'all',        label: 'All'          },
    { key: 'started',    label: 'Started'      },
    { key: 'inprogress', label: 'In Progress'  },
    { key: 'completed',  label: 'Completed'    },
    { key: 'notstarted', label: 'Not Started'  },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Topics">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent
                          rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Topics">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Topics</h2>
        <p className="text-gray-400 text-sm mt-1">
          Track your progress across all DSA topics
        </p>
      </div>

      {/* Overall Progress Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold">Overall Progress</h3>
            <p className="text-gray-400 text-sm mt-0.5">
              {totalSolved} of {totalProblems} problems solved
            </p>
          </div>
          <span className="text-3xl font-bold text-violet-400">
            {overallProgress}%
          </span>
        </div>
        <ProgressBar value={overallProgress} color="bg-violet-500" height="h-3" />

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Topics',    value: topics.length,                           color: 'text-white'        },
            { label: 'Started',   value: topics.filter(t => t.total > 0).length,  color: 'text-violet-400'   },
            { label: 'Completed', value: topics.filter(t => t.progress === 100).length, color: 'text-green-400' },
            { label: 'Remaining', value: topics.filter(t => t.progress < 100).length,   color: 'text-yellow-400' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filterBtns.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === btn.key
                ? 'bg-violet-600 text-white'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {btn.label}
            <span className="ml-1.5 text-xs opacity-60">
              {btn.key === 'all'        ? topics.length :
               btn.key === 'started'    ? topics.filter(t => t.total > 0).length :
               btn.key === 'inprogress' ? topics.filter(t => t.progress > 0 && t.progress < 100).length :
               btn.key === 'completed'  ? topics.filter(t => t.progress === 100).length :
               topics.filter(t => t.total === 0).length}
            </span>
          </button>
        ))}
      </div>

      {/* Topic Grid */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-400">No topics match this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTopics.map((topic) => (
            <TopicCard key={topic.name} topic={topic} />
          ))}
        </div>
      )}

    </DashboardLayout>
  );
};

export default Topics;