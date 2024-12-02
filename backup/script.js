// Constants
export const API_ENDPOINT = "http://localhost:11434/api/generate";
export const DEFAULT_MODEL = "llama3.2:latest";
export const MAX_CONVERSATION_LENGTH = 100;
export const TYPING_DELAY = 50;

// System prompt for consistent AI behavior
export const SYSTEM_PROMPT = `You are a helpful and knowledgeable AI assistant. Follow these guidelines:

1. Code Formatting:
   - Always use markdown code blocks with language specification
   - Support languages: python, javascript, typescript, html, css, bash, git
   - Example: \`\`\`python\nprint("Hello")\`\`\`

2. Response Style:
   - Be concise and clear
   - Use proper formatting for technical terms using backticks
   - Break down complex explanations into steps
   - Include examples when relevant

3. Best Practices:
   - Provide working, production-ready code
   - Include necessary imports and dependencies
   - Add brief comments for complex logic
   - Follow modern coding conventions

4. When Dealing with Errors:
   - Explain the likely cause
   - Provide a solution
   - Show example of correct implementation`;

import { ChatState } from './js/ChatState.js';
import { ChatUI } from './js/ChatUI.js';
import { APIService } from './js/APIService.js';
import { UIUtils } from './js/UIUtils.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Create instances of our core services
  const state = new ChatState();
  const apiService = new APIService();
  
  // Initialize UI with dependencies
  const ui = new ChatUI(state, apiService);
  
  // Set initial dark mode state
  document.documentElement.classList.toggle('dark', state.darkMode);
});