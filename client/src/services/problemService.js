import api from './api';

const problemService = {
  getProblems: async (params = {}) => {
    const res = await api.get('/problems', { params });
    return res.data;
  },

  getProblemById: async (id) => {
    const res = await api.get(`/problems/${id}`);
    return res.data;
  },

  createProblem: async (data) => {
    const res = await api.post('/problems', data);
    return res.data;
  },

  updateProblem: async (id, data) => {
    const res = await api.put(`/problems/${id}`, data);
    return res.data;
  },

  deleteProblem: async (id) => {
    const res = await api.delete(`/problems/${id}`);
    return res.data;
  },
};

export default problemService;