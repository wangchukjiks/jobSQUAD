import { UI_TEXT } from '../i18n/translations.ts';
import type { SupportedLang } from '../types/index.ts';

interface AboutSectionProps {
  lang: SupportedLang;
}

export function AboutSection({ lang }: AboutSectionProps) {
  const t = UI_TEXT[lang];

  return (
    <section id="about" className="py-20 sm:py-24 border-b border-slate-800/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-3xl space-y-4">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-50 [text-wrap:balance]">
            {t.aboutHeading}
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            {t.aboutLead}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.aboutCards.map((card, index) => (
            <article
              key={card.title}
              className={`jobsquad-surface jobsquad-card-hover rounded-xl p-6 sm:p-7 flex flex-col justify-between gap-4 ${
                index === 0 ? 'md:border-[#D9A438]/30' : ''
              }`}
            >
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-100">
                  {card.title}
                </h3>
                <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed">
                  {card.body}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-xs text-[#D9A438] font-medium">
                JobSQUAD Verified Standard
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
