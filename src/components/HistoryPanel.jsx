import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';
import { api } from '../lib/api';

export default function HistoryPanel({ isOpen, onClose, messages, setMessages, onConversationLoad }) {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: api.getConversations,
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id) => api.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
    },
  });

  const handleLoadConversation = async (id) => {
    try {
      const conversation = await api.getConversation(id);
      if (conversation.messages) {
        onConversationLoad(conversation);
        onClose();
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      alert('Failed to load conversation');
    }
  };

  const handleDeleteConversation = (id) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteConversationMutation.mutate(id);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedMessages = JSON.parse(e.target.result);
          setMessages(importedMessages);
          onClose();
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chat History</SheetTitle>
          <SheetDescription>
            View or load your saved conversations
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              className="flex-1"
              variant="outline"
              disabled={messages.length === 0}
            >
              <i className="fas fa-download mr-2"></i>
              Export
            </Button>
            <label className="flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <div>
                  <i className="fas fa-upload mr-2"></i>
                  Import
                </div>
              </Button>
            </label>
          </div>

          <div className="space-y-2 mt-4">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Saved Conversations</h3>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="p-3 rounded-lg bg-muted flex justify-between items-center hover:bg-muted/80 cursor-pointer"
                  onClick={() => handleLoadConversation(conv.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">{conv.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(conv.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
