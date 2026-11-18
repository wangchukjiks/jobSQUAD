import { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { fetchCaptchaChallenge } from '../lib/api.ts';

interface CaptchaFieldProps {
  label: string;
  placeholder: string;
  question: string;
  token: string;
  answer: string;
  onChallengeLoaded: (question: string, token: string) => void;
  onAnswerChange: (value: string) => void;
}

export function CaptchaField({
  label,
  placeholder,
  question,
  token,
  answer,
  onChallengeLoaded,
  onAnswerChange,
}: CaptchaFieldProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadChallenge = async () => {
    setRefreshing(true);
    setLoadError(false);
    try {
      const data = await fetchCaptchaChallenge();
      onChallengeLoaded(data.question, data.token);
      onAnswerChange('');
    } catch (err) {
      console.error('Failed to refresh CAPTCHA:', err);
      setLoadError(true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) {
      loadChallenge();
    }
  }, [token]);

  return (
    <div className="rounded-lg border border-slate-700/70 bg-[#0A1527]/90 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#D9A438]" />
          {label}
        </span>
        <button
          type="button"
          onClick={loadChallenge}
          disabled={refreshing}
          aria-label="Refresh CAPTCHA"
          title="Refresh CAPTCHA"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#D9A438] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#D9A438]' : ''}`} />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="px-3.5 py-2 rounded-md bg-[#13223A] border border-slate-600/50 font-mono-num text-sm font-semibold text-amber-200 tracking-wider select-none shrink-0 min-w-[92px] text-center">
          {refreshing ? '...' : loadError ? 'Retry' : question || '...'}
        </div>
        <input
          type="text"
          inputMode="numeric"
          required
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2 rounded-md bg-[#0F1D33] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D9A438] font-mono-num"
        />
      </div>
    </div>
  );
}
