export class UIUtils {
  static formatTimestamp(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  static formatCode(text) {
    // Store code blocks temporarily
    const codeBlocks = [];
    let formattedText = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ lang: lang || 'plaintext', code: code.trim() });
      return placeholder;
    });

    // Store inline code temporarily
    const inlineCode = [];
    formattedText = formattedText.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `__INLINE_CODE_${inlineCode.length}__`;
      inlineCode.push(code);
      return placeholder;
    });

    // Escape HTML in the remaining text
    formattedText = this.escapeHtml(formattedText);

    // Format markdown headings
    formattedText = formattedText.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
      const level = hashes.length;
      const fontSize = {
        1: '3xl',
        2: '2xl',
        3: 'xl',
        4: 'lg',
        5: 'base',
        6: 'sm'
      }[level];
      return `<h${level} class="text-${fontSize} font-bold my-4">${content}</h${level}>`;
    });

    // Format bold text
    formattedText = formattedText.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');

    // Format italic text
    formattedText = formattedText.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

    // Format horizontal rules
    formattedText = formattedText.replace(/^={3,}$/gm, '<hr class="my-4 border-t border-gray-300 dark:border-gray-700">');

    // Format lists
    formattedText = formattedText.replace(/^\s*[-*]\s+(.+)$/gm, '<li class="ml-4">$1</li>');
    formattedText = formattedText.replace(/(<li[^>]*>.*<\/li>)\n(?=<li)/g, '$1');
    formattedText = formattedText.replace(/(<li[^>]*>.*<\/li>)+/g, '<ul class="list-disc my-2">$&</ul>');

    // Handle line breaks
    formattedText = formattedText.split('\n').join('<br>');

    // Restore code blocks
    codeBlocks.forEach((block, index) => {
      const uniqueId = 'code-' + Math.random().toString(36).substr(2, 9);
      const codeHtml = `
        <div class="code-block rounded-lg overflow-hidden my-4">
          <div class="code-block-header bg-gray-800 dark:bg-gray-900 text-gray-400 px-4 py-2 flex justify-between items-center">
            <span class="language-label text-sm">${block.lang}</span>
            <button class="copy-button hover:text-white transition-colors" onclick="navigator.clipboard.writeText(document.querySelector('#${uniqueId}').textContent)">
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <div class="bg-[#1a1a1a] dark:bg-black">
            <pre class="!m-0"><code id="${uniqueId}" class="!p-4 language-${block.lang}">${this.escapeHtml(block.code)}</code></pre>
          </div>
        </div>`;
      formattedText = formattedText.replace(`__CODE_BLOCK_${index}__`, codeHtml);
    });

    // Restore inline code
    inlineCode.forEach((code, index) => {
      const inlineHtml = `<code class="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">${this.escapeHtml(code)}</code>`;
      formattedText = formattedText.replace(`__INLINE_CODE_${index}__`, inlineHtml);
    });

    return formattedText;
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static createMessageElement(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm animate-fade-in';
    
    const roleIcon = document.createElement('div');
    roleIcon.className = 'flex items-center mb-2';
    roleIcon.innerHTML = message.role === 'user' 
      ? '<i class="fas fa-user text-blue-500"></i><span class="ml-2 font-medium">You</span>'
      : '<i class="fas fa-robot text-green-500"></i><span class="ml-2 font-medium">Assistant</span>';
    
    const content = document.createElement('div');
    content.className = 'message-content prose dark:prose-invert max-w-none';
    content.innerHTML = this.formatCode(message.content);
    
    messageElement.appendChild(roleIcon);
    messageElement.appendChild(content);
    
    return messageElement;
  }
}
