'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare, BarChart3, Settings, Plus, MoreHorizontal,
  Edit2, Trash2, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';
import { useChatStore } from '@/stores/chat.store';
import { useAuth } from '@/hooks/useAuth';
import { conversationApi } from '@/services/api.service';
import { useChat } from '@/hooks/useChat';
import { useT } from '@/lib/i18n';
import type { Conversation } from '@omniai/types';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const t = useT();
  const {
    activeConversationId,
    setActiveConversation,
    sidebarOpen,
    setSidebarOpen,
  } = useChatStore();
  const { deleteConversation, renameConversation } = useChat();
  const [contextMenu, setContextMenu] = useState<{ id: number; x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState<{ id: number; value: string } | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationApi.list(1, 50),
    refetchInterval: 30_000,
  });

  const conversations = data?.conversations || [];

  const handleNewChat = () => {
    setActiveConversation(null);
    router.push('/chat');
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv.id);
    router.push('/chat');
  };

  const handleDelete = (id: number) => {
    deleteConversation(id);
    setContextMenu(null);
  };

  const handleRenameSubmit = (id: number) => {
    if (renaming?.value.trim()) {
      renameConversation({ id, titre: renaming.value.trim() });
    }
    setRenaming(null);
  };

  const navItems = [
    { href: '/chat', icon: MessageSquare, label: t('nav.chat') },
    { href: '/dashboard', icon: BarChart3, label: t('nav.dashboard') },
    { href: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  const initials = user
    ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase()
    : 'AI';

  return (
    <>
      {/* Sidebar */}
      <motion.div
        className="h-full flex flex-col overflow-hidden border-r border-[var(--border)]"
        style={{ background: 'var(--bg2)' }}
        initial={false}
        animate={{ width: sidebarOpen ? 220 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <div className="flex-1 flex flex-col overflow-hidden min-w-[220px]">
          {/* Logo */}
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-omni flex items-center justify-center text-white font-bold text-sm">
                O
              </div>
              <span className="font-bold text-[var(--text)]">OmniAI</span>
            </div>
          </div>

          {/* New Chat */}
          <div className="p-3">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] bg-[var(--cyan)] text-[#0a1520] font-semibold text-sm hover:bg-[var(--cyan2)] transition-colors"
            >
              <Plus size={15} />
              {t('chat.newChat')}
            </button>
          </div>

          {/* Nav */}
          <nav className="px-2 pb-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5',
                  pathname.startsWith(item.href)
                    ? 'bg-[var(--bg4)] text-[var(--cyan)]'
                    : 'text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]',
                )}
              >
                <item.icon size={15} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Conversations */}
          <div className="px-3 pb-1 text-[11px] text-[var(--text3)] font-semibold uppercase tracking-wider">
            {t('chat.recent')}
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            <AnimatePresence>
              {conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={cn(
                    'group relative flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm mb-0.5',
                    activeConversationId === conv.id
                      ? 'bg-[var(--bg4)] text-[var(--text)] border-l-2 border-[var(--cyan)]'
                      : 'text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]',
                  )}
                  onClick={() => handleSelectConversation(conv)}
                >
                  {renaming?.id === conv.id ? (
                    <input
                      className="flex-1 bg-[var(--bg4)] border border-[var(--border2)] rounded px-1 py-0.5 text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                      value={renaming.value}
                      onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                      onBlur={() => handleRenameSubmit(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(conv.id);
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 truncate text-xs">
                      {truncate(conv.titre, 30)}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="hidden group-hover:flex items-center gap-0.5 ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenaming({ id: conv.id, value: conv.titre });
                      }}
                      className="p-0.5 hover:text-[var(--cyan)] text-[var(--text3)]"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(conv.id);
                      }}
                      className="p-0.5 hover:text-[var(--danger)] text-[var(--text3)]"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* User */}
          <div className="border-t border-[var(--border)] p-3">
            <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg3)] cursor-pointer group">
              <div className="w-7 h-7 rounded-full bg-gradient-omni flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[var(--text)] truncate">
                  {user?.prenom} {user?.nom}
                </div>
                <div className="text-[11px] text-[var(--text3)] truncate">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="hidden group-hover:block text-[var(--text3)] hover:text-[var(--danger)] text-[11px]"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-5 h-10 flex items-center justify-center bg-[var(--bg3)] border border-[var(--border)] rounded-r-lg text-[var(--text3)] hover:text-[var(--text)] transition-colors"
        style={{ left: sidebarOpen ? 220 : 0 }}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </>
  );
}
