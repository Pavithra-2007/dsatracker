import api from './api';

const contestService = {
  getContests: async () => {
    const res = await api.get('/contests');
    return res.data;
  },

  createContest: async (data) => {
    const res = await api.post('/contests', data);
    return res.data;
  },

  updateContest: async (id, data) => {
    const res = await api.put(`/contests/${id}`, data);
    return res.data;
  },

  deleteContest: async (id) => {
    const res = await api.delete(`/contests/${id}`);
    return res.data;
  },
};

export default contestService;