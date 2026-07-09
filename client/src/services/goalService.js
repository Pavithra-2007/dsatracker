import api from './api';

const goalService = {
  getGoals: async () => {
    const res = await api.get('/goals');
    return res.data;
  },

  setGoal: async (data) => {
    const res = await api.post('/goals', data);
    return res.data;
  },
};

export default goalService;