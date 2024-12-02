import { useState } from 'react';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';

export default function HistoryPanel({ isOpen, onClose, messages, setMessages }) {
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
            View, export, or import your chat history
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              className="flex-1"
              variant="outline"
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
            {messages.map((msg, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-muted"
              >
                <div className="font-medium text-sm text-muted-foreground mb-1">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="text-sm line-clamp-2">
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
