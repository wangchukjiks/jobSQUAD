import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Edit3,
  Eye,
  MapPin,
  Phone,
  Share2,
  Trash2,
} from 'lucide-react';
import { formatLocalizedPrice, UI_TEXT } from '../i18n/translations.ts';
import type { Listing, SupportedLang } from '../types/index.ts';
import { ImageSlider } from './ImageSlider.tsx';

interface ListingsBoardProps {
  lang: SupportedLang;
  listings: Listing[];
  rentalsSubtab: 'house' | 'car';
  onChangeRentalsSubtab: (tab: 'house' | 'car') => void;
  currentUserId: string | null;
  isAdmin: boolean;
  activeScope: 'all' | 'mine' | 'admin';
  onClearScope: () => void;
  onViewDetails: (listing: Listing) => void;
  onEditListing: (listing: Listing) => void;
  onDeleteListing: (listing: Listing) => void;
}

const JOB_CATEGORIES = [
  'babysitting',
  'restaurant',
  'construction',
  'cleaning',
  'elderly_care',
  'companion',
];

export function ListingsBoard({
  lang,
  listings,
  rentalsSubtab,
  onChangeRentalsSubtab,
  currentUserId,
  isAdmin,
  activeScope,
  onClearScope,
  onViewDetails,
  onEditListing,
  onDeleteListing,
}: ListingsBoardProps) {
  const t = UI_TEXT[lang];
  const [selectedJobCat, setSelectedJobCat] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const recruitmentSectionRef = useRef<HTMLElement | null>(null);
  const filterSentinelRef = useRef<HTMLDivElement | null>(null);
  const filterBarRef = useRef<HTMLDivElement | null>(null);
  const [floatingMenu, setFloatingMenu] = useState<{
    active: boolean;
    top: number;
    placeholderHeight: number;
  }>({ active: false, top: 108, placeholderHeight: 54 });

  useEffect(() => {
    const updateFloatingPosition = () => {
      const sentinel = filterSentinelRef.current;
      const section = recruitmentSectionRef.current;
      const bar = filterBarRef.current;
      if (!sentinel || !section) return;

      const headerEl = document.querySelector('header');
      const headerHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 100;
      const sentinelRect = sentinel.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const barHeight = bar ? Math.round(bar.getBoundingClientRect().height) : 54;

      const shouldFloat =
        sentinelRect.top <= headerHeight + 8 &&
        sectionRect.bottom > headerHeight + barHeight + 28;
      const nextTop = headerHeight + 8;

      setFloatingMenu((prev) => {
        const nextHeight = shouldFloat ? barHeight : prev.placeholderHeight;
        if (
          prev.active === shouldFloat &&
          prev.top === nextTop &&
          prev.placeholderHeight === nextHeight
        ) {
          return prev;
        }
        return {
          active: shouldFloat,
          top: nextTop,
          placeholderHeight: nextHeight,
        };
      });
    };

    updateFloatingPosition();
    window.addEventListener('scroll', updateFloatingPosition, { passive: true });
    window.addEventListener('resize', updateFloatingPosition);
    return () => {
      window.removeEventListener('scroll', updateFloatingPosition);
      window.removeEventListener('resize', updateFloatingPosition);
    };
  }, [lang, activeScope, listings.length]);

  const scopedListings = listings.filter((item) => {
    if (currentUserId && !isAdmin) {
      return item.ownerId === currentUserId;
    }
    if (activeScope === 'mine' && currentUserId) {
      return item.ownerId === currentUserId;
    }
    return true;
  });

  const jobListings = scopedListings.filter(
    (item) =>
      item.type === 'job' &&
      (selectedJobCat === 'all' || item.category === selectedJobCat)
  );
  const houseListings = scopedListings.filter((item) => item.type === 'house');
  const carListings = scopedListings.filter((item) => item.type === 'car');
  const salesListings = scopedListings.filter((item) => item.type === 'sale');

  const getLocalized = (item: Listing) => {
    const tr = item.translations?.[lang];
    return {
      title: tr?.title || item.title,
      description: tr?.description || item.description,
      location: tr?.location || item.location,
      specsSummary: tr?.specsSummary || '',
    };
  };

  const canModify = (item: Listing) => {
    if (isAdmin) return true;
    if (item.isSeeded) return false;
    return Boolean(currentUserId && item.ownerId === currentUserId);
  };

  const handleShare = async (item: Listing) => {
    const loc = getLocalized(item);
    const shareUrl = `${window.location.origin}${window.location.pathname}#post-${item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: loc.title, text: loc.location, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((prev) => (prev === item.id ? null : prev)), 2200);
    } catch {
      // User dismissed native share dialog
    }
  };

  const activeRentalItems = rentalsSubtab === 'house' ? houseListings : carListings;

  return (
    <>
      {/* Scope Filter Banner when viewing My Posts or Admin Console */}
      {activeScope !== 'all' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="jobsquad-surface rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-[#D9A438]/40">
            <span className="text-sm font-medium text-amber-200">
              {activeScope === 'admin' ? t.adminPanel : t.myPosts}
            </span>
            <button
              type="button"
              onClick={onClearScope}
              className="text-xs font-semibold text-[#D9A438] hover:underline cursor-pointer"
            >
              {t.allCategories}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: RECRUITMENT (Non-clickable recruiter mobile label + Share Post; Floating Category Menu on scroll) */}
      <section
        id="recruitment"
        ref={recruitmentSectionRef}
        className="py-20 sm:py-24 border-b border-slate-800/70"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-50">
                {t.recruitmentHeading}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {t.recruitmentLead}
              </p>
            </div>
          </div>

          {/* Interactive Job Category Filter Bar (Becomes Floating Menu below header on scroll) */}
          <div
            ref={filterSentinelRef}
            style={floatingMenu.active ? { minHeight: floatingMenu.placeholderHeight } : undefined}
          >
            <div
              className={
                floatingMenu.active
                  ? 'fixed left-0 right-0 z-30 px-4 sm:px-6 lg:px-8 transition-all duration-150'
                  : ''
              }
              style={floatingMenu.active ? { top: floatingMenu.top } : undefined}
            >
              <div
                ref={filterBarRef}
                className={
                  floatingMenu.active
                    ? 'max-w-7xl mx-auto flex items-center gap-2 p-1.5 rounded-xl bg-[#091529]/95 backdrop-blur-md border border-[#D9A438]/45 shadow-2xl overflow-x-auto sm:flex-wrap'
                    : 'flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-[#0B1628] border border-slate-800/90'
                }
              >
                <button
                  type="button"
                  onClick={() => setSelectedJobCat('all')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedJobCat === 'all'
                      ? 'bg-[#D9A438] text-[#071121]'
                      : 'text-slate-300 hover:text-white hover:bg-[#13223A]'
                  }`}
                >
                  {t.allCategories}
                </button>
                {JOB_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedJobCat(cat)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedJobCat === cat
                        ? 'bg-[#D9A438] text-[#071121]'
                        : 'text-slate-300 hover:text-white hover:bg-[#13223A]'
                    }`}
                  >
                    {t.categories[cat] || cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {jobListings.length === 0 ? (
            <div className="jobsquad-surface rounded-xl p-10 text-center text-sm text-slate-400">
              {t.noListings}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobListings.map((item) => {
                const loc = getLocalized(item);
                const phoneDisplay = item.contactPhone || '+33 759163133';
                return (
                  <article
                    key={item.id}
                    id={`post-${item.id}`}
                    className="jobsquad-surface jobsquad-card-hover rounded-xl p-6 flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span className="text-[#D9A438] font-medium">
                          {t.categories[item.category] || item.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.ownerName}</span>
                        {loc.specsSummary && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{loc.specsSummary}</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-50 leading-snug">
                        {loc.title}
                      </h3>

                      <div className="flex items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-slate-400 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{loc.location}</span>
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed">
                        {loc.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Non-clickable Recruiter Mobile Number Label */}
                        <div
                          aria-label={`${t.recruiterMobile}: ${phoneDisplay}`}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0A1527] border border-[#D9A438]/35 text-xs font-semibold font-mono-num text-[#D9A438] whitespace-nowrap select-text"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{phoneDisplay}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleShare(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-200 text-xs font-medium hover:border-[#D9A438] hover:text-[#D9A438] transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{t.linkCopied}</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>{t.sharePost}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {canModify(item) && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onEditListing(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-300 hover:text-[#D9A438] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{t.editPost}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteListing(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t.deletePost}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: RENTALS (House & Car Submenu) */}
      <section id="rentals" className="py-20 sm:py-24 border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-50">
                {t.rentalsHeading}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {t.rentalsLead}
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#0B1628] border border-slate-800 self-start">
              <button
                type="button"
                onClick={() => onChangeRentalsSubtab('house')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  rentalsSubtab === 'house'
                    ? 'bg-[#D9A438] text-[#071121]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t.houseTab} ({houseListings.length})
              </button>
              <button
                type="button"
                onClick={() => onChangeRentalsSubtab('car')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  rentalsSubtab === 'car'
                    ? 'bg-[#D9A438] text-[#071121]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t.carTab} ({carListings.length})
              </button>
            </div>
          </div>

          {activeRentalItems.length === 0 ? (
            <div className="jobsquad-surface rounded-xl p-10 text-center text-sm text-slate-400">
              {t.noListings}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {activeRentalItems.map((item) => {
                const loc = getLocalized(item);
                return (
                  <article
                    key={item.id}
                    id={`post-${item.id}`}
                    className="jobsquad-surface jobsquad-card-hover rounded-xl overflow-hidden flex flex-col"
                  >
                    <ImageSlider
                      images={item.images}
                      alt={loc.title}
                      aspectClass="aspect-[16/10]"
                      emptyLabel={loc.title}
                    />

                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                          <span>
                            <span className="text-[#D9A438] font-medium">
                              {t.categories[item.category] || item.category}
                            </span>
                            {loc.specsSummary ? ` · ${loc.specsSummary}` : ''}
                          </span>
                          <span className="font-mono-num text-base font-bold text-[#D9A438] shrink-0">
                            {formatLocalizedPrice(
                              item.priceEur,
                              lang,
                              item.type === 'house' ? 'month' : 'day'
                            )}
                          </span>
                        </div>

                        <h3 className="text-xl font-semibold text-slate-50 leading-snug">
                          {loc.title}
                        </h3>

                        <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{loc.location}</span>
                        </p>

                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                          {loc.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onViewDetails(item)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D9A438] text-[#071121] text-xs font-semibold hover:bg-[#E5B34B] transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.viewDetails}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShare(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs hover:border-[#D9A438] hover:text-[#D9A438] transition-colors whitespace-nowrap cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedId === item.id ? t.linkCopied : t.sharePost}</span>
                          </button>
                        </div>

                        {canModify(item) && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onEditListing(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-slate-300 hover:text-[#D9A438] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{t.editPost}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteListing(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t.deletePost}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: LOCAL SALES MARKETPLACE */}
      <section id="sales" className="py-20 sm:py-24 border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-3 max-w-2xl">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-50">
              {t.salesHeading}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {t.salesLead}
            </p>
          </div>

          {salesListings.length === 0 ? (
            <div className="jobsquad-surface rounded-xl p-10 text-center text-sm text-slate-400">
              {t.noListings}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salesListings.map((item) => {
                const loc = getLocalized(item);
                return (
                  <article
                    key={item.id}
                    id={`post-${item.id}`}
                    className="jobsquad-surface jobsquad-card-hover rounded-xl overflow-hidden flex flex-col"
                  >
                    <ImageSlider
                      images={item.images}
                      alt={loc.title}
                      aspectClass="aspect-[4/3]"
                      emptyLabel={loc.title}
                    />

                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                          <span>
                            <span className="text-[#D9A438] font-medium">
                              {t.categories[item.category] || item.category}
                            </span>
                            {loc.specsSummary ? ` · ${loc.specsSummary}` : ''}
                          </span>
                          <span className="font-mono-num text-base font-bold text-[#D9A438] shrink-0">
                            {formatLocalizedPrice(item.priceEur, lang, 'once')}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-50 leading-snug">
                          {loc.title}
                        </h3>

                        <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{loc.location}</span>
                        </p>

                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                          {loc.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onViewDetails(item)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#D9A438] text-[#071121] text-xs font-semibold hover:bg-[#E5B34B] transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.viewDetails}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShare(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs hover:border-[#D9A438] hover:text-[#D9A438] transition-colors whitespace-nowrap cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedId === item.id ? t.linkCopied : t.sharePost}</span>
                          </button>
                        </div>

                        {canModify(item) && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onEditListing(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-300 hover:text-[#D9A438] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{t.editPost}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteListing(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t.deletePost}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
