import { useState } from 'react';
import syncService from '../../services/syncService';
import toast from 'react-hot-toast';

const LeetCodeSync = ({ savedUsername = '', onSynced }) => {
  const [username, setUsername]   = useState(savedUsername);
  const [syncing, setSyncing]     = useState(false);
  const [result, setResult]       = useState(null);

  const handleSync = async () => {
    if (!username.trim()) {
      toast.error('Enter your LeetCode username');
      return;
    }

    setSyncing(true);
    setResult(null);

    try {
      const res = await syncService.syncLeetCode(username.trim());
      const resultData = res.data;
      setResult(resultData);

      if (resultData.imported > 0) {
        toast.success(`✅ ${resultData.imported} new problems imported!`);
        onSynced?.();
      } else {
        toast.success('Already up to date!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20
                        rounded-xl flex items-center justify-center text-xl">
          🟡
        </div>
        <div>
          <h3 className="text-white font-semibold">LeetCode Sync</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Auto-import your solved problems from LeetCode
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSync()}
          placeholder="Your LeetCode username"
          className="flex-1 bg-gray-800 border border-gray-700 text-white
                     rounded-xl px-4 py-2.5 text-sm placeholder-gray-500
                     focus:outline-none focus:border-yellow-500 transition"
        />
        <button
          onClick={handleSync}
          disabled={syncing || !username.trim()}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400
                     disabled:opacity-50 disabled:cursor-not-allowed text-black
                     font-semibold px-5 py-2.5 rounded-xl transition whitespace-nowrap"
        >
          {syncing ? (
            <>
              <span className="w-4 h-4 border-2 border-black border-t-transparent
                               rounded-full animate-spin" />
              Syncing...
            </>
          ) : (
            '⚡ Sync Now'
          )}
        </button>
      </div>

      {/* Info note */}
      <p className="text-gray-600 text-xs mb-4">
        ℹ️ Fetches your last 20 accepted submissions. Only new problems are imported.
      </p>

      {/* Result Card */}
      {result && (
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{result.imported}</p>
              <p className="text-gray-500 text-xs mt-0.5">Imported</p>
            </div>
            <div className="text-center border-x border-gray-700">
              <p className="text-2xl font-bold text-gray-400">{result.skipped}</p>
              <p className="text-gray-500 text-xs mt-0.5">Already Existed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-400">{result.total}</p>
              <p className="text-gray-500 text-xs mt-0.5">Total Found</p>
            </div>
          </div>

          {/* Sync time */}
          <p className="text-gray-600 text-xs text-center">
            Sync completed in {((result.syncTime || 0) / 1000).toFixed(1)}s
          </p>

          {/* Newly imported problems list */}
          {result.problems?.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs font-medium mb-2">
                New problems imported:
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {result.problems.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs
                               bg-gray-700/50 rounded-lg px-3 py-2"
                  >
                    <span className="text-gray-300 truncate flex-1">{p.title}</span>
                    <span className={`ml-2 flex-shrink-0 font-medium ${
                      p.difficulty === 'Easy'   ? 'text-green-400'  :
                      p.difficulty === 'Medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {p.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default LeetCodeSync;