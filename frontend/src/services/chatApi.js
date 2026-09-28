import api from './api';

export const chatApi = {
  getMessages: async () => {
    return api.get('/messages');
  },

  sendMessage: async (question) => {
    return api.post('/chat', { question });
  },
};
