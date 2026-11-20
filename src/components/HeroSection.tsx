import { ArrowRight, Briefcase, Car, Home, ShoppingBag } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations.ts';
import type { SupportedLang } from '../types/index.ts';

interface HeroSectionProps {
  lang: SupportedLang;
  stats: {
    jobs: number;
    houses: number;
    cars: number;
    sales: number;
  };
  onExploreJobs: () => void;
  onPostListing: () => void;
}

export function HeroSection({
  lang,
  stats,
  onExploreJobs,
  onPostListing,
}: HeroSectionProps) {
  const t = UI_TEXT[lang];

  return (
    <section
      id="hero"
      className="relative min-h-[calc(100svh-120px)] lg:min-h-[calc(100vh-100px)] flex flex-col justify-between overflow-hidden border-b border-slate-800/80"
    >
      {/* Background Inspirational Employment Photography with Measured Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_employment_squad_1795026726275.jpg"
          alt="JobSQUAD employment team collaborating"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#060F1E]/95 via-[#081529]/84 to-[#0B172B]/55"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#071121] via-transparent to-[#071121]/40"
        />
      </div>

      {/* Main Hero Copy */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 sm:pt-24 pb-8 sm:pb-12 flex-1 flex items-center">
        <div className="max-w-2xl space-y-5 sm:space-y-6">
          <h1 className="text-[clamp(1.85rem,4.5vw,3.75rem)] font-bold leading-[1.12] tracking-tight text-slate-50 [text-wrap:balance]">
            {t.heroTitle}
          </h1>
          <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-xl">
            {t.heroSubtitle}
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
            <button
              type="button"
              onClick={onExploreJobs}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-sm hover:bg-[#E5B34B] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-black/30"
            >
              <span>{t.heroCtaPrimary}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onPostListing}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg border border-slate-500/70 bg-[#0B172B]/70 text-slate-100 font-medium text-sm hover:border-[#D9A438] hover:text-[#D9A438] transition-colors whitespace-nowrap shrink-0 cursor-pointer backdrop-blur-sm"
            >
              <span>{t.heroCtaSecondary}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4-Column Live Platform Strip */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <a
            href="#recruitment"
            className="jobsquad-surface jobsquad-card-hover rounded-xl p-4 sm:p-5 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{t.statJobs}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-50 font-mono-num mt-1">
                {stats.jobs}
              </p>
            </div>
            <Briefcase className="w-6 h-6 text-[#D9A438] shrink-0" />
          </a>
          <a
            href="#rentals"
            className="jobsquad-surface jobsquad-card-hover rounded-xl p-4 sm:p-5 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{t.statHouses}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-50 font-mono-num mt-1">
                {stats.houses}
              </p>
            </div>
            <Home className="w-6 h-6 text-[#D9A438] shrink-0" />
          </a>
          <a
            href="#rentals"
            className="jobsquad-surface jobsquad-card-hover rounded-xl p-4 sm:p-5 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{t.statCars}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-50 font-mono-num mt-1">
                {stats.cars}
              </p>
            </div>
            <Car className="w-6 h-6 text-[#D9A438] shrink-0" />
          </a>
          <a
            href="#sales"
            className="jobsquad-surface jobsquad-card-hover rounded-xl p-4 sm:p-5 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{t.statSales}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-50 font-mono-num mt-1">
                {stats.sales}
              </p>
            </div>
            <ShoppingBag className="w-6 h-6 text-[#D9A438] shrink-0" />
          </a>
        </div>
      </div>
    </section>
  );
}
