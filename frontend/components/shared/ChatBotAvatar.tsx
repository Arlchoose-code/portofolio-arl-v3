import React from 'react';
import { Bot } from 'lucide-react';

interface ChatBotAvatarProps {
  size?: number;
  invert?: boolean;
}

export function ChatBotAvatar({ size = 32, invert = false }: ChatBotAvatarProps) {
  if (invert) {
    return (
      <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center shrink-0"
      >
        <Bot className="w-6 h-6 text-white dark:text-[#0a0a0a] transition-transform duration-300 group-hover:scale-110" />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-xl bg-gradient-to-br from-lime-600 to-emerald-700 dark:from-brand dark:to-[#84cc16] p-0.5 shadow-md flex items-center justify-center shrink-0"
    >
      <div className="w-full h-full rounded-[10px] bg-[var(--bg-surface)] dark:bg-[#121212] flex items-center justify-center">
        <Bot
          style={{ width: size * 0.62, height: size * 0.62 }}
          className="text-lime-700 dark:text-brand"
        />
      </div>
    </div>
  );
}
