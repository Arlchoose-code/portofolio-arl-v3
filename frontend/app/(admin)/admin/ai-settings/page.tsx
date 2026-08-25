'use client';

import React, { useState, useEffect } from 'react';
import { aiApi } from '@/lib/api';
import { AISetting } from '@/types';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Bot, Save, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAISettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [activeProvider, setActiveProvider] = useState<'ollama' | 'openai_compatible'>('ollama');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('gemma4:31b-cloud');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('https://api.openai.com/v1');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');

  const [personaName, setPersonaName] = useState('AI Assistant');
  const [personaGreeting, setPersonaGreeting] = useState('');
  const [personaLanguage, setPersonaLanguage] = useState('id');
  const [personaTone, setPersonaTone] = useState('friendly');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [guardrailEnabled, setGuardrailEnabled] = useState(true);
  const [guardrailMessage, setGuardrailMessage] = useState('');
  const [maxHistory, setMaxHistory] = useState(20);
  const [rateLimit, setRateLimit] = useState(30);

  useEffect(() => {
    aiApi.getSettings().then((res) => {
      if (res.status && res.data) {
        const s = res.data;
        setActiveProvider(s.active_provider || s.provider || 'ollama');
        setOllamaBaseUrl(s.ollama_base_url || 'http://localhost:11434');
        setOllamaModel(s.ollama_model || 'gemma4:31b-cloud');
        setAvailableModels(s.ollama_available_models || []);
        setOpenaiBaseUrl(s.openai_base_url || 'https://api.openai.com/v1');
        setOpenaiModel(s.openai_model || 'gpt-4o');
        setPersonaName(s.persona_name || 'Arl');
        setPersonaGreeting(s.persona_greeting || '');
        setPersonaLanguage(s.persona_language || 'id');
        setPersonaTone(s.persona_tone || 'friendly');
        setSystemPrompt(s.system_prompt || '');
        setGuardrailEnabled(Boolean(s.guardrail_enabled));
        setGuardrailMessage(s.guardrail_message || '');
        setMaxHistory(s.max_history_messages || 20);
        setRateLimit(s.max_messages_per_hour || 30);
      }
      setFetching(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await aiApi.updateSettings({
        active_provider: activeProvider,
        ollama_base_url: ollamaBaseUrl,
        ollama_model: ollamaModel,
        openai_base_url: openaiBaseUrl,
        openai_api_key: openaiApiKey || undefined,
        openai_model: openaiModel,
        persona_name: personaName,
        persona_greeting: personaGreeting,
        persona_language: personaLanguage,
        persona_tone: personaTone,
        system_prompt: systemPrompt,
        guardrail_enabled: guardrailEnabled,
        guardrail_message: guardrailMessage,
        max_history_messages: Number(maxHistory),
        max_messages_per_hour: Number(rateLimit),
      });

      if (res.status) {
        toast.success('Pengaturan AI & Persona berhasil disimpan!');
      } else {
        toast.error(res.message || 'Gagal menyimpan pengaturan AI');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-sm text-[var(--text-muted)] animate-pulse">Memuat konfigurasi AI...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Konfigurasi AI Chatbot</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Pengaturan penyedia model LLM, prompt sistem, guardrail, dan persona chatbot AI.
          </p>
        </div>

        <Button type="submit" disabled={loading} className="gap-2">
          <Save className="w-4 h-4" />
          <span>{loading ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
        </Button>
      </div>

      {/* Provider Selector */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider flex items-center gap-2">
          <Bot className="w-4 h-4 text-lime-700 dark:text-brand" />
          <span>Model Inference Provider</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setActiveProvider('ollama')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeProvider === 'ollama'
                ? 'border-lime-600 dark:border-brand bg-lime-500/5 dark:bg-brand/5 ring-1 ring-lime-500/30 dark:ring-brand/30'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] opacity-60'
            }`}
          >
            <div className="font-bold text-sm text-[var(--text-primary)]">Ollama (Local Inference)</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">
              Inference lokal hemat biaya via Ollama API (Model: gemma4:31b-cloud)
            </div>
          </div>

          <div
            onClick={() => setActiveProvider('openai_compatible')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeProvider === 'openai_compatible'
                ? 'border-lime-600 dark:border-brand bg-lime-500/5 dark:bg-brand/5 ring-1 ring-lime-500/30 dark:ring-brand/30'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] opacity-60'
            }`}
          >
            <div className="font-bold text-sm text-[var(--text-primary)]">OpenAI / Compatible API</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">
              Cloud inference (OpenAI, DeepSeek, Groq, OpenRouter)
            </div>
          </div>
        </div>

        {activeProvider === 'ollama' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Ollama Base URL
              </label>
              <Input
                value={ollamaBaseUrl}
                onChange={(e) => setOllamaBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Model Ollama
              </label>
              {availableModels.length > 0 ? (
                <select
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-lime-600 dark:focus:border-brand"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="gemma4:31b-cloud"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  API Base URL
                </label>
                <Input
                  value={openaiBaseUrl}
                  onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Model Name
                </label>
                <Input
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  placeholder="gpt-4o"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                API Key
              </label>
              <Input
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Persona Configuration */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime-700 dark:text-brand" />
          <span>Persona & Kepribadian Asisten</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Nama Persona *
            </label>
            <Input
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Bahasa Utama
            </label>
            <select
              value={personaLanguage}
              onChange={(e) => setPersonaLanguage(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-lime-600 dark:focus:border-brand"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
              <option value="de">Deutsch (Jerman)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Gaya Bicara (Tone)
            </label>
            <Input
              value={personaTone}
              onChange={(e) => setPersonaTone(e.target.value)}
              placeholder="friendly, professional, concise"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Pesan Sambutan (Greeting)
          </label>
          <Textarea
            value={personaGreeting}
            onChange={(e) => setPersonaGreeting(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            System Prompt Template (Konteks Portofolio Otomatis Disisipkan)
          </label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            className="font-mono text-xs"
          />
        </div>
      </div>

      {/* Guardrails & Safety */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Guardrail & Batas Penggunaan</span>
        </h3>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="guardrail"
            checked={guardrailEnabled}
            onChange={(e) => setGuardrailEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border)] text-lime-700 dark:text-brand focus:ring-lime-600 dark:focus:ring-brand"
          />
          <label htmlFor="guardrail" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
            Aktifkan Portfolio Guardrail (Tolak pertanyaan di luar portofolio Syahril)
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Pesan Penolakan Guardrail
          </label>
          <Textarea
            value={guardrailMessage}
            onChange={(e) => setGuardrailMessage(e.target.value)}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Maksimal Riwayat Chat (Pesan Terakhir)
            </label>
            <Input
              type="number"
              value={maxHistory}
              onChange={(e) => setMaxHistory(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Batas Pesan per Jam per IP (Rate Limit)
            </label>
            <Input
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[var(--border)]">
        <Button type="submit" disabled={loading} size="lg" className="gap-2">
          <Save className="w-4 h-4" />
          <span>{loading ? 'Menyimpan...' : 'Simpan Seluruh Konfigurasi AI'}</span>
        </Button>
      </div>
    </form>
  );
}
