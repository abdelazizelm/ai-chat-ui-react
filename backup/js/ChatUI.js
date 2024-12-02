import { UIUtils } from './UIUtils.js';
import { TYPING_DELAY } from '../script.js';

export class ChatUI {
  constructor(state, apiService) {
    this.state = state;
    this.api = apiService;
    this.isProcessing = false;
    this.initializeElements();
    this.setupEventListeners();
    this.checkOllamaServer();
    this.refreshChat();
    this.updateHistoryPanel();
  }

  initializeElements() {
    // Chat elements
    this.chatContainer = document.getElementById("chatContainer");
    this.messageInput = document.getElementById("messageInput");
    this.sendButton = document.getElementById("sendButton");
    
    // Header buttons and indicators
    this.newChatButton = document.getElementById("newChatButton");
    this.historyButton = document.getElementById("historyButton");
    this.themeButton = document.getElementById("themeButton");
    this.headerLoadingIndicator = document.getElementById("headerLoadingIndicator");
    this.messageLoadingIndicator = document.getElementById("messageLoadingIndicator");
    
    // History panel elements
    this.historyPanel = document.getElementById("historyPanel");
    this.historyList = document.getElementById("historyList");
    this.closeHistoryBtn = document.getElementById("closeHistoryBtn");

    // Check for required elements
    if (!this.chatContainer) {
      console.error("Chat container not found!");
      throw new Error("Chat container not found! Make sure the HTML has an element with id 'chatContainer'");
    }

    if (!this.messageInput || !this.sendButton) {
      console.error("Message input or send button not found!");
      throw new Error("Message input or send button not found! Make sure the HTML has elements with ids 'messageInput' and 'sendButton'");
    }

    if (!this.historyButton || !this.historyPanel) {
      console.error("History elements not found!");
    }
  }

  setupEventListeners() {
    // Send message listeners
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    this.sendButton.addEventListener("click", () => this.handleSendMessage());

    // New chat button
    this.newChatButton.addEventListener("click", () => {
      this.state.startNewConversation();
      this.refreshChat();
      this.updateHistoryPanel();
      if (this.state.showingHistory) {
        this.toggleHistoryPanel();
      }
    });

    // History button
    if (this.historyButton) {
      this.historyButton.addEventListener("click", () => this.toggleHistoryPanel());
    }

    // Theme button
    if (this.themeButton) {
      this.themeButton.addEventListener("click", () => {
        this.state.toggleDarkMode();
      });
    }

    // Close history button
    if (this.closeHistoryBtn) {
      this.closeHistoryBtn.addEventListener("click", () => {
        this.toggleHistoryPanel();
      });
    }

    // Input validation
    this.messageInput.addEventListener("input", () => {
      const isEmpty = !this.messageInput.value.trim();
      this.sendButton.disabled = isEmpty;
      this.sendButton.classList.toggle("opacity-50", isEmpty);
    });

    // Auto-resize input
    this.messageInput.addEventListener("input", () => {
      this.messageInput.style.height = 'auto';
      this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
    });
  }

  async checkOllamaServer() {
    try {
      await this.api.checkServer();
      this.showNotification('Connected to Ollama server', 'success');
    } catch (error) {
      this.showError(error.message);
      console.error('Server check failed:', error);
    }
  }

  refreshChat() {
    if (!this.chatContainer) return;
    
    this.chatContainer.innerHTML = '';
    const conversation = this.state.getCurrentConversation();
    if (conversation && conversation.messages) {
      conversation.messages.forEach(message => {
        this.appendMessage(message);
      });
    }
    this.scrollToBottom();
  }

  toggleHistoryPanel() {
    if (!this.historyPanel) return;
    
    this.state.showingHistory = !this.state.showingHistory;
    
    if (this.state.showingHistory) {
      this.updateHistoryPanel();
      this.historyPanel.classList.remove('translate-x-full');
      this.historyPanel.classList.add('translate-x-0');
    } else {
      this.historyPanel.classList.remove('translate-x-0');
      this.historyPanel.classList.add('translate-x-full');
    }
  }

