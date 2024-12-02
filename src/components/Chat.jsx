import { useState, useRef, useEffect } from 'react';
import { API_ENDPOINT, DEFAULT_MODEL, SYSTEM_PROMPT } from '../constants';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import HistoryPanel from './HistoryPanel';
import ModelSelector from './ModelSelector'; // Import ModelSelector

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [darkMode, setDarkMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
  };

  const sendMessage = async (content) => {
    if (!content.trim()) return;

    const newMessage = { role: 'user', content };
    setMessages(prev => [...prev, newMessage]);
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
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.'
      }]);
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
      />
    </div>
  );
}
