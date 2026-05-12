'use client';

import { motion } from 'framer-motion';
import { cn, getModelDisplayName, formatTokens } from '@/lib/utils';
import type { Message } from '@omniai/types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  streamContent?: string;
}

export function ChatMessage({ message, isStreaming, streamContent }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const content = isStreaming ? streamContent || '' : message.contenu;

  return (
    <motion.div
      className={cn('flex gap-3 mb-5', isUser && 'flex-row-reverse')}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white',
          isUser ? 'bg-violet-600' : 'bg-gradient-omni',
        )}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      <div className={cn('max-w-[76%]', isUser && 'items-end flex flex-col')}>
        {/* Meta */}
        <div className={cn('flex items-center gap-1.5 mb-1 text-[11px] text-[var(--text3)]', isUser && 'flex-row-reverse')}>
          <span>{isUser ? 'Vous' : (message.modeleUtilise ? getModelDisplayName(message.modeleUtilise) : 'Assistant')}</span>
          {!isUser && message.modeleUtilise && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg4)] border border-[var(--border)] text-[var(--cyan)]">
              {message.tokensConsommes > 0 ? `${formatTokens(message.tokensConsommes)} tokens` : 'AI'}
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            'rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed',
            isUser
              ? 'bg-[var(--cyan)] text-[#0a1520] font-medium'
              : 'bg-[var(--bg3)] border border-[var(--border)] text-[var(--text)]',
          )}
        >
          {/* File attachment badge */}
          {message.fichierJoint && (
            <div className="flex items-center gap-1.5 mb-2 p-1.5 rounded-lg bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.1)] text-[11px]">
              <span>📎</span>
              <span className="truncate max-w-[200px]">{message.fichierJoint}</span>
            </div>
          )}

          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <MessageContent content={content} isStreaming={isStreaming} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** Renders markdown content with syntax highlighting */
function MessageContent({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  // Parse code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          const lang = match?.[1] || '';
          const code = match?.[2] || '';
          return (
            <pre key={i} className="my-2 rounded-lg overflow-x-auto" style={{ background: '#070f1a', border: '1px solid var(--border)', padding: '12px' }}>
              {lang && (
                <div className="text-[10px] text-[var(--text3)] mb-2 font-mono uppercase tracking-wider">
                  {lang}
                </div>
              )}
              <code className="text-[12px] font-mono text-[#e2e8f0] leading-relaxed whitespace-pre">
                {code}
              </code>
            </pre>
          );
        }

        // Inline formatting
        const formatted = part
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code style="background:var(--bg4);border:1px solid var(--border);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;color:var(--cyan)">$1</code>')
          .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;margin:12px 0 6px;color:var(--text)">$1</h3>')
          .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:600;margin:14px 0 6px;color:var(--text)">$1</h2>')
          .replace(/^# (.+)$/gm, '<h1 style="font-size:18px;font-weight:700;margin:14px 0 8px;color:var(--text)">$1</h1>')
          .replace(/^- (.+)$/gm, '<li style="margin-bottom:3px;padding-left:4px">$1</li>')
          .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul style="padding-left:16px;margin:6px 0">${m}</ul>`)
          .replace(/\n\n/g, '<br/><br/>')
          .replace(/\n/g, '<br/>');

        return (
          <span key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      })}
      {isStreaming && (
        <span className="inline-block w-[2px] h-[14px] bg-[var(--cyan)] ml-0.5 animate-stream-cursor" />
      )}
    </>
  );
}

/** Typing indicator for when AI is generating */
export function TypingIndicator({ model }: { model?: string }) {
  return (
    <motion.div
      className="flex gap-3 mb-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-7 h-7 rounded-lg bg-gradient-omni flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
        AI
      </div>
      <div>
        <div className="text-[11px] text-[var(--text3)] mb-1">
          {model ? getModelDisplayName(model) : 'Assistant'}
        </div>
        <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3">
          <div className="flex gap-1 items-center">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
