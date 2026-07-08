import api from './api';

const topicService = {
  getTopics: async () => {
    const res = await api.get('/topics');
    return res.data;
  },
};

export default topicService;