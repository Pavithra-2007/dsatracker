import api from './api';

const revisionService = {
  getRevisions: async () => {
    const res = await api.get('/revision');
    return res.data;
  },

  markRevised: async (id) => {
    const res = await api.put(`/revision/${id}/mark`);
    return res.data;
  },

  skipRevision: async (id) => {
    const res = await api.put(`/revision/${id}/skip`);
    return res.data;
  },
};

export default revisionService;