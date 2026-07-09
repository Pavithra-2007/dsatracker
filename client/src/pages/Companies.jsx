import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Badge from '../components/ui/Badge';
import problemService from '../services/problemService';
import { COMPANIES } from '../constants';
import toast from 'react-hot-toast';

const COMPANY_ICONS = {
  Google:    '🔵',
  Amazon:    '🟠',
  Microsoft: '🟦',
  Adobe:     '🔴',
  Uber:      '⬛',
  Flipkart:  '🟡',
  Atlassian: '🔷',
  Oracle:    '🔶',
  Apple:     '⬜',
  Meta:      '🟣',
  Netflix:   '🔴',
};

const Companies = () => {
  const [problems, setProblems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyStats, setCompanyStats] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await problemService.getProblems({ limit: 1000 });
        const all = res.data || [];
        setProblems(all);

        // Build stats per company
        const stats = COMPANIES.map((company) => {
          const tagged = all.filter((p) => p.companies?.includes(company));
          const solved = tagged.filter((p) =>
            ['Solved', 'Revised'].includes(p.status)
          );
          return {
            name: company,
            total: tagged.length,
            solved: solved.length,
            easy:   tagged.filter((p) => p.difficulty === 'Easy').length,
            medium: tagged.filter((p) => p.difficulty === 'Medium').length,
            hard:   tagged.filter((p) => p.difficulty === 'Hard').length,
          };
        });

        setCompanyStats(stats);
      } catch {
        toast.error('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const selectedProblems = selected
    ? problems.filter((p) => p.companies?.includes(selected))
    : [];

  if (loading) {
    return (
      <DashboardLayout title="Companies">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent
                          rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Companies">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Companies</h2>
        <p className="text-gray-400 text-sm mt-1">
          Problems tagged by company
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Company Grid */}
        <div className="lg:col-span-1">
          <div className="grid grid-cols-1 gap-3">
            {companyStats.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelected(selected === c.name ? null : c.name)}
                className={`w-full text-left bg-gray-900 border rounded-2xl p-4
                            transition ${
                  selected === c.name
                    ? 'border-violet-500 bg-violet-500/5'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {COMPANY_ICONS[c.name] || '🏢'}
                    </span>
                    <div>
                      <p className="text-white font-medium text-sm">{c.name}</p>
                      <p className="text-gray-500 text-xs">
                        {c.solved}/{c.total} solved
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-1">
                      {c.easy > 0 && (
                        <span className="text-xs bg-green-500/20 text-green-400
                                         px-1.5 py-0.5 rounded">
                          {c.easy}E
                        </span>
                      )}
                      {c.medium > 0 && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400
                                         px-1.5 py-0.5 rounded">
                          {c.medium}M
                        </span>
                      )}
                      {c.hard > 0 && (
                        <span className="text-xs bg-red-500/20 text-red-400
                                         px-1.5 py-0.5 rounded">
                          {c.hard}H
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {c.total > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-800 rounded-full h-1">
                      <div
                        className="bg-violet-500 h-1 rounded-full transition-all"
                        style={{
                          width: `${Math.round((c.solved / c.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Problem List */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl
                            flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-4xl mb-3">🏢</p>
                <p className="text-gray-400 text-sm">
                  Select a company to see its problems
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-800 flex items-center
                              justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{COMPANY_ICONS[selected]}</span>
                  <h3 className="text-white font-semibold">{selected}</h3>
                  <span className="text-gray-500 text-sm">
                    ({selectedProblems.length} problems)
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-500 hover:text-white text-sm transition"
                >
                  ✕
                </button>
              </div>

              {selectedProblems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-gray-400 text-sm">
                    No problems tagged with {selected}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Tag problems from the Problems page
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {selectedProblems.map((p) => (
                    <div
                      key={p._id}
                      className="px-5 py-3.5 flex items-center justify-between
                                 hover:bg-gray-800/40 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium truncate">
                            {p.title}
                          </p>
                          {p.isFavorite && (
                            <span className="text-yellow-400 text-xs">⭐</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {p.topic} · {p.platform}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Badge
                          label={p.difficulty}
                          color={
                            p.difficulty === 'Easy'   ? 'green'  :
                            p.difficulty === 'Medium' ? 'yellow' : 'red'
                          }
                        />
                        <Badge
                          label={p.status}
                          color={
                            p.status === 'Solved'        ? 'green'  :
                            p.status === 'Revised'       ? 'blue'   :
                            p.status === 'Need Revision' ? 'yellow' : 'gray'
                          }
                        />
                        {p.problemLink && (
                          
                            href={p.problemLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-500 hover:text-blue-400 transition"
                          >
                            🔗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Companies;