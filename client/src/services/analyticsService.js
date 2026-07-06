import api from './api';

const analyticsService = {
  getAnalytics: async () => {
    const res = await api.get('/analytics');
    return res.data;
  },

  getHeatmap: async () => {
    const res = await api.get('/analytics/heatmap');
    return res.data;
  },
};

export default analyticsService;