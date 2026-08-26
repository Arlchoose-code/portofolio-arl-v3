'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBotAvatar } from './ChatBotAvatar';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ConfirmDialog } from './ConfirmDialog';
import { chatApi, settingsApi } from '@/lib/api';
import { ChatMessage as ChatMessageType, ThinkingStep } from '@/types';
import { X, RefreshCw, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [thinkingStep, setThinkingStep] = useState<ThinkingStep | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Dynamic Persona State from Admin Settings
  const [botName, setBotName] = useState('AI Assistant');
  const [botGreeting, setBotGreeting] = useState(
    'Halo! Saya asisten AI portofolio Syahril Haryono. Ada yang ingin kamu ketahui tentang keahlian, pengalaman, atau proyek Syahril?'
  );

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef<boolean>(false);
  const charQueueRef = useRef<string[]>([]);
  const isTypingRef = useRef<boolean>(false);
  const streamDoneRef = useRef<boolean>(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const greetingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnimatedGreetingRef = useRef<boolean>(false);

  // Fetch Persona Info on Mount
  useEffect(() => {
    settingsApi.getPublicSiteInfo().then((res) => {
      if (res.status && res.data?.chatbot) {
        const bot = res.data.chatbot as any;
        if (bot.persona_name) setBotName(bot.persona_name);
        if (bot.persona_greeting) setBotGreeting(bot.persona_greeting);
      }
    });
  }, []);

  // Initialize or load session key
  useEffect(() => {
    const saved = localStorage.getItem('portfolio_chat_session');
    if (saved) {
      setSessionKey(saved);
      loadHistory(saved);
    }
  }, []);

  const createNewSession = useCallback(async () => {
    let key = '';
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      key = crypto.randomUUID();
    } else {
      key = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    setSessionKey(key);
    localStorage.setItem('portfolio_chat_session', key);
    setMessages([]);
    hasAnimatedGreetingRef.current = false;
    return key;
  }, []);

  const loadHistory = async (key: string) => {
    const res = await chatApi.getHistory(key);
    if (res.status && res.data && res.data.length > 0) {
      setMessages(res.data);
      hasAnimatedGreetingRef.current = true;
    } else {
      setMessages([]);
      hasAnimatedGreetingRef.current = false;
    }
  };

  // Smart Auto-Scroll: only auto-scrolls if user hasn't scrolled up
  const scrollToBottom = useCallback((force = false) => {
    if (!scrollAreaRef.current) return;
    if (force || !userScrolledUpRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, []);

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isUp = distanceFromBottom > 70;
    userScrolledUpRef.current = isUp;
    setShowScrollBottom(isUp);
  };

  const forceScrollToBottom = () => {
    userScrolledUpRef.current = false;
    setShowScrollBottom(false);
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, thinkingStep, scrollToBottom]);

  // Cleanup all typing timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (greetingTimerRef.current) clearInterval(greetingTimerRef.current);
    };
  }, []);

  // Dedicated rock-solid typewriter for welcome greeting
  const playGreetingTypewriter = useCallback((fullText: string) => {
    if (greetingTimerRef.current) {
      clearInterval(greetingTimerRef.current);
    }

    setIsStreaming(true);
    let index = 0;
    const len = fullText.length;

    // Set initial empty bubble
    setMessages([
      {
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      },
    ]);

    greetingTimerRef.current = setInterval(() => {
      index += 3;
      if (index >= len) {
        if (greetingTimerRef.current) {
          clearInterval(greetingTimerRef.current);
          greetingTimerRef.current = null;
        }
        setMessages([
          {
            role: 'assistant',
            content: fullText,
            created_at: new Date().toISOString(),
          },
        ]);
        setIsStreaming(false);
      } else {
        const partial = fullText.slice(0, index);
        setMessages([
          {
            role: 'assistant',
            content: partial,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    }, 15);
  }, []);

  // Trigger typewriter effect for greeting whenever chat window opens and history is empty
  useEffect(() => {
    if (isOpen && !hasAnimatedGreetingRef.current && messages.length === 0) {
      hasAnimatedGreetingRef.current = true;
      const textToType =
        botGreeting ||
        'Halo! Saya asisten AI portofolio Syahril Haryono. Ada yang ingin kamu ketahui tentang keahlian, pengalaman, atau proyek Syahril?';

      const timer = setTimeout(() => {
        playGreetingTypewriter(textToType);
      }, 180);

      return () => clearTimeout(timer);
    }
  }, [isOpen, botGreeting, messages.length, playGreetingTypewriter]);

  const startTypewriterLoop = (asstMsgIndex: number) => {
    if (isTypingRef.current) return;
    isTypingRef.current = true;

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    typingTimerRef.current = setInterval(() => {
      if (charQueueRef.current.length > 0) {
        const count =
          charQueueRef.current.length > 40
            ? 4
            : charQueueRef.current.length > 15
            ? 2
            : 1;
        const charsToAppend = charQueueRef.current.splice(0, count).join('');

        setMessages((prev) => {
          const next = [...prev];
          if (next[asstMsgIndex]) {
            next[asstMsgIndex] = {
              ...next[asstMsgIndex],
              content: next[asstMsgIndex].content + charsToAppend,
            };
          }
          return next;
        });
      } else if (streamDoneRef.current) {
        if (typingTimerRef.current) {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
        }
        isTypingRef.current = false;
        streamDoneRef.current = false;
        setIsStreaming(false);
      }
    }, 18);
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isStreaming) return;

    userScrolledUpRef.current = false;
    setShowScrollBottom(false);

    let activeKey = sessionKey;
    if (!activeKey) {
      activeKey = await createNewSession();
    }

    // Append user message
    const userMsg: ChatMessageType = {
      role: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    };

    // Prepare assistant response bubble
    const asstMsg: ChatMessageType = {
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, asstMsg]);
    setIsStreaming(true);

    const asstIndex = messages.length + 1;
    charQueueRef.current = [];
    isTypingRef.current = false;
    streamDoneRef.current = false;

    // Start typewriter consumer loop
    startTypewriterLoop(asstIndex);

    // Stream SSE from backend
    await chatApi.streamMessage(
      activeKey,
      userText,
      (step) => {
        setThinkingStep(step);
      },
      (token) => {
        setThinkingStep(null);
        charQueueRef.current.push(...token.split(''));
      },
      (complete) => {
        setThinkingStep(null);
        streamDoneRef.current = true;
        if (complete.is_rejected) {
          setMessages((prev) => {
            const next = [...prev];
            if (next[asstIndex]) {
              next[asstIndex].is_rejected = true;
            }
            return next;
          });
        }
      },
      (error) => {
        setThinkingStep(null);
        streamDoneRef.current = true;
        setIsStreaming(false);
        toast.error(error.message || 'Gagal berkomunikasi dengan AI');
        setMessages((prev) => {
          const next = [...prev];
          if (next[asstIndex]) {
            next[asstIndex].content =
              next[asstIndex].content || 'Maaf, terjadi gangguan jaringan saat menghubungi asisten AI.';
          }
          return next;
        });
      }
    );
  };

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      if (sessionKey) {
        await chatApi.deleteHistory(sessionKey);
      }
      localStorage.removeItem('portfolio_chat_session');
      hasAnimatedGreetingRef.current = false;
      userScrolledUpRef.current = false;
      setShowScrollBottom(false);
      await createNewSession();
      setConfirmClearOpen(false);
      toast.success('Riwayat percakapan berhasil direset');
      // Automatically type greeting again
      playGreetingTypewriter(
        botGreeting ||
          'Halo! Saya asisten AI portofolio Syahril Haryono. Ada yang ingin kamu ketahui tentang keahlian, pengalaman, atau proyek Syahril?'
      );
    } catch {
      toast.error('Gagal mereset percakapan');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      {/* Floating Action Button with Modern Cyber Bot Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-lime-700 hover:bg-lime-800 text-white dark:bg-brand dark:text-[#0a0a0a] dark:hover:bg-[#d8ef37] border border-lime-600/50 dark:border-brand/50 shadow-2xl flex items-center justify-center focus:outline-none group cursor-pointer transition-all"
          aria-label="Toggle AI Chat"
        >
          {/* Pulsing subtle ring */}
          <div className="absolute inset-0 rounded-full border border-lime-600/40 dark:border-brand/60 animate-ping-slow pointer-events-none" />

          {isOpen ? (
            <X className="w-6 h-6 text-white dark:text-[#0a0a0a]" />
          ) : (
            <ChatBotAvatar size={30} invert={true} />
          )}
        </motion.button>
      </div>

      {/* Chat Window Spring Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-24 sm:right-6 w-auto sm:w-[400px] max-w-full sm:max-w-[calc(100vw-32px)] h-[560px] max-h-[85vh] sm:max-h-[80vh] rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-xl overscroll-contain"
          >
            {/* Clean & Compact Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]/70 select-none">
              <div className="flex items-center gap-2.5">
                <ChatBotAvatar size={28} />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{botName}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors"
                  title="Reset percakapan"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors"
                  title="Tutup chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area with Smart Free Scroll */}
            <div className="relative flex-1 overflow-hidden flex flex-col min-h-0">
              <div
                ref={scrollAreaRef}
                onScroll={handleScroll}
                data-lenis-prevent="true"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                className="flex-1 overflow-y-auto p-4 space-y-2.5 overscroll-contain scroll-smooth"
              >
                {messages.map((msg, idx) => {
                  const isLastAssistant = idx === messages.length - 1 && msg.role === 'assistant';
                  return (
                    <ChatMessage
                      key={idx}
                      role={msg.role}
                      content={msg.content}
                      isRejected={msg.is_rejected}
                      timestamp={msg.created_at}
                      isStreaming={isLastAssistant && isStreaming}
                      thinkingStep={isLastAssistant ? thinkingStep : null}
                    />
                  );
                })}
              </div>

              {/* Floating Scroll-to-Bottom Quick Button */}
              <AnimatePresence>
                {showScrollBottom && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    type="button"
                    onClick={forceScrollToBottom}
                    className="absolute bottom-3 right-4 p-2 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-xl flex items-center gap-1.5 text-xs font-medium z-10 transition-colors"
                    title="Gulir ke pesan terbaru"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-lime-700 dark:text-brand animate-bounce" />
                    <span className="text-[10px] text-[var(--text-muted)]">Pesan baru</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Input */}
            <ChatInput
              onSend={handleSendMessage}
              onClear={() => setConfirmClearOpen(true)}
              disabled={isStreaming}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal Dialog */}
      <ConfirmDialog
        open={confirmClearOpen}
        title="Reset Percakapan"
        description="Apakah Anda yakin ingin menghapus seluruh riwayat percakapan ini? Sesi baru akan dibuat otomatis."
        confirmLabel="Hapus Riwayat"
        cancelLabel="Batal"
        isLoading={isClearing}
        onConfirm={handleClearHistory}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </>
  );
}
