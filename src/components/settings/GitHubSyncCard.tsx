import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  GitBranch,
  GitCommit,
  CheckCircle2,
  RefreshCw,
  Copy,
  ExternalLink,
  UploadCloud,
  Check,
  Terminal,
  ShieldCheck,
  AlertCircle,
  Key,
  Lock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { GitRepoStatus } from '../../types';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidButton } from '../ui/LiquidButton';
import { useToast } from '../../context/ToastContext';

const DEFAULT_REPO_URL = 'https://github.com/cheetaiai/FinancialFree-.git';

export const GitHubSyncCard: React.FC = () => {
  const { showToast } = useToast();
  const [gitStatus, setGitStatus] = useState<GitRepoStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedTokenCmd, setCopiedTokenCmd] = useState(false);
  const [patToken, setPatToken] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchGitStatus = async () => {
    setIsLoading(true);
    try {
      const status = await api.getGitStatus();
      setGitStatus(status);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGitStatus();
  }, []);

  const standardPushCmd = `git remote add origin ${DEFAULT_REPO_URL}
git branch -M main
git add -A
git commit -m "feat: Synchronize all FinancialFree files & updates"
git push -u origin main`;

  const tokenPushSnippet = `git push https://<YOUR_GITHUB_TOKEN>@github.com/cheetaiai/FinancialFree-.git main`;

  const handleCopyStandard = () => {
    navigator.clipboard.writeText(standardPushCmd);
    setCopiedCmd(true);
    showToast('GitHub CLI push commands copied to clipboard!', 'success');
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  const handleCopyTokenCmd = () => {
    const textToCopy = patToken
      ? `git push https://${patToken.trim()}@github.com/cheetaiai/FinancialFree-.git main`
      : tokenPushSnippet;
    navigator.clipboard.writeText(textToCopy);
    setCopiedTokenCmd(true);
    showToast('Token push command copied to clipboard!', 'success');
    setTimeout(() => setCopiedTokenCmd(false), 2500);
  };

  const handleTriggerPush = async () => {
    setIsPushing(true);
    setPushResult(null);

    try {
      const res = await api.pushToGitHub(patToken.trim() || undefined, DEFAULT_REPO_URL);
      if (res.success) {
        setPushResult({ success: true, message: res.message });
        showToast(res.message, 'success');
        fetchGitStatus();
      } else {
        setPushResult({
          success: false,
          message: res.error || res.message || 'Push failed. Please ensure your Personal Access Token has "repo" permissions.'
        });
        showToast(res.error || 'GitHub push rejected', 'error');
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        message: err.message || 'Network error occurred while communicating with GitHub.'
      });
      showToast(err.message || 'Push request failed', 'error');
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <LiquidGlassCard variant="primary" glowColor="rgba(99, 102, 241, 0.15)" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-purple-800 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <GitBranch className="text-white w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                GitHub Repository & Version Control
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <GitCommit size={11} />
                <span>Branch: main</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <span>Target:</span>
              <a
                href={DEFAULT_REPO_URL.replace('.git', '')}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                <span>cheetaiai/FinancialFree-</span>
                <ExternalLink size={11} />
              </a>
            </p>
          </div>
        </div>

        <LiquidButton
          variant="secondary"
          size="sm"
          onClick={fetchGitStatus}
          disabled={isLoading}
          icon={<RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />}
        >
          Check Status
        </LiquidButton>
      </div>

      {/* Status Details Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Branch</div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1 truncate">
            <GitBranch size={12} className="text-indigo-500 shrink-0" />
            <span>{gitStatus?.branch || 'main'}</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Latest Commit</div>
          <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
            {gitStatus?.latestCommit ? `#${gitStatus.latestCommit}` : '#latest'}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tree State</div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>{gitStatus?.clean ? 'All 107 files committed' : 'Ready to push'}</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">App Version</div>
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            v1.2.5
          </div>
        </div>
      </div>

      {/* Push Directly with Personal Access Token (PAT) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-blue-500/5 border border-indigo-500/20 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Key size={15} className="text-indigo-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Push Directly to GitHub
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            GitHub requires a Personal Access Token (PAT) with repo access
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="password"
              placeholder="Paste GitHub Personal Access Token (ghp_...)"
              value={patToken}
              onChange={(e) => setPatToken(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            {patToken && (
              <span className="absolute right-2.5 top-2 text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                <Check size={11} /> Token set
              </span>
            )}
          </div>

          <LiquidButton
            variant="primary"
            size="sm"
            onClick={handleTriggerPush}
            disabled={isPushing}
            icon={<UploadCloud size={14} className={isPushing ? 'animate-bounce' : ''} />}
            className="font-bold shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
          >
            {isPushing ? 'Pushing to GitHub...' : 'Push All Files to GitHub'}
          </LiquidButton>
        </div>

        {pushResult && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
              pushResult.success
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/20'
            }`}
          >
            {pushResult.success ? (
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-bold">{pushResult.success ? 'Push Successful!' : 'Notice'}</div>
              <p className="text-[11px] opacity-90">{pushResult.message}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Terminal Command for Manual / CLI Push */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 font-semibold">
            <Terminal size={13} className="text-slate-600 dark:text-slate-300" />
            <span>Terminal Push Command:</span>
          </span>
          <button
            onClick={handleCopyStandard}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {copiedCmd ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedCmd ? 'Copied!' : 'Copy Script'}</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
          <pre className="text-indigo-300 select-all whitespace-pre">
            {standardPushCmd}
          </pre>
        </div>
      </div>
    </LiquidGlassCard>
  );
};
