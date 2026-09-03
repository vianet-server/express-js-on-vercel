import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'What are today\'s top selling products?',
  'Show outstanding payments summary',
  'Analyze P&L for this month',
  'Which SKUs are low on stock?',
];

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (content?: string) => {
    const text = (content || input).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getAssistantResponse(text),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col w-[300px] h-screen border-l bg-background ">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
          <Sparkles size={12} className="text-primary" />
        </div>
        <span className="text-sm font-medium">AI Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Bot size={20} className="text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">How can I help?</p>
              <p className="text-xs text-muted-foreground">
                Ask about sales, inventory, or reports.
              </p>
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
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <Bot size={12} className="text-primary" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
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
  );
}

function getAssistantResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('sale') || lower.includes('revenue')) {
    return 'Today\'s sales are ₹2,45,000 which is 12% higher than yesterday. The top selling category is Electronics with ₹1,10,000 in revenue. Would you like me to break it down by product?';
  }
  if (lower.includes('outstanding') || lower.includes('payment')) {
    return 'Total outstanding is ₹8,32,000 across 47 accounts. The largest outstanding is ₹1,50,000 from Raj Traders (60+ days). 32 accounts are in the 0-30 day bucket.';
  }
  if (lower.includes('p&l') || lower.includes('profit') || lower.includes('loss')) {
    return 'This month\'s P&L: Revenue ₹24,50,000 | Expenses ₹18,20,000 | Net Profit ₹6,30,000 (25.7% margin). Profit is up 8% compared to last month.';
  }
  if (lower.includes('stock') || lower.includes('sku') || lower.includes('inventory')) {
    return 'Currently 23 SKUs are below minimum stock level. 5 items are completely out of stock. The most critical items are: HDMI Cable (0 units), USB Hub (2 units), and Wireless Mouse (3 units).';
  }
  return 'I\'m here to help with your business data. You can ask about sales, outstanding payments, P&L, inventory, or any other report. What would you like to know?';
}
