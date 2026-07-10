import api from './api';

const fetchService = {
  preview: async (platform, identifier) => {
    const res = await api.post('/fetch/preview', { platform, identifier });
    return res.data;
  },

  save: async (payload) => {
    const res = await api.post('/fetch/save', payload);
    return res.data;
  },
};

export default fetchService;