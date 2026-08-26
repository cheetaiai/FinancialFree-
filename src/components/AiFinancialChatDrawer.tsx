import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, X, Bot, User as UserIcon, Loader2, RefreshCw, Camera, Image as ImageIcon, CheckCircle, Trash2, ArrowUpRight } from 'lucide-react';
import { api } from '../lib/api';
import { LiquidButton } from './ui/LiquidButton';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
}

interface AiFinancialChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddTransaction?: () => void;
}

export const AiFinancialChatDrawer: React.FC<AiFinancialChatDrawerProps> = ({
  isOpen,
  onClose,
  onOpenAddTransaction
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "👋 Hello! I am your **FinancialFree AI Agent**.\n\nI can:\n• Analyze your live lending & recovery ledger in real-time\n• Read & scan payment receipts, UPI screenshots, or handwritten notes\n• Tell you who owes money, due dates, and recovery ratios\n• Draft courteous WhatsApp reminders\n\nHow can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string>('');
  const [attachedMimeType, setAttachedMimeType] = useState<string>('image/jpeg');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Image size must be less than 8MB.');
      return;
    }

    setAttachedMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if ((!query && !attachedImage) || isLoading) return;

    const currentImage = attachedImage;
    const currentMime = attachedMimeType;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: query || 'Analyze this attached financial image / receipt.',
      image: currentImage || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedImage('');
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

      const res = await api.sendAiChat(
        query || 'Analyze this attached image and summarize the financial details.',
        history,
        currentImage || undefined,
        currentMime
      );

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.reply
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: `Sorry, I couldn't process your request: ${err.message || 'Error occurred'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: "👋 Chat reset. What would you like to review in your financial records?"
      }
    ]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-lg h-full liquid-glass-floating shadow-2xl z-10 flex flex-col border-l border-white/40 dark:border-white/10"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    FinancialFree Agent
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                      Live AI
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time Portfolio Copilot & Image Scanner
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear chat history"
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Action Prompts Bar */}
            <div className="px-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => handleSend('Who currently owes me money, and what are their individual outstanding balances?')}
                className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white text-slate-700 dark:text-slate-200 whitespace-nowrap border border-black/5 flex-shrink-0 cursor-pointer shadow-xs"
              >
                👥 Who owes money?
              </button>
              <button
                type="button"
                onClick={() => handleSend('Analyze the graph of money given and taken, and explain our monthly and yearly recovery velocity and cash flow trends.')}
                className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white text-slate-700 dark:text-slate-200 whitespace-nowrap border border-black/5 flex-shrink-0 cursor-pointer shadow-xs"
              >
                📊 Graph & Trend Analysis
              </button>
              <button
                type="button"
                onClick={() => handleSend('Give me an overview of our lending health and recovery rate.')}
                className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white text-slate-700 dark:text-slate-200 whitespace-nowrap border border-black/5 flex-shrink-0 cursor-pointer shadow-xs"
              >
                📈 Recovery Health
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 whitespace-nowrap border border-blue-500/20 flex-shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Camera size={12} />
                <span>📷 Scan Receipt</span>
              </button>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'model' && (
                    <div className="w-7 h-7 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={15} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md rounded-tr-sm'
                        : 'liquid-glass-secondary border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-tl-sm'
                    }`}
                  >
                    {msg.image && (
                      <div className="mb-2.5 rounded-xl overflow-hidden border border-white/20">
                        <img
                          src={msg.image}
                          alt="Uploaded attachment"
                          referrerPolicy="no-referrer"
                          className="max-h-48 w-auto object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div>{msg.text}</div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <UserIcon size={14} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-slate-500 text-xs py-2 px-1">
                  <Loader2 size={15} className="animate-spin text-blue-500" />
                  <span>Agent is analyzing ledger records & context...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attached image preview banner before sending */}
            {attachedImage && (
              <div className="px-4 py-2 bg-blue-500/10 border-t border-blue-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={attachedImage}
                    alt="Pending upload"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-blue-400"
                  />
                  <div className="text-xs text-slate-700 dark:text-slate-200">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Image attached</span>
                    <p className="text-[11px] text-slate-500">Ready to analyze receipt or screenshot</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage('')}
                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-black/5 dark:border-white/10 liquid-glass-secondary">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach payment receipt or screenshot"
                  className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-slate-200/60 dark:hover:bg-white/20 border border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
                >
                  <Camera size={18} />
                </button>

                <input
                  type="text"
                  placeholder="Ask Agent or upload receipt..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-white/10 border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm glass-input"
                />

                <button
                  type="submit"
                  disabled={(!input.trim() && !attachedImage) || isLoading}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md disabled:opacity-50 cursor-pointer flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
