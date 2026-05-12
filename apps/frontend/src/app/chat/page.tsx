'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, AlertTriangle } from 'lucide-react';
import { useChatStore } from '@/stores/chat.store';
import { useChat } from '@/hooks/useChat';
import { useQuotas } from '@/hooks/useQuotas';
import { ChatMessage, TypingIndicator } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { SessionInfoPanel } from '@/components/chat/SessionInfoPanel';
import { WelcomeScreen } from '@/components/chat/WelcomeScreen';
import { ModelSelectorModal } from '@/components/modals/ModelSelectorModal';
import { getModelDisplayName } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const {
    messages, isLoadingMessages, streaming,
    sessionTokens, sessionMessages, sendMessage,
  } = useChat();
  const {
    selectedModel, dynamicRouting, activeConversationId,
    infoPanelOpen, setInfoPanelOpen,
  } = useChatStore();
  const { isModelAvailable } = useQuotas();
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!showScrollBtn) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streaming.streamContent]);

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBtn(false);
  };

  const handleSuggestion = (prompt: string) => {
    sendMessage(prompt);
  };

  const modelAvailable = isModelAvailable(selectedModel);
  const hasMessages = messages.length > 0 || streaming.isStreaming;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] flex-shrink-0"
          style={{ background: 'var(--bg2)' }}
        >
          <div className="flex items-center gap-3">
            {/* Model selector button */}
            <button
              onClick={() => setModelModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] hover:border-[var(--border2)] transition-colors group"
            >
              <div className={cn('w-2 h-2 rounded-full', modelAvailable ? 'bg-green-500' : 'bg-red-500')} />
              <span className="text-[13px] font-medium text-[var(--text)]">
                {getModelDisplayName(selectedModel)}
              </span>
              <ChevronDown size={13} className="text-[var(--text3)] group-hover:text-[var(--text)] transition-colors" />
            </button>

            {/* Dynamic routing badge */}
            <div className={cn(
              'flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg',
              dynamicRouting
                ? 'text-[var(--cyan)] bg-[rgba(0,180,204,0.1)]'
                : 'text-[var(--text3)] bg-[var(--bg3)]',
            )}>
              <Zap size={11} />
              <span>Fallback: {dynamicRouting ? 'ON' : 'OFF'}</span>
            </div>

            {/* Warning if model unavailable */}
            {!modelAvailable && (
              <motion.div
                className="flex items-center gap-1.5 text-[11px] text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AlertTriangle size={11} />
                Quota épuisé
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInfoPanelOpen(!infoPanelOpen)}
              className="text-[12px] text-[var(--text3)] hover:text-[var(--text)] px-2 py-1 rounded-lg hover:bg-[var(--bg3)] transition-colors"
            >
              {infoPanelOpen ? 'Masquer' : 'Session Info'}
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin' }}
        >
          {!hasMessages ? (
            <WelcomeScreen onSuggestionClick={handleSuggestion} />
          ) : (
            <div className="max-w-3xl mx-auto px-5 py-6">
              {isLoadingMessages && (
                <div className="flex justify-center py-8">
                  <div className="flex gap-1">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Streaming message */}
              {streaming.isStreaming && (
                <>
                  {/* Model switch notification */}
                  {streaming.modelSwitched && streaming.previousModel && (
                    <motion.div
                      className="flex items-center gap-2 text-[11px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 mb-3"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Zap size={11} />
                      Fallback activé: {getModelDisplayName(streaming.previousModel)} → {getModelDisplayName(streaming.streamModel!)}
                    </motion.div>
                  )}

                  {streaming.streamContent ? (
                    <ChatMessage
                      message={{
                        id: -1,
                        conversationId: activeConversationId || 0,
                        role: 'assistant',
                        contenu: streaming.streamContent,
                        modeleUtilise: streaming.streamModel || selectedModel,
                        tokensConsommes: 0,
                        createdAt: new Date().toISOString(),
                      }}
                      isStreaming
                      streamContent={streaming.streamContent}
                    />
                  ) : (
                    <TypingIndicator model={streaming.streamModel || selectedModel} />
                  )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              onClick={scrollToBottom}
              className="absolute bottom-20 right-1/2 translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg4)] border border-[var(--border2)] text-[12px] text-[var(--text2)] hover:text-[var(--text)] shadow-lg z-10"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
            >
              <ChevronDown size={14} />
              Défiler vers le bas
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-[var(--border)]" style={{ background: 'var(--bg2)' }}>
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={sendMessage} disabled={streaming.isStreaming} />
          </div>
          <p className="text-center text-[10px] text-[var(--text3)] pb-2">
            OmniAI peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </div>

      {/* Session info panel */}
      <AnimatePresence>
        {infoPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex-shrink-0"
          >
            <SessionInfoPanel
              sessionTokens={sessionTokens}
              sessionMessages={sessionMessages}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model selector modal */}
      <ModelSelectorModal
        isOpen={modelModalOpen}
        onClose={() => setModelModalOpen(false)}
      />
    </div>
  );
}
