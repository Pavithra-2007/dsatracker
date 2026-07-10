import { useState } from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import fetchService from '../../services/fetchService';
import toast from 'react-hot-toast';

const SUPPORTED_PLATFORMS = ['LeetCode'];
// Add 'GeeksforGeeks', 'Codeforces', 'HackerRank' here when backend supports them

const STEP = {
  INPUT:   'input',
  PREVIEW: 'preview',
  SAVING:  'saving',
};

const AddProblemModal = ({ isOpen, onClose, onSaved }) => {
  const [step, setStep]           = useState(STEP.INPUT);
  const [platform, setPlatform]   = useState('LeetCode');
  const [identifier, setIdentifier] = useState('');
  const [fetching, setFetching]   = useState(false);
  const [preview, setPreview]     = useState(null);

  // Extra fields user can optionally fill after preview
  const [notes, setNotes]         = useState('');
  const [timeTaken, setTimeTaken] = useState('');

  const reset = () => {
    setStep(STEP.INPUT);
    setPlatform('LeetCode');
    setIdentifier('');
    setPreview(null);
    setNotes('');
    setTimeTaken('');
    setFetching(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Step 1: Fetch Preview ──────────────────────────────────────────────
  const handleFetch = async () => {
    if (!identifier.trim()) {
      toast.error('Enter a problem number or slug');
      return;
    }

    setFetching(true);
    try {
      const res = await fetchService.preview(platform, identifier.trim());
      const data = res.data;

      if (data.alreadyAdded) {
        toast.error(`"${data.title}" is already in your list!`);
        setFetching(false);
        return;
      }

      setPreview(data);
      setStep(STEP.PREVIEW);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch problem');
    } finally {
      setFetching(false);
    }
  };

  // ── Step 2: Confirm Save ───────────────────────────────────────────────
  const handleSave = async () => {
    setStep(STEP.SAVING);
    try {
      await fetchService.save({
        platform,
        identifier: identifier.trim(),
        notes,
        timeTaken: Number(timeTaken) || 0,
        status: 'Solved',
      });

      toast.success(`"${preview.title}" saved! 🎉`);
      onSaved();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save problem');
      setStep(STEP.PREVIEW);
    }
  };

  const difficultyColor =
    preview?.difficulty === 'Easy'   ? 'green'  :
    preview?.difficulty === 'Medium' ? 'yellow' : 'red';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Problem"
      size="md"
    >

      {/* ── Step 1: Input ── */}
      {step === STEP.INPUT && (
        <div className="space-y-5">
          <p className="text-gray-400 text-sm">
            Enter the platform and problem number or slug.
            We'll fetch all details automatically.
          </p>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Platform
            </label>
            <div className="flex gap-2">
              {SUPPORTED_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                    platform === p
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
              {/* Coming soon */}
              {['GFG', 'Codeforces', 'HackerRank'].map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled
                  className="px-4 py-2 rounded-xl text-sm border border-gray-800
                             text-gray-700 cursor-not-allowed"
                  title="Coming soon"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Problem Identifier */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Problem Number or Slug
            </label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              placeholder="e.g.  1  or  two-sum"
              className="w-full bg-gray-800 border border-gray-700 text-white
                         rounded-xl px-4 py-3 text-sm placeholder-gray-500
                         focus:outline-none focus:border-violet-500
                         focus:ring-1 focus:ring-violet-500 transition"
              autoFocus
            />
            <p className="text-gray-600 text-xs mt-1.5">
              Enter a number like <span className="text-gray-400">1</span> or
              a slug like <span className="text-gray-400">two-sum</span>
            </p>
          </div>

          {/* Fetch Button */}
          <button
            onClick={handleFetch}
            disabled={fetching || !identifier.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50
                       disabled:cursor-not-allowed text-white font-semibold py-3
                       rounded-xl transition flex items-center justify-center gap-2"
          >
            {fetching ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent
                                 rounded-full animate-spin" />
                Fetching from {platform}...
              </>
            ) : (
              <>🔍 Fetch Problem Details</>
            )}
          </button>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === STEP.PREVIEW && preview && (
        <div className="space-y-5">

          {/* Problem Info Card */}
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500 text-xs">#{preview.problemId}</span>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{preview.platform}</span>
                </div>
                <h3 className="text-white font-bold text-lg leading-tight">
                  {preview.title}
                </h3>
              </div>
              <Badge label={preview.difficulty} color={difficultyColor} />
            </div>

            {/* Topics */}
            {preview.topics?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {preview.topics.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-violet-500/15 text-violet-400
                               px-2 py-0.5 rounded-lg"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Mapped Topic */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Saved under topic:</span>
              <span className="text-violet-400 font-medium">{preview.topic}</span>
            </div>

            {/* Link */}
            <a
              href={preview.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300
                         text-sm mt-3 transition"
            >
              🔗 Open on {preview.platform} ↗
            </a>
          </div>

          {/* Optional Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Time Taken (mins) — optional
              </label>
              <input
                type="number"
                value={timeTaken}
                onChange={(e) => setTimeTaken(e.target.value)}
                placeholder="How long did it take?"
                min="0"
                className="w-full bg-gray-800 border border-gray-700 text-white
                           rounded-xl px-4 py-2.5 text-sm placeholder-gray-500
                           focus:outline-none focus:border-violet-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Notes — optional
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Your approach, observations..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 text-white
                           rounded-xl px-4 py-2.5 text-sm placeholder-gray-500
                           focus:outline-none focus:border-violet-500 transition resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(STEP.INPUT)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300
                         font-medium py-3 rounded-xl transition"
            >
              ← Back
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white
                         font-semibold py-3 rounded-xl transition"
            >
              ✅ Save Problem
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Saving ── */}
      {step === STEP.SAVING && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent
                          rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Saving problem...</p>
        </div>
      )}

    </Modal>
  );
};

export default AddProblemModal;