import api from './api';

export const chatApi = {
  getMessages: async () => {
    return api.get('/messages');
  },

  sendMessageStream: async ({ question, onMetadata, onChunk, onDone, onError }) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'metadata' && onMetadata) {
                onMetadata(data);
              } else if (data.type === 'chunk' && onChunk) {
                onChunk(data.text);
              } else if (data.type === 'done' && onDone) {
                onDone(data);
              }
            } catch (err) {
              console.warn('[SSE Parse Warning]:', err);
            }
          }
        }
      }
    } catch (error) {
      if (onError) onError(error);
    }
  },
};
