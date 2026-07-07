import { useState } from 'react';
import { TOPICS, PLATFORMS, DIFFICULTIES, STATUSES, COMPANIES } from '../../constants';
import toast from 'react-hot-toast';

const defaultForm = {
  title: '',
  platform: 'LeetCode',
  difficulty: 'Medium',
  topic: 'Arrays',
  subtopic: '',
  status: 'Not Started',
  dateSolved: '',
  timeTaken: '',
  attempts: 1,
  problemLink: '',
  codeLink: '',
  notes: '',
  companies: [],
  tags: '',
  isFavorite: false,
  isBookmarked: false,
};

const ProblemForm = ({ onSubmit, initialData = null, loading = false }) => {
  const [form, setForm] = useState(
    initialData
      ? {
          ...initialData,
          dateSolved: initialData.dateSolved
            ? new Date(initialData.dateSolved).toISOString().split('T')[0]
            : '',
          tags: initialData.tags?.join(', ') || '',
        }
      : defaultForm
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleCompany = (company) => {
    setForm((prev) => ({
      ...prev,
      companies: prev.companies.includes(company)
        ? prev.companies.filter((c) => c !== company)
        : [...prev.companies, company],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const payload = {
      ...form,
      timeTaken: Number(form.timeTaken) || 0,
      attempts: Number(form.attempts) || 1,
      tags: form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      dateSolved: form.status === 'Solved' && form.dateSolved
        ? form.dateSolved
        : form.status === 'Solved'
        ? new Date().toISOString()
        : null,
    };

    onSubmit(payload);
  };

  const inputClass = `w-full bg-gray-800 border border-gray-700 text-white rounded-xl
    px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none
    focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition`;

  const labelClass = 'block text-sm font-medium text-gray-400 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Title */}
      <div>
        <label className={labelClass}>Problem Title *</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Two Sum"
          required
          className={inputClass}
        />
      </div>

      {/* Row: Platform + Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Platform</label>
          <select name="platform" value={form.platform} onChange={handleChange} className={inputClass}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Difficulty</label>
          <select name="difficulty" value={form.difficulty} onChange={handleChange} className={inputClass}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Row: Topic + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Topic</label>
          <select name="topic" value={form.topic} onChange={handleChange} className={inputClass}>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Row: Subtopic + Date Solved */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Subtopic</label>
          <input
            name="subtopic"
            value={form.subtopic}
            onChange={handleChange}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        {form.status === 'Solved' && (
          <div>
            <label className={labelClass}>Date Solved</label>
            <input
              name="dateSolved"
              type="date"
              value={form.dateSolved}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Row: Time Taken + Attempts */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Time Taken (mins)</label>
          <input
            name="timeTaken"
            type="number"
            value={form.timeTaken}
            onChange={handleChange}
            placeholder="0"
            min="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Attempts</label>
          <input
            name="attempts"
            type="number"
            value={form.attempts}
            onChange={handleChange}
            placeholder="1"
            min="1"
            className={inputClass}
          />
        </div>
      </div>

      {/* Row: Problem Link + Code Link */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Problem Link</label>
          <input
            name="problemLink"
            value={form.problemLink}
            onChange={handleChange}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Code Link</label>
          <input
            name="codeLink"
            value={form.codeLink}
            onChange={handleChange}
            placeholder="https://github.com/..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelClass}>Tags (comma separated)</label>
        <input
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="e.g. two-pointer, hashmap"
          className={inputClass}
        />
      </div>

      {/* Companies */}
      <div>
        <label className={labelClass}>Companies Asked</label>
        <div className="flex flex-wrap gap-2">
          {COMPANIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCompany(c)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                form.companies.includes(c)
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes (Markdown supported)</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Write your approach, observations..."
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Checkboxes */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isFavorite"
            checked={form.isFavorite}
            onChange={handleChange}
            className="w-4 h-4 accent-violet-500"
          />
          <span className="text-gray-400 text-sm">⭐ Favorite</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isBookmarked"
            checked={form.isBookmarked}
            onChange={handleChange}
            className="w-4 h-4 accent-violet-500"
          />
          <span className="text-gray-400 text-sm">🔖 Bookmark</span>
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50
                   text-white font-semibold py-3 rounded-xl transition"
      >
        {loading
          ? 'Saving...'
          : initialData
          ? 'Update Problem'
          : 'Add Problem'}
      </button>

    </form>
  );
};

export default ProblemForm;