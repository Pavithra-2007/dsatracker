import api from './api';

const authService = {
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.removeItem('token');
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  },

  login: async (data) => {
    const res = await api.post('/auth/login', data);
    localStorage.removeItem('token');
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },
};

export default authService;