  updateHistoryPanel() {
    if (!this.historyList) {
      console.error("History list element not found!");
      return;
    }
    
    this.historyList.innerHTML = '';
    
    if (!this.state.conversations || this.state.conversations.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'text-center text-gray-500 dark:text-gray-400 p-4';
      emptyState.textContent = 'No conversations yet';
      this.historyList.appendChild(emptyState);
      return;
    }
    
    this.state.conversations.forEach(conversation => {
      const item = document.createElement('div');
      item.className = `p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg mb-2 transition-colors ${
        conversation.id === this.state.currentConversationId ? 'bg-gray-200 dark:bg-gray-700' : ''
      }`;
      
      const title = document.createElement('div');
      title.className = 'font-medium truncate';
      title.textContent = conversation.title || 'New Conversation';
      
      const time = document.createElement('div');
      time.className = 'text-xs text-gray-500 dark:text-gray-400';
      time.textContent = UIUtils.formatTimestamp(new Date(conversation.timestamp));
      
      item.appendChild(title);
      item.appendChild(time);
      
      item.addEventListener('click', () => {
        this.state.currentConversationId = conversation.id;
        this.refreshChat();
        this.updateHistoryPanel();
        this.toggleHistoryPanel();
      });
      
      this.historyList.appendChild(item);
    });
  }

  appendMessage(message) {
    const messageElement = UIUtils.createMessageElement(message);
    this.chatContainer.appendChild(messageElement);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    
    // Manually trigger Prism highlighting
    if (typeof Prism !== 'undefined') {
      messageElement.querySelectorAll('pre code').forEach(block => {
        Prism.highlightElement(block);
      });
    }
    return messageElement;
  }

  scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  async handleSendMessage() {
    if (this.isProcessing) return;
    
    const content = this.messageInput.value.trim();
    if (!content) return;

    this.messageInput.value = '';
    this.messageInput.style.height = 'auto';
    this.isProcessing = true;
    this.setLoading(true);

    const userMessage = { role: 'user', content };
    this.state.addMessage(userMessage);
    this.appendMessage(userMessage);

    let assistantMessage = { role: 'assistant', content: '' };
    this.state.addMessage(assistantMessage);
    const messageElement = this.appendMessage(assistantMessage);

    try {
      const stream = this.api.streamResponse(this.state.getCurrentConversation().messages);
      for await (const chunk of stream) {
        assistantMessage.content += chunk;
        messageElement.querySelector('.message-content').innerHTML = 
          UIUtils.formatCode(assistantMessage.content);
        // Manually trigger Prism highlighting
        if (typeof Prism !== 'undefined') {
          messageElement.querySelectorAll('pre code').forEach(block => {
            Prism.highlightElement(block);
          });
        }
        this.scrollToBottom();
      }
    } catch (error) {
      this.showError(error.message);
      // Remove the failed assistant message
      this.state.getCurrentConversation().messages.pop();
      messageElement.remove();
    } finally {
      this.isProcessing = false;
      this.setLoading(false);
      this.state.saveState();
      this.updateHistoryPanel();
    }
  }

  setLoading(isLoading) {
    if (this.headerLoadingIndicator) {
      this.headerLoadingIndicator.classList.toggle("hidden", !isLoading);
    }
    if (this.messageLoadingIndicator) {
      this.messageLoadingIndicator.classList.toggle("hidden", !isLoading);
    }
    if (this.sendButton) {
      this.sendButton.disabled = isLoading;
      this.sendButton.classList.toggle("opacity-50", isLoading);
    }
    if (this.messageInput) {
      this.messageInput.disabled = isLoading;
    }
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.classList.add(
      "p-3",
      "mb-4",
      "bg-red-100",
      "dark:bg-red-900",
      "text-red-700",
      "dark:text-red-200",
      "rounded-lg",
      "animate-fade-in"
    );
    errorDiv.textContent = message;
    this.chatContainer.appendChild(errorDiv);
    this.scrollToBottom();
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 text-white transition-opacity duration-300 ${
      type === 'error' ? 'bg-red-500' : 'bg-green-500'
    }`;
    notification.textContent = message;
    
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    document.body.appendChild(notification);
    
    // Fade out and remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('opacity-0');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
}
