import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageSquare, Send, X } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations.ts';
import { sendAssistantMessage } from '../lib/api.ts';
import type { SupportedLang } from '../types/index.ts';

interface ChatbotWidgetProps {
  lang: SupportedLang;
  stats: {
    jobs: number;
    houses: number;
    cars: number;
    sales: number;
    total: number;
    categories: Record<string, number>;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const INITIAL_GREETING: Record<SupportedLang, (s: ChatbotWidgetProps['stats']) => string> = {
  zh: (s) =>
    `您好！欢迎使用 JobSQUAD 在线帮助。目前平台实时发布 ${s.jobs} 个职位、${s.houses} 套房屋出租、${s.cars} 辆汽车租赁和 ${s.sales} 件集市商品。请问有什么可以帮您？`,
  en: (s) =>
    `Hello! Welcome to JobSQUAD Help. Currently live: ${s.jobs} vacancies, ${s.houses} house rentals, ${s.cars} car rentals, and ${s.sales} sales items. How can I assist you?`,
  fr: (s) =>
    `Bonjour ! Bienvenue sur l’aide JobSQUAD. Actuellement en ligne : ${s.jobs} offres, ${s.houses} maisons, ${s.cars} voitures et ${s.sales} articles. Comment puis-je vous aider ?`,
  es: (s) =>
    `¡Hola! Bienvenido a la ayuda de JobSQUAD. En vivo: ${s.jobs} empleos, ${s.houses} casas, ${s.cars} coches y ${s.sales} ventas. ¿En qué puedo ayudarte?`,
  dz: (s) =>
    `བཀྲ་ཤིས་བདེ་ལེགས། JobSQUAD གྲོགས་རམ་ནང་བྱོན་པ་ལེགས་སོ། ད་ལྟོ་ གཡོག་ ${s.jobs} ། ཁྱིམ་ ${s.houses} ། སྣུམ་འཁོར་ ${s.cars} ། ཉོ་ཚོང་ ${s.sales} ཡོད། ག་ཅི་གྲོགས་རམ་དགོཔ་སྨོ?`,
  gsw: (s) =>
    `Grüezi bi de JobSQUAD Hilf! Aktuell online: ${s.jobs} Stelle, ${s.houses} Hüser, ${s.cars} Autos und ${s.sales} Artikel. Wie cha ich Ihne hälfe?`,
};

export function ChatbotWidget({ lang, stats }: ChatbotWidgetProps) {
  const t = UI_TEXT[lang];
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'greet', role: 'assistant', text: INITIAL_GREETING[lang](stats) },
  ]);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'greet') {
        return [{ id: 'greet', role: 'assistant', text: INITIAL_GREETING[lang](stats) }];
      }
      return prev;
    });
  }, [lang, stats.jobs, stats.houses, stats.cars, stats.sales]);

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 360);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendAssistantMessage({ message: trimmed, language: lang, stats });
      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, role: 'assistant', text: res.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, role: 'assistant', text: INITIAL_GREETING[lang](stats) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="jobsquad-surface w-[calc(100vw-2rem)] sm:w-96 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/90">
          <div className="flex items-center justify-between px-4 py-3 bg-[#081326] border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#D9A438]" />
              <span className="text-xs sm:text-sm font-semibold text-slate-100">
                {t.chatbotTitle}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-72 overflow-y-auto p-4 space-y-3 bg-[#071121]/95">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#D9A438] text-[#071121] font-medium'
                      : 'bg-[#122038] text-slate-200 border border-slate-700/70'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-slate-400">...</div>
            )}
            <div ref={listEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 p-3 border-t border-slate-800 bg-[#081326]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.chatbotPlaceholder}
              className="flex-1 px-3 py-2 rounded-lg bg-[#0F1D33] border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D9A438]"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label={t.chatbotSend}
              className="p-2.5 rounded-lg bg-[#D9A438] text-[#071121] hover:bg-[#E5B34B] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Buttons: Chatbot + Up to Top */}
      <div className="flex items-center gap-2.5">
        {showTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label={t.upToTop}
            title={t.upToTop}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border border-slate-600/80 bg-[#0D1A2F]/95 text-slate-100 text-xs font-medium shadow-lg hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer backdrop-blur-md"
          >
            <ArrowUp className="w-4 h-4" />
            <span className="hidden sm:inline">{t.upToTop}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={t.chatbotTitle}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#D9A438] text-[#071121] text-xs font-semibold shadow-xl hover:bg-[#E5B34B] transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t.chatbotTitle}</span>
        </button>
      </div>
    </div>
  );
}
