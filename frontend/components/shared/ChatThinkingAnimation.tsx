'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Sparkles } from 'lucide-react';
import { ChatBotAvatar } from './ChatBotAvatar';

interface ChatThinkingAnimationProps {
  action?: string;
  label?: string;
}

export function ChatThinkingAnimation({ action = 'thinking', label = 'Sedang menganalisis...' }: ChatThinkingAnimationProps) {
  const getIcon = () => {
    if (action === 'searching') return <Search className="w-3.5 h-3.5 text-lime-700 dark:text-brand animate-pulse" />;
    if (action === 'reading') return <FileText className="w-3.5 h-3.5 text-lime-700 dark:text-brand animate-pulse" />;
    return <Sparkles className="w-3.5 h-3.5 text-lime-700 dark:text-brand animate-spin" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 my-2 text-xs text-[var(--text-secondary)]"
    >
      <ChatBotAvatar size={24} />

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
        {getIcon()}
        <span className="font-mono text-xs text-lime-800 dark:text-brand/90 font-medium">{label}</span>
        <div className="flex items-center gap-1 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-600 dark:bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-lime-600 dark:bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-lime-600 dark:bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </motion.div>
  );
}
