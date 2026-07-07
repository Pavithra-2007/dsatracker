import { TOPICS, PLATFORMS, DIFFICULTIES, STATUSES, COMPANIES } from '../../constants';

const ProblemFilters = ({ filters, onChange, onReset }) => {
  const selectClass = `bg-gray-800 border border-gray-700 text-gray-300 rounded-xl
    px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition`;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex flex-wrap gap-3 items-center">

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search problems..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl
                     px-4 py-2 text-sm placeholder-gray-500 focus:outline-none
                     focus:border-violet-500 transition flex-1 min-w-48"
        />

        {/* Topic */}
        <select
          value={filters.topic || ''}
          onChange={(e) => onChange({ ...filters, topic: e.target.value })}
          className={selectClass}
        >
          <option value="">All Topics</option>
          {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Difficulty */}
        <select
          value={filters.difficulty || ''}
          onChange={(e) => onChange({ ...filters, difficulty: e.target.value })}
          className={selectClass}
        >
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Status */}
        <select
          value={filters.status || ''}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className={selectClass}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Platform */}
        <select
          value={filters.platform || ''}
          onChange={(e) => onChange({ ...filters, platform: e.target.value })}
          className={selectClass}
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Company */}
        <select
          value={filters.company || ''}
          onChange={(e) => onChange({ ...filters, company: e.target.value })}
          className={selectClass}
        >
          <option value="">All Companies</option>
          {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Favorite */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isFavorite === 'true'}
            onChange={(e) =>
              onChange({ ...filters, isFavorite: e.target.checked ? 'true' : '' })
            }
            className="w-4 h-4 accent-violet-500"
          />
          <span className="text-gray-400 text-sm">⭐ Favorites</span>
        </label>

        {/* Reset */}
        <button
          onClick={onReset}
          className="text-gray-400 hover:text-white text-sm px-3 py-2
                     bg-gray-800 rounded-xl border border-gray-700 transition"
        >
          Reset
        </button>

      </div>
    </div>
  );
};

export default ProblemFilters;