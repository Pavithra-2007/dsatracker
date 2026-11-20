import api from './api';

const problemService = {
  getProblems: async (params = {}) => {
    const res = await api.get('/problems', { params });
    return res.data;
  },

  getAllProblems: async (params = {}) => {
    const firstPage = await problemService.getProblems({ ...params, page: 1, limit: 100 });
    const problems = [...(firstPage.data || [])];
    for (let page = 2; page <= (firstPage.pagination?.pages || 1); page += 1) {
      const result = await problemService.getProblems({ ...params, page, limit: 100 });
      problems.push(...(result.data || []));
    }
    return { ...firstPage, data: problems };
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
