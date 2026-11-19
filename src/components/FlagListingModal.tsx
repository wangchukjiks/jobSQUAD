import React, { useEffect, useState } from 'react';
import { AlertTriangle, Flag, ShieldOff, Trash2, X } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations.ts';
import type { Listing, SupportedLang } from '../types/index.ts';

interface FlagListingModalProps {
  listing: Listing | null;
  lang: SupportedLang;
  loading?: boolean;
  onConfirmFlag: (listing: Listing, reason: string) => Promise<void>;
  onUnflag: (listing: Listing) => Promise<void>;
  onDelete: (listing: Listing) => void;
  onClose: () => void;
}

type PresetReasonKey = 'irrelevant' | 'harmful' | 'inaccurate' | 'spam';

const PRESET_KEYS: PresetReasonKey[] = ['irrelevant', 'harmful', 'inaccurate', 'spam'];

export function FlagListingModal({
  listing,
  lang,
  loading = false,
  onConfirmFlag,
  onUnflag,
  onDelete,
  onClose,
}: FlagListingModalProps) {
  const t = UI_TEXT[lang];
  const [selectedPreset, setSelectedPreset] = useState<PresetReasonKey>('irrelevant');
  const [customNote, setCustomNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!listing) return;
    setSelectedPreset('irrelevant');
    setCustomNote(listing.flagReason || '');
    setError('');
  }, [listing?.id]);

  if (!listing) return null;

  const localizedTitle = listing.translations?.[lang]?.title || listing.title;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const presetText = t.moderation.reasons[selectedPreset];
    const trimmedCustom = customNote.trim();
    const combinedReason = trimmedCustom
      ? trimmedCustom.toLowerCase().startsWith(presetText.toLowerCase())
        ? trimmedCustom
        : `${presetText} — ${trimmedCustom}`
      : presetText;

    if (combinedReason.trim().length < 2) {
      setError(t.moderation.reasonRequiredError);
      return;
    }

    try {
      await onConfirmFlag(listing, combinedReason.slice(0, 500));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update flag status.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flag-modal-title"
    >
      <div className="jobsquad-surface w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-amber-500/35">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 id="flag-modal-title" className="text-base font-bold text-slate-50 truncate">
              {t.moderation.flagModalTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.cancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t.moderation.flagModalSubtitle}
          </p>

          <div className="rounded-lg bg-[#0A1527] border border-slate-800 px-3.5 py-2.5 text-xs">
            <span className="text-slate-400">{t.categories[listing.category] || listing.category}</span>
            <p className="font-semibold text-slate-100 mt-0.5 line-clamp-2">{localizedTitle}</p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 block">
              {t.moderation.reasonLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_KEYS.map((key) => {
                const active = selectedPreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPreset(key)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-[#0A1527] border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {t.moderation.reasons[key]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">
              {t.moderation.customReasonLabel}
            </label>
            <textarea
              rows={3}
              maxLength={400}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={t.moderation.customReasonPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => onDelete(listing)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-500/40 bg-rose-950/30 text-xs font-semibold text-rose-300 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.moderation.deleteInsteadBtn}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {listing.flagged && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void onUnflag(listing)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-500/40 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/20 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ShieldOff className="w-3.5 h-3.5" />
                  <span>{t.moderation.confirmUnflagBtn}</span>
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-[#071121] text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{t.moderation.confirmFlagBtn}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
