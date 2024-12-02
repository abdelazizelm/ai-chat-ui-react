import { useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';

export default function MessageList({ messages, isLoading }) {
  useEffect(() => {
    Prism.highlightAll();
  }, [messages]);

  const formatMessage = (content) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }

      // Add code block
      const language = match[1] || 'plaintext';
      const code = match[2].trim();
      parts.push({
        type: 'code',
        language,
        content: code
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return parts;
  };

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <Card
          key={index}
          className={`${
            message.role === 'user' ? 'bg-primary/10' : 'bg-muted'
          }`}
        >
          <CardContent className="p-4">
            <div className="font-semibold mb-2 text-left">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="prose dark:prose-invert max-w-none text-left">
              {formatMessage(message.content).map((part, i) => (
                part.type === 'code' ? (
                  <div key={i}>
                    <div className="language-header">{part.language}</div>
                    <pre className="relative group">
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigator.clipboard.writeText(part.content)}
                          className="p-1 rounded hover:bg-white/10"
                          title="Copy code"
                        >
                          <i className="fas fa-copy text-gray-400"></i>
                        </button>
                      </div>
                      <code className={`language-${part.language}`}>
                        {part.content}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <p key={i} className="whitespace-pre-wrap">
                    {part.content}
                  </p>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      {isLoading && (
        <Card className="bg-muted">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="animate-pulse w-2 h-2 bg-primary rounded-full"></div>
              <div className="animate-pulse w-2 h-2 bg-primary rounded-full delay-150"></div>
              <div className="animate-pulse w-2 h-2 bg-primary rounded-full delay-300"></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
