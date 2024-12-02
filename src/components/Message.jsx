import { useMemo } from 'react';

export default function Message({ role, content }) {
  const formattedContent = useMemo(() => {
    return content.split('```').map((part, index) => {
      if (index % 2 === 0) {
        // Regular text
        return (
          <div key={index} className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
            {part.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        );
      } else {
        // Code block
        const [lang, ...code] = part.split('\n');
        const codeContent = code.join('\n');
        
        return (
          <div key={index} className="my-4">
            <div className="code-block-header">
              <span>{lang}</span>
              <button
                onClick={() => navigator.clipboard.writeText(codeContent)}
                className="copy-button hover:text-white"
              >
                Copy
              </button>
            </div>
            <pre>
              <code className={`language-${lang}`}>{codeContent}</code>
            </pre>
          </div>
        );
      }
    });
  }, [content]);

  return (
    <div
      className={`p-4 rounded-lg ${
        role === 'user'
          ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100'
          : 'bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100'
      }`}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${
            role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-500 text-white'
          }`}
        >
          {role === 'user' ? '👤' : '🤖'}
        </div>
        <span className="font-medium capitalize text-gray-900 dark:text-gray-100">{role}</span>
      </div>
      <div className="message pl-8">{formattedContent}</div>
    </div>
  );
}
