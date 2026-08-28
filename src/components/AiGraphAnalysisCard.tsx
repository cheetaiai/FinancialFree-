import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Bot, Loader2, RefreshCw, Copy, Check, ChevronDown, ChevronUp, BarChart3, TrendingUp, ShieldAlert, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { LiquidButton } from './ui/LiquidButton';
import { LiquidGlassCard } from './ui/LiquidGlassCard';

interface AiGraphAnalysisCardProps {
  title?: string;
  type: 'monthly' | 'yearly' | 'dashboard' | 'trends';
  graphData: any;
  autoLoad?: boolean;
  className?: string;
}

export const AiGraphAnalysisCard: React.FC<AiGraphAnalysisCardProps> = ({
  title = 'AI Graph & Flow Analysis',
  type,
  graphData,
  autoLoad = true,
  className = ''
}) => {
  const { showToast } = useToast();
  const { currencySymbol } = useCurrency();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleAnalyze = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await api.analyzeGraph(type, graphData, currencySymbol);
      setAnalysis(res.analysis);
      setProvider(res.provider || 'AI Engine');
      setIsOpen(true);
    } catch (err: any) {
      console.warn('AI analysis notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-run analysis when graphData changes or on first mount
  React.useEffect(() => {
    if (autoLoad && graphData && !analysis && !isLoading) {
      handleAnalyze();
    }
  }, [type, JSON.stringify(graphData)]);

  const handleManualAnalyze = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await api.analyzeGraph(type, graphData, currencySymbol);
      setAnalysis(res.analysis);
      setProvider(res.provider || 'AI Engine');
      setIsOpen(true);
      showToast('AI Graph Analysis completed!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate AI analysis', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis);
    setCopied(true);
    showToast('Analysis copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <LiquidGlassCard variant="secondary" className={`p-4 sm:p-5 border border-blue-500/20 shadow-sm ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              {provider && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                  {provider}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium">
              Deep AI analysis of Money Given vs Taken dynamics, borrower counts & repayment velocity.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {analysis && (
            <button
              type="button"
              onClick={handleCopy}
              title="Copy analysis text"
              className="p-2 rounded-xl text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-xs flex items-center gap-1 transition-all"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <LiquidButton
            variant={analysis ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleManualAnalyze}
            isLoading={isLoading}
            icon={analysis ? <RefreshCw size={14} /> : <Zap size={14} />}
          >
            {isLoading ? 'Analyzing Graph...' : analysis ? 'Re-Analyze' : '📊 Run AI Graph Analysis'}
          </LiquidButton>

          {analysis && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 animate-pulse">
            <Loader2 size={16} className="animate-spin" />
            <span>Auditing money flow vectors, borrower names, and calculating recovery efficiency...</span>
          </div>
          <div className="space-y-2 opacity-60">
            <div className="h-3.5 bg-slate-300 dark:bg-slate-700 rounded-full w-3/4 animate-pulse" />
            <div className="h-3.5 bg-slate-300 dark:bg-slate-700 rounded-full w-full animate-pulse" />
            <div className="h-3.5 bg-slate-300 dark:bg-slate-700 rounded-full w-5/6 animate-pulse" />
          </div>
        </motion.div>
      )}

      {/* Analysis Output Section */}
      <AnimatePresence>
        {analysis && isOpen && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10"
          >
            <div className="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed space-y-3 shadow-sm">
              <div className="prose prose-sm dark:prose-invert max-w-none 
                prose-headings:font-black prose-headings:text-slate-950 dark:prose-headings:text-white 
                prose-p:text-slate-800 dark:prose-p:text-slate-200 prose-p:my-2
                prose-strong:text-slate-950 dark:prose-strong:text-white prose-strong:font-bold
                prose-li:text-slate-800 dark:prose-li:text-slate-200 prose-li:my-1
                prose-table:w-full prose-table:my-3 prose-table:border-collapse
                prose-th:bg-slate-100 dark:prose-th:bg-slate-800/80 prose-th:p-2.5 prose-th:text-slate-900 dark:prose-th:text-white prose-th:font-bold prose-th:text-xs prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-700
                prose-td:p-2.5 prose-td:text-slate-800 dark:prose-td:text-slate-200 prose-td:text-xs prose-td:border prose-td:border-slate-200 dark:prose-td:border-slate-700
                prose-tr:hover:bg-slate-50 dark:prose-tr:hover:bg-slate-800/40">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LiquidGlassCard>
  );
};
