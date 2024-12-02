import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINT, DEFAULT_MODEL, SYSTEM_PROMPT } from '../constants';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import HistoryPanel from './HistoryPanel';
import ModelSelector from './ModelSelector';
import { api } from '../lib/api';

export default function Chat() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [darkMode, setDarkMode] = useState(() => {
    // Try to get theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
    // Check system preference if no saved theme
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const createConversationMutation = useMutation({
    mutationFn: async ({ title, messages }) => {
      console.log('Creating conversation with:', { title, messages });
      const response = await api.createConversation(title, messages);
      console.log('Create response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('Conversation created successfully:', data);
      setCurrentConversationId(data.id);
      queryClient.invalidateQueries(['conversations']);
    },
    onError: (error) => {
      console.error('Error creating conversation:', error);
    }
  });

  const updateConversationMutation = useMutation({
    mutationFn: async ({ id, messages }) => {
      console.log('Updating conversation:', { id, messages });
      const response = await api.updateConversation(id, messages);
      console.log('Update response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('Conversation updated successfully');
      queryClient.invalidateQueries(['conversations']);
    },
    onError: (error) => {
      console.error('Error updating conversation:', error);
    }
  });

  // Auto-save effect
  useEffect(() => {
    const autoSave = async () => {
      console.log('Auto-save triggered', { messages, currentConversationId });
      
      if (messages.length === 0) {
        console.log('No messages to save');
        return;
      }

      try {
        if (!currentConversationId) {
          // Create new conversation
          console.log('Creating new conversation');
          const title = messages[0].content.slice(0, 50) + '...';
          await createConversationMutation.mutateAsync({ 
            title, 
            messages 
          });
          console.log('New conversation created');
        } else {
          // Update existing conversation
          console.log('Updating conversation', currentConversationId);
          await updateConversationMutation.mutateAsync({
            id: currentConversationId,
            messages,
          });
          console.log('Conversation updated');
        }
      } catch (error) {
        console.error('Error saving conversation:', error);
      }
    };

    // Debounce auto-save to prevent too frequent updates
    const timeoutId = setTimeout(autoSave, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages, currentConversationId]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    // Save theme preference to localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const sendMessage = async (content) => {
    if (!content.trim()) return;

    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: content,
          system: SYSTEM_PROMPT,
          stream: false
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage = {
        role: 'assistant',
        content: data.response
      };
      
      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Save conversation
      if (currentConversationId) {
        updateConversationMutation.mutate({
          id: currentConversationId,
          messages: updatedMessages
        });
      } else {
        const title = content.slice(0, 50) + '...';
        createConversationMutation.mutate({
          title,
          messages: updatedMessages
        });
      }
    } catch (error) {
      console.error('Error:', error);
      const isRateLimit = error.message.toLowerCase().includes('rate limit');
      const errorMessage = isRateLimit
        ? 'Rate limit exceeded. Please wait about an hour or switch to a different model.'
        : 'Sorry, there was an error processing your request. Please try again.';
      
      const assistantMessage = {
        role: 'assistant',
        content: errorMessage
      };
      
      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Save conversation even when there's an error
      if (currentConversationId) {
        updateConversationMutation.mutate({
          id: currentConversationId,
          messages: updatedMessages
        });
      } else {
        const title = content.slice(0, 50) + '...';
        createConversationMutation.mutate({
          title,
          messages: updatedMessages
        });
      }

      // Show a toast or notification for rate limit
      if (isRateLimit) {
        // You can add a toast library here if you want
        console.warn('Rate limit exceeded. Please wait or switch models.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen p-4 bg-background">
      <header className="flex justify-between items-center mb-4 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Ollama Chat</h1>
          <ModelSelector value={model} onChange={setModel} />
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
          )}
          <Button
            onClick={handleNewChat}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span className="hidden sm:inline">New Chat</span>
          </Button>
          <Button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            variant="ghost"
            size="icon"
            className="w-9 h-9"
          >
            <i className="fas fa-history"></i>
          </Button>
          <Button
            onClick={() => setDarkMode(!darkMode)}
            variant="ghost"
            size="icon"
            className="w-9 h-9"
          >
            <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </Button>
        </div>
      </header>

      <Card className="flex-1 mb-4 overflow-hidden">
        <CardContent className="h-full overflow-y-auto p-4">
          <MessageList messages={messages} isLoading={isLoading} />
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <MessageInput onSend={sendMessage} disabled={isLoading} />
        </CardContent>
      </Card>

      <HistoryPanel 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        messages={messages}
        setMessages={setMessages}
        onConversationLoad={(conversation) => {
          setCurrentConversationId(conversation.id);
          setMessages(conversation.messages);
        }}
      />
    </div>
  );
}
