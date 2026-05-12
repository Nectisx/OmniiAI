import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LLMModel, LLMProvider } from '@omniai/types';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format token count for display */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

/** Format relative time */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return 'Hier';
  return `Il y a ${days}j`;
}

/** Get display name for a model */
export function getModelDisplayName(model: string): string {
  const names: Record<string, string> = {
    [LLMModel.GEMINI_2_FLASH]: 'Gemini 2.0 Flash',
    [LLMModel.LLAMA_3_3_70B]: 'Llama 3.3 70B',
    [LLMModel.GPT_4O]: 'GPT-4o',
  };
  return names[model] || model;
}

/** Get provider color */
export function getProviderColor(provider: LLMProvider | string): string {
  const colors: Record<string, string> = {
    [LLMProvider.GEMINI]: '#1a73e8',
    [LLMProvider.GROQ]: '#7B4FD4',
    [LLMProvider.OPENAI]: '#10a37f',
  };
  return colors[provider] || '#00B4CC';
}

/** Get model color */
export function getModelColor(model: string): string {
  const colors: Record<string, string> = {
    [LLMModel.GEMINI_2_FLASH]: '#1a73e8',
    [LLMModel.LLAMA_3_3_70B]: '#7B4FD4',
    [LLMModel.GPT_4O]: '#10a37f',
  };
  return colors[model] || '#00B4CC';
}

/** Simple markdown to HTML converter for chat messages */
export function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/** Format file size */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
