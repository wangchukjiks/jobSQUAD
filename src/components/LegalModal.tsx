import { useEffect, useState } from 'react';
import { FileText, Scale, ShieldCheck, X } from 'lucide-react';
import { LEGAL_CONTENT } from '../i18n/legalContent.ts';
import { UI_TEXT } from '../i18n/translations.ts';
import type { SupportedLang } from '../types/index.ts';

interface LegalModalProps {
  open: boolean;
  initialTab: 'terms' | 'privacy';
  lang: SupportedLang;
  onClose: () => void;
}

export function LegalModal({ open, initialTab, lang, onClose }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);
  const doc = LEGAL_CONTENT[lang];
  const t = UI_TEXT[lang];

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  if (!open) return null;

  const sections = activeTab === 'terms' ? doc.termsSections : doc.privacySections;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="jobsquad-surface w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl my-6 border border-[#D9A438]/35">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-[#081224]">
          <div className="flex items-center gap-2.5 min-w-0">
            <Scale className="w-5 h-5 text-[#D9A438] shrink-0" />
            <h3 id="legal-modal-title" className="text-base sm:text-lg font-bold text-slate-50 truncate">
              {doc.modalTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.legal.closeBtn}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 pb-3 border-b border-slate-800/80 bg-[#0A1527] space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-[#D9A438] text-[#071121]'
                  : 'bg-[#0F1D33] text-slate-300 border border-slate-700 hover:border-[#D9A438] hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{doc.termsTab}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-[#D9A438] text-[#071121]'
                  : 'bg-[#0F1D33] text-slate-300 border border-slate-700 hover:border-[#D9A438] hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{doc.privacyTab}</span>
            </button>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#071121]/80 px-3.5 py-2 text-[11px] text-slate-300 space-y-1">
            <p className="text-[#D9A438] font-medium">{doc.effectiveLabel}</p>
            <p className="text-slate-400">{doc.controllerBadge}</p>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[60dvh] overflow-y-auto">
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h4 className="text-sm sm:text-base font-semibold text-slate-100">
                {section.title}
              </h4>
              {section.paragraphs.map((paragraph, idx) => (
                <p key={idx} className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#081224] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#D9A438] text-[#071121] text-xs font-semibold hover:bg-[#E5B34B] transition-colors cursor-pointer"
          >
            {t.legal.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
