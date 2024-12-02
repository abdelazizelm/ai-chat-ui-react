export class ChatState {
  constructor() {
    this.loadState();
    this.initializeState();
  }

  initializeState() {
    if (!this.conversations || !Array.isArray(this.conversations)) {
      this.conversations = [];
    }
    if (!this.currentConversationId || !this.getCurrentConversation()) {
      this.startNewConversation();
    }
  }

  loadState() {
    try {
      const savedState = localStorage.getItem('chatState');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.conversations = state.conversations || [];
        this.currentConversationId = state.currentConversationId;
        this.darkMode = state.darkMode || false;
        this.showingHistory = false;
      } else {
        this.conversations = [];
        this.currentConversationId = null;
        this.darkMode = false;
        this.showingHistory = false;
      }
    } catch (error) {
      console.error('Error loading state:', error);
      this.conversations = [];
      this.currentConversationId = null;
      this.darkMode = false;
      this.showingHistory = false;
    }
  }

  saveState() {
    try {
      const state = {
        conversations: this.conversations,
        currentConversationId: this.currentConversationId,
        darkMode: this.darkMode
      };
      localStorage.setItem('chatState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  getCurrentConversation() {
    return this.conversations.find(c => c.id === this.currentConversationId);
  }

  startNewConversation() {
    const conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      timestamp: new Date().toISOString()
    };
    this.conversations.unshift(conversation);
    this.currentConversationId = conversation.id;
    this.saveState();
    return conversation;
  }

  addMessage(message) {
    const conversation = this.getCurrentConversation();
    if (!conversation) {
      throw new Error('No active conversation');
    }
    conversation.messages.push(message);
    
    // Update conversation title based on first user message
    if (message.role === 'user' && conversation.messages.length === 1) {
      conversation.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
    }
    
    this.saveState();
  }

  deleteConversation(id) {
    const index = this.conversations.findIndex(c => c.id === id);
    if (index !== -1) {
      this.conversations.splice(index, 1);
      if (id === this.currentConversationId) {
        this.currentConversationId = this.conversations[0]?.id || null;
        if (!this.currentConversationId) {
          this.startNewConversation();
        }
      }
      this.saveState();
    }
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    document.documentElement.classList.toggle('dark', this.darkMode);
    this.saveState();
  }
}
