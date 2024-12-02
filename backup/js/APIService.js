import { API_ENDPOINT, DEFAULT_MODEL, SYSTEM_PROMPT } from '../script.js';

export class APIService {
  constructor() {
    this.baseUrl = 'http://localhost:11434/api';
    this.model = DEFAULT_MODEL;
  }

  async checkServer() {
    try {
      const response = await fetch(`${this.baseUrl}/tags`);
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const data = await response.json();
      const models = data.models || [];
      const modelExists = models.some(model => 
        model.name === this.model || 
        model.name.split(':')[0] === this.model.split(':')[0]
      );
      
      if (!modelExists) {
        throw new Error(`Model ${this.model} not found. Please run: ollama pull ${this.model}`);
      }
      return true;
    } catch (error) {
      console.error('Server check failed:', error);
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Could not connect to Ollama server. Please make sure Ollama is running:\n1. Open a terminal\n2. Run the command: ollama serve');
      }
      throw error;
    }
  }

  async* streamResponse(messages) {
    try {
      // Check server before making request
      await this.checkServer();

      // Format messages for Ollama API
      const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Add system prompt as the first message if not present
      if (formattedMessages.length === 0 || formattedMessages[0].role !== 'system') {
        formattedMessages.unshift({
          role: 'system',
          content: SYSTEM_PROMPT
        });
      }

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              if (json.error) {
                throw new Error(json.error);
              }
              if (json.message?.content) {
                yield json.message.content;
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
              throw new Error('Invalid response from server');
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      throw error;
    }
  }
}
