import api from './api';

const syncService = {
  syncLeetCode: async (username = '', sessionCookie = '') => {
    const res = await api.post('/sync/leetcode', { username, sessionCookie });
    return res.data;
  },

  syncContests: async (username = '') => {
    const res = await api.post('/sync/leetcode/contests', { username });
    return res.data;
  },
};

export default syncService;
