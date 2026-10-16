import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Coins, Check, Play, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import {
  soundEffects,
  playGivenMoneySound,
  playReturnMoneySound,
  playTickSound,
  playNewPersonSound
} from '../../lib/soundEffects';
import { useToast } from '../../context/ToastContext';

export const AudioFxSettingsCard: React.FC = () => {
  const { showToast } = useToast();
  const [isEnabled, setIsEnabled] = useState<boolean>(() => soundEffects.isEnabled());
  const [volume, setVolume] = useState<number>(() => Math.round(soundEffects.getVolume() * 100));
  const [activePlaying, setActivePlaying] = useState<string | null>(null);

  const handleToggle = () => {
    const next = soundEffects.toggleSound();
    setIsEnabled(next);
    showToast(next ? '🔊 Audio effects enabled' : '🔇 Audio effects muted', 'info');
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    soundEffects.setVolume(newVol / 100);
  };

  const handlePlayPaytmSound = () => {
    setActivePlaying('paytm');
    playTickSound();
    playGivenMoneySound();
    setTimeout(() => setActivePlaying(null), 2500);
  };

  const handlePlayMixkitSound = () => {
    setActivePlaying('mixkit');
    playTickSound();
    playReturnMoneySound();
    setTimeout(() => setActivePlaying(null), 1600);
  };

  const handlePlayTick = () => {
    setActivePlaying('tick');
    playTickSound();
    setTimeout(() => setActivePlaying(null), 400);
  };

  const handlePlayNewPerson = () => {
    setActivePlaying('person');
    playTickSound();
    playNewPersonSound();
    setTimeout(() => setActivePlaying(null), 1200);
  };

  return (
    <LiquidGlassCard
      variant="primary"
      glowColor="rgba(59, 130, 246, 0.2)"
      className="p-5 sm:p-6 space-y-5 border-blue-500/25 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            {isEnabled ? <Volume2 size={20} className="animate-pulse" /> : <VolumeX size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                Audio FX & Soundstage
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                Dual Audio Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Paytm payment given sound & Mixkit gold coin money taken audio
            </p>
          </div>
        </div>

        {/* Master Sound Switch */}
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
            isEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
          aria-label="Toggle sound effects"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Volume Slider */}
      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <Volume2 size={14} className="text-blue-500" />
            <span>Master FX Volume</span>
          </span>
          <span className="font-mono text-blue-600 dark:text-blue-400">{volume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          disabled={!isEnabled}
          className="w-full accent-blue-600 cursor-pointer disabled:opacity-40"
        />
      </div>

      {/* Interactive Sound Previews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Paytm Sound (Given Money) */}
        <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                Money Given
              </span>
              <span className="text-[10px] font-mono text-slate-400">~2.8s Tune</span>
            </div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
              <span>Paytm Payment Sound</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Plays automatically whenever you record a money given or shopping payment.
            </p>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlayPaytmSound}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm ${
              activePlaying === 'paytm'
                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25 border border-blue-500/30'
            }`}
          >
            <Play size={13} className={activePlaying === 'paytm' ? 'animate-spin' : ''} />
            <span>{activePlaying === 'paytm' ? 'Playing Paytm Tune...' : 'Test Paytm Sound'}</span>
            <span className="text-[11px]">🔊</span>
          </motion.button>
        </div>

        {/* 2. Mixkit Gold Coin Sound (Money Taken / Returned) */}
        <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                Money Taken
              </span>
              <span className="text-[10px] font-mono text-slate-400">~1.6s Ring</span>
            </div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
              <span>Mixkit Gold Coin Sound</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Plays automatically whenever money is returned or received into your account.
            </p>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlayMixkitSound}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm ${
              activePlaying === 'mixkit'
                ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
            }`}
          >
            <Coins size={13} className={activePlaying === 'mixkit' ? 'animate-bounce' : ''} />
            <span>{activePlaying === 'mixkit' ? 'Playing Coin Clink...' : 'Test Mixkit Coin Sound'}</span>
            <span className="text-[11px]">🪙</span>
          </motion.button>
        </div>
      </div>

      {/* Micro-Interaction Previews: Tick Mark & New Contact */}
      <div className="pt-1 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlayTick}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Check size={11} className="text-emerald-500" />
            <span>Test Tick Click</span>
          </button>
          <button
            type="button"
            onClick={handlePlayNewPerson}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Sparkles size={11} className="text-purple-500" />
            <span>Test Contact Chime</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span>Active in Real-Time</span>
        </div>
      </div>
    </LiquidGlassCard>
  );
};
