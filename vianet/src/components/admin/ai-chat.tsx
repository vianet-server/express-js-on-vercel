import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { Bot, Send, Sparkles, User, Plus, Trash2, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface ModelOption {
  id: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/* localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'vianet_chat_history';
const MODEL_KEY = 'vianet_chat_model';

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convos: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

function makeTitle(text: string) {
  return text.length > 40 ? text.slice(0, 40) + '...' : text;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

const SUGGESTIONS = [
  'What are the low stock items?',
  'Show inventory stats',
  'Which brands have the most stock?',
  'List all access groups',
  'Search ledger for Raj Traders',
];

const FALLBACK_MODELS: ModelOption[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
];

export function AiChat() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [models, setModels] = useState<ModelOption[]>(FALLBACK_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem(MODEL_KEY) || 'gemini-2.5-flash'
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConvo = conversations.find((c) => c.id === activeId);
  const messages = activeConvo?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Fetch available models on mount
  useEffect(() => {
    api.get<{ models: ModelOption[]; default: string }>('/api/admin/chat/models')
      .then((res) => {
        if (res.models?.length) setModels(res.models);
      })
      .catch(() => {});
  }, []);

  const handleModelChange = useCallback((value: string) => {
    setSelectedModel(value);
    localStorage.setItem(MODEL_KEY, value);
  }, []);

  const startNew = useCallback(() => {
    const id = crypto.randomUUID();
    const convo: Conversation = { id, title: 'New Chat', messages: [], createdAt: Date.now() };
    setConversations((prev) => [convo, ...prev]);
    setActiveId(id);
    setShowHistory(false);
  }, []);

  const deleteConvo = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const sendMessage = useCallback(async (content?: string) => {
    const text = (content || input).trim();
    if (!text || isTyping) return;

    let convoId = activeId;
    if (!convoId) {
      const id = crypto.randomUUID();
      const convo: Conversation = { id, title: makeTitle(text), messages: [], createdAt: Date.now() };
      setConversations((prev) => [convo, ...prev]);
      convoId = id;
      setActiveId(id);
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convoId) return c;
        const updated = { ...c, messages: [...c.messages, userMsg] };
        if (c.messages.length === 0) updated.title = makeTitle(text);
        return updated;
      })
    );
    setInput('');
    setIsTyping(true);

    try {
      const convo = conversations.find((c) => c.id === convoId);
      const history = convo ? convo.messages.slice(-20).map((m) => ({ role: m.role, content: m.content })) : [];

      const data = await api.post<{ message: string }>('/api/admin/chat', {
        message: text,
        history,
        model: selectedModel,
      });

      const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: data.message };
      setConversations((prev) =>
        prev.map((c) => (c.id === convoId ? { ...c, messages: [...c.messages, assistantMsg] } : c))
      );
    } catch (err: any) {
      const errorMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${err.message || 'Failed to get response'}` };
      setConversations((prev) =>
        prev.map((c) => (c.id === convoId ? { ...c, messages: [...c.messages, errorMsg] } : c))
      );
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, activeId, conversations, selectedModel]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-50px)] border-l bg-background">
      {/* ---- History sidebar ---- */}
      {showHistory && (
        <div className="flex w-[220px] flex-col border-r bg-muted/30">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-medium">Chat History</span>
            <Button variant="ghost" size="icon" className="size-6" onClick={() => setShowHistory(false)}>
              <X size={12} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">No conversations yet</p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => { setActiveId(c.id); setShowHistory(false); }}
                className={`group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                  c.id === activeId ? 'bg-primary/10 text-foreground' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <MessageSquare size={12} className="mt-0.5 shrink-0" />
                <span className="flex-1 truncate">{c.title}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); deleteConvo(c.id); }}
                  className="hidden shrink-0 text-muted-foreground hover:text-destructive group-hover:inline"
                >
                  <Trash2 size={10} />
                </span>
              </button>
            ))}
          </div>
          <div className="border-t p-2">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={startNew}>
              <Plus size={12} /> New Chat
            </Button>
          </div>
        </div>
      )}

      {/* ---- Main chat area ---- */}
      <div className="flex w-[300px] flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => setShowHistory((p) => !p)} title="Chat History">
            <MessageSquare size={12} />
          </Button>
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Sparkles size={12} className="text-primary" />
          </div>
          <span className="text-sm font-medium shrink-0">AI</span>
          <div className="flex-1 min-w-0">
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger className="h-7 text-[10px] w-full border-none bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Bot size={20} className="text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">How can I help?</p>
                <p className="text-xs text-muted-foreground">Ask about inventory, stock, ledgers, or access groups.</p>
              </div>
              <div className="grid w-full gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="rounded-lg border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                  <Bot size={12} className="text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary mt-0.5">
                  <User size={12} className="text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot size={12} className="text-primary" />
              </div>
              <div className="rounded-xl bg-muted px-3 py-2.5 text-sm">
                <span className="flex gap-1">
                  <span className="size-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              className="min-h-[36px] max-h-[100px] resize-none py-1.5 text-sm"
            />
            <Button
              size="icon"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="shrink-0 size-[36px] rounded-lg"
            >
              <Send size={14} />
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground text-center">
            AI can make mistakes. Verify important data.
          </p>
        </div>
      </div>
    </div>
  );
}
