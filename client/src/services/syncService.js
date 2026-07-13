import api from './api';

const syncService = {
  syncLeetCode: async (username = '') => {
    const res = await api.post('/sync/leetcode', { username });
    return res.data;
  },

  syncContests: async (username = '') => {
    const res = await api.post('/sync/leetcode/contests', { username });
    return res.data;
  },
};

export default syncService;