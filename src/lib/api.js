const API_BASE = import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://localhost:3001/api';

export const api = {
  async getConversations() {
    const response = await fetch(`${API_BASE}/conversations`);
    if (!response.ok) {
      throw new Error(`Failed to get conversations: ${response.statusText}`);
    }
    return response.json();
  },

  async getConversation(id) {
    const response = await fetch(`${API_BASE}/conversations/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.statusText}`);
    }
    return response.json();
  },

  async createConversation(title, messages) {
    console.log('API: Creating conversation:', { title, messages });
    const response = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, messages }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create conversation: ${error.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('API: Create response:', result);
    return result;
  },

  async updateConversation(id, messages) {
    console.log('API: Updating conversation:', { id, messages });
    const response = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update conversation: ${error.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('API: Update response:', result);
    return result;
  },

  async deleteConversation(id) {
    const response = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`);
    }
    
    return response.json();
  },
};
