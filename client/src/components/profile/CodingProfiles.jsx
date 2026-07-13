import { useState } from 'react';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const PLATFORMS = [
  {
    key:         'leetcode',
    label:       'LeetCode',
    icon:        '🟡',
    color:       'text-yellow-400',
    border:      'border-yellow-500/30',
    bg:          'bg-yellow-500/5',
    placeholder: 'username',
    baseUrl:     'https://leetcode.com/',
  },
  {
    key:         'github',
    label:       'GitHub',
    icon:        '⚫',
    color:       'text-gray-300',
    border:      'border-gray-500/30',
    bg:          'bg-gray-500/5',
    placeholder: 'username',
    baseUrl:     'https://github.com/',
  },
  {
    key:         'codeforces',
    label:       'Codeforces',
    icon:        '🔵',
    color:       'text-blue-400',
    border:      'border-blue-500/30',
    bg:          'bg-blue-500/5',
    placeholder: 'handle',
    baseUrl:     'https://codeforces.com/profile/',
  },
  {
    key:         'gfg',
    label:       'GeeksforGeeks',
    icon:        '🟢',
    color:       'text-green-400',
    border:      'border-green-500/30',
    bg:          'bg-green-500/5',
    placeholder: 'username',
    baseUrl:     'https://auth.geeksforgeeks.org/user/',
  },
  {
    key:         'hackerrank',
    label:       'HackerRank',
    icon:        '🟩',
    color:       'text-emerald-400',
    border:      'border-emerald-500/30',
    bg:          'bg-emerald-500/5',
    placeholder: 'username',
    baseUrl:     'https://www.hackerrank.com/',
  },
];

const CodingProfiles = ({ user, updateUser }) => {
  const [form, setForm] = useState({
    leetcode:   { username: user?.codingProfiles?.leetcode?.username   || '', url: user?.codingProfiles?.leetcode?.url   || '' },
    github:     { username: user?.codingProfiles?.github?.username     || '', url: user?.codingProfiles?.github?.url     || '' },
    codeforces: { username: user?.codingProfiles?.codeforces?.username || '', url: user?.codingProfiles?.codeforces?.url || '' },
    gfg:        { username: user?.codingProfiles?.gfg?.username        || '', url: user?.codingProfiles?.gfg?.url        || '' },
    hackerrank: { username: user?.codingProfiles?.hackerrank?.username || '', url: user?.codingProfiles?.hackerrank?.url || '' },
  });

  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleUsernameChange = (key, value, baseUrl) => {
    setForm((prev) => ({
      ...prev,
      [key]: {
        username: value,
        url:      value ? `${baseUrl}${value}` : '',
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authService.updateProfile({ codingProfiles: form });
      updateUser(res.data);
      toast.success('Coding profiles saved!');
      setEditMode(false);
    } catch {
      toast.error('Failed to save profiles');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-white font-semibold text-lg">🖥️ Coding Profiles</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Link your competitive programming accounts
          </p>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`text-sm px-3 py-1.5 rounded-lg transition ${
            editMode
              ? 'bg-gray-800 text-gray-400 hover:text-white'
              : 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'
          }`}
        >
          {editMode ? 'Cancel' : '✏️ Edit'}
        </button>
      </div>

      {/* Platform Cards */}
      <div className="space-y-3">
        {PLATFORMS.map((p) => {
          const profile = form[p.key];
          const hasProfile = !!profile.username;

          return (
            <div
              key={p.key}
              className={`border rounded-xl p-4 transition ${
                hasProfile ? `${p.border} ${p.bg}` : 'border-gray-800 bg-gray-800/30'
              }`}
            >
              <div className="flex items-center justify-between">

                {/* Left: Icon + Label */}
                <div className="flex items-center gap-3">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${hasProfile ? p.color : 'text-gray-400'}`}>
                      {p.label}
                    </p>
                    {hasProfile && !editMode && (
                      <p className="text-gray-500 text-xs mt-0.5">
                        @{profile.username}
                      </p>
                    )}
                    {!hasProfile && !editMode && (
                      <p className="text-gray-600 text-xs mt-0.5">Not connected</p>
                    )}
                  </div>
                </div>

                {/* Right: Open button or input */}
                {!editMode && hasProfile && (
                  <a
                    href={profile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-gray-800
                               hover:bg-gray-700 text-gray-300 px-3 py-1.5
                               rounded-lg transition"
                  >
                    Open ↗
                  </a>
                )}
              </div>

              {/* Edit Input */}
              {editMode && (
                <div className="mt-3">
                  <input
                    value={profile.username}
                    onChange={(e) =>
                      handleUsernameChange(p.key, e.target.value, p.baseUrl)
                    }
                    placeholder={`Enter ${p.label} ${p.placeholder}`}
                    className="w-full bg-gray-800 border border-gray-700 text-white
                               rounded-lg px-3 py-2 text-sm placeholder-gray-500
                               focus:outline-none focus:border-violet-500 transition"
                  />
                  {profile.url && (
                    <p className="text-gray-600 text-xs mt-1 truncate">
                      {profile.url}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      {editMode && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50
                     text-white font-semibold py-2.5 rounded-xl transition"
        >
          {saving ? 'Saving...' : 'Save Profiles'}
        </button>
      )}

    </div>
  );
};

export default CodingProfiles;