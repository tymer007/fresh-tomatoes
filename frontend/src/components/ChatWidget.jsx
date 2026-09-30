import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { api, usage, FREE_LIMITS, PRO_PRICE } from '../lib/api.js';

const GREETING = "Hi! I'm FarmGuard's tomato assistant. Ask me about tomato diseases, pests, fertilizer or your latest scan result.";

function load() {
  try { return JSON.parse(sessionStorage.getItem('ft_chat') || '[]'); } catch { return []; }
}

// Small "Ask FarmGuard" chat - 3 free messages a day. Knows the latest scan result.
export default function ChatWidget({ open, setOpen, scan }) {
  const [messages, setMessages] = useState(load);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(usage.left('chats'));
  const listRef = useRef(null);

  useEffect(() => {
    try { sessionStorage.setItem('ft_chat', JSON.stringify(messages.slice(-10))); } catch { /* ignore */ }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, busy]);

  const send = async (e) => {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy || left <= 0) return;
    const next = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setText('');
    setBusy(true);
    try {
      const { reply } = await api.chat({ messages: next, scan: scan ? { disease: scan.disease, confidence: scan.confidence, healthScore: scan.healthScore, sure: scan.sure } : null });
      usage.add('chats');
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (err) {
      if (err.limit) usage.exhaust('chats');
      setMessages([...next, { role: 'assistant', content: err.message, error: true }]);
    } finally {
      setLeft(usage.left('chats'));
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 w-[calc(100vw-2.5rem)] max-w-sm h-[480px] bg-white rounded-2xl shadow-2xl border border-tomDarkWhite flex flex-col overflow-hidden">
          <div className="bg-tomGreen text-white px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">Ask FarmGuard</div>
              <div className="text-xs text-tomWhite">{left} of {FREE_LIMITS.chats} free messages left today</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat"><X className="w-5 h-5" /></button>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-tomWhite/50">
            {[{ role: 'assistant', content: scan ? `${GREETING}\n\nI can see your last scan: ${scan.sure ? `${scan.disease} (${scan.confidence}% confidence)` : 'we were not sure about that photo'}.` : GREETING }, ...messages].map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-line ${m.role === 'user' ? 'bg-tomRed text-white rounded-br-sm' : m.error ? 'bg-red-50 text-tomRed' : 'bg-white text-tomDrkrGreen rounded-bl-sm shadow-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <div className="bg-white rounded-2xl px-4 py-3 w-fit shadow-sm chat-dots"><span /><span /><span /></div>}
          </div>
          <form onSubmit={send} className="p-3 border-t border-tomDarkWhite flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} disabled={left <= 0}
              placeholder={left > 0 ? 'Type your question...' : `Daily limit reached - Pro (${PRO_PRICE}/mo) coming soon`}
              className="flex-1 px-4 py-2 rounded-full border border-tomDarkWhite text-sm focus:ring-2 focus:ring-tomRed focus:outline-none disabled:bg-tomWhite" />
            <button disabled={busy || left <= 0 || !text.trim()} className="w-10 h-10 rounded-full bg-tomRed text-white flex items-center justify-center disabled:opacity-50" aria-label="Send"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="w-14 h-14 rounded-full bg-tomRed text-white shadow-xl flex items-center justify-center hover:bg-tomDarkRed" aria-label="Ask FarmGuard">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
