import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Edit3,
  Eye,
  Flag,
  MapPin,
  Phone,
  Plus,
  Search,
  Share2,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { formatLocalizedPrice, formatPostDateTime, UI_TEXT } from '../i18n/translations.ts';
import { formatPhoneNumber } from '../lib/phone.ts';
import { matchesListingSearch } from '../lib/search.ts';
import type { Listing, SupportedLang } from '../types/index.ts';
import { ImageSlider } from './ImageSlider.tsx';

interface ListingsBoardProps {
  lang: SupportedLang;
  listings: Listing[];
  searchQuery: string;
  onClearSearch: () => void;
  selectedJobCat: string;
  onChangeJobCat: (cat: string) => void;
  onOpenPostLookingForJob: () => void;
  rentalsSubtab: 'house' | 'car';
  onChangeRentalsSubtab: (tab: 'house' | 'car') => void;
  currentUserId: string | null;
  isAdmin: boolean;
  activeScope: 'all' | 'mine' | 'admin';
  onClearScope: () => void;
  onViewDetails: (listing: Listing) => void;
  onEditListing: (listing: Listing) => void;
  onFlagListing: (listing: Listing) => void;
  onDeleteListing: (listing: Listing) => void;
}

const JOB_CATEGORIES = [
  'babysitting',
  'restaurant',
  'construction',
  'cleaning',
  'elderly_care',
  'companion',
  'looking_for_job',
];

export function ListingsBoard({
  lang,
  listings,
  searchQuery,
  onClearSearch,
  selectedJobCat,
  onChangeJobCat,
  onOpenPostLookingForJob,
  rentalsSubtab,
  onChangeRentalsSubtab,
  currentUserId,
  isAdmin,
  activeScope,
  onClearScope,
  onViewDetails,
  onEditListing,
  onFlagListing,
  onDeleteListing,
}: ListingsBoardProps) {
  const t = UI_TEXT[lang];
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
      const bar = filterBarRef.current;
      if (!sentinel) return;

      const headerEl = document.querySelector('header');
      const headerHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 100;
      const sentinelRect = sentinel.getBoundingClientRect();
      const barHeight = bar ? Math.round(bar.getBoundingClientRect().height) : 54;

      const shouldFloat = sentinelRect.top <= headerHeight;
      const nextTop = headerHeight;

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

    const headerEl = document.querySelector('header');
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateFloatingPosition())
        : null;
    if (resizeObserver && headerEl) {
      resizeObserver.observe(headerEl);
    }
    if (resizeObserver && filterBarRef.current) {
      resizeObserver.observe(filterBarRef.current);
    }
    document.fonts?.ready?.then(() => updateFloatingPosition()).catch(() => {});

    return () => {
      window.removeEventListener('scroll', updateFloatingPosition);
      window.removeEventListener('resize', updateFloatingPosition);
      resizeObserver?.disconnect();
    };
  }, [lang, activeScope, listings.length]);

  const handleSelectJobCategory = (cat: string) => {
    onChangeJobCat(cat);
    const section = recruitmentSectionRef.current;
    const headerEl = document.querySelector('header');
    const headerHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 100;
    if (section) {
      const rect = section.getBoundingClientRect();
      if (rect.bottom < headerHeight + 90 || rect.top > window.innerHeight * 0.7) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const hasSearch = searchQuery.trim().length > 0;
  const scopedListings = listings.filter((item) => {
    if (activeScope === 'mine' && currentUserId) {
      if (item.ownerId !== currentUserId) return false;
    }
    return matchesListingSearch(item, searchQuery, lang);
  });

  const jobListings = scopedListings.filter((item) => {
    if (item.type !== 'job') return false;
    if (selectedJobCat === 'all') {
      return activeScope === 'mine' || hasSearch ? true : item.category !== 'looking_for_job';
    }
    return item.category === selectedJobCat;
  });
  const houseListings = scopedListings.filter((item) => item.type === 'house');
  const carListings = scopedListings.filter((item) => item.type === 'car');
  const salesListings = scopedListings.filter((item) => item.type === 'sale');
  const totalSearchMatches =
    jobListings.length + houseListings.length + carListings.length + salesListings.length;

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

      {/* Active Global Search Summary Banner */}
      {hasSearch && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="jobsquad-surface rounded-xl px-5 py-4 border-[#D9A438]/45 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm text-slate-100">
              <Search className="w-4 h-4 text-[#D9A438] shrink-0" />
              <span>
                {t.search.resultsFor}{' '}
                <strong className="text-[#D9A438]">“{searchQuery.trim()}”</strong>
                {' · '}
                <span className="font-mono-num text-amber-200">
                  {totalSearchMatches} {t.search.matchesCount}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('recruitment')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#0B1628] text-xs font-medium text-slate-200 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer"
              >
                {t.search.typeLabels.job} ({jobListings.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeRentalsSubtab('house');
                  document.getElementById('rentals')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#0B1628] text-xs font-medium text-slate-200 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer"
              >
                {t.search.typeLabels.house} ({houseListings.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeRentalsSubtab('car');
                  document.getElementById('rentals')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#0B1628] text-xs font-medium text-slate-200 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer"
              >
                {t.search.typeLabels.car} ({carListings.length})
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('sales')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#0B1628] text-xs font-medium text-slate-200 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer"
              >
                {t.search.typeLabels.sale} ({salesListings.length})
              </button>
              <button
                type="button"
                onClick={onClearSearch}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#D9A438]/15 border border-[#D9A438]/40 text-xs font-semibold text-[#D9A438] hover:bg-[#D9A438] hover:text-[#071121] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t.search.clear}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: RECRUITMENT (Non-clickable recruiter mobile label + Share Post; Floating Category Menu on scroll) */}
      <section
        id="recruitment"
        ref={recruitmentSectionRef}
        className="scroll-mt-36 py-14 sm:py-24 border-b border-slate-800/70"
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

          {/* Interactive Job Category Filter Bar (Attaches directly below website menu bar while scrolling until the end) */}
          <div
            ref={filterSentinelRef}
            style={floatingMenu.active ? { minHeight: floatingMenu.placeholderHeight } : undefined}
          >
            <div
              className={
                floatingMenu.active
                  ? 'fixed left-0 right-0 z-30 border-b border-[#D9A438]/40 bg-[#071121]/95 backdrop-blur-md shadow-xl transition-all duration-150'
                  : ''
              }
              style={floatingMenu.active ? { top: floatingMenu.top } : undefined}
            >
              <div
                ref={filterBarRef}
                className={
                  floatingMenu.active
                    ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto sm:flex-wrap'
                    : 'flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-[#0B1628] border border-slate-800/90'
                }
              >
                <button
                  type="button"
                  onClick={() => handleSelectJobCategory('all')}
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
                    onClick={() => handleSelectJobCategory(cat)}
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

          {selectedJobCat === 'looking_for_job' && (
            <div className="jobsquad-surface rounded-xl px-5 py-4 border-[#D9A438]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-slate-200 leading-relaxed">
                {t.lookingForJobLead}
              </p>
              <button
                type="button"
                onClick={onOpenPostLookingForJob}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D9A438] text-[#071121] text-xs font-bold uppercase tracking-wide hover:bg-[#E5B34B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.postLookingForJob}</span>
              </button>
            </div>
          )}

          {jobListings.length === 0 ? (
            <div className="jobsquad-surface rounded-xl p-10 text-center text-sm text-slate-400">
              {t.noListings}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {jobListings.map((item) => {
                const loc = getLocalized(item);
                const phoneDisplay = formatPhoneNumber(item.contactPhone || '+33 7 59 16 31 33');
                const isLookingForJobPost = item.category === 'looking_for_job';
                const categoryLabel = t.categories[item.category] || item.category;
                const restaurantLabel =
                  item.category === 'restaurant'
                    ? (item.specs?.restaurantName || item.ownerName || '').trim()
                    : '';
                const rawEmploymentType = item.specs?.employmentType || '';
                const localizedEmploymentType =
                  rawEmploymentType in t.listingModal.scheduleOptions
                    ? t.listingModal.scheduleOptions[
                        rawEmploymentType as keyof typeof t.listingModal.scheduleOptions
                      ]
                    : rawEmploymentType;
                const scheduleLabel = item.isSeeded
                  ? loc.specsSummary || localizedEmploymentType
                  : localizedEmploymentType || loc.specsSummary || '';

                return (
                  <article
                    key={item.id}
                    id={`post-${item.id}`}
                    className={`scroll-mt-48 jobsquad-surface jobsquad-card-hover rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 w-full ${
                      item.flagged ? 'border-amber-500/60 bg-amber-950/15' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {item.flagged && (
                        <div className="rounded-lg border border-amber-500/45 bg-amber-950/45 px-3 py-2 text-xs text-amber-200 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold">{t.moderation.flaggedBadge}</strong>
                            {item.flagReason ? `: ${item.flagReason}` : ''}
                          </span>
                        </div>
                      )}

                      {/* Row 1: Subcategory (- Restaurant name when applicable), Location/City, Schedule (slightly larger font) */}
                      <div className="flex items-center gap-x-3 gap-y-1 text-[15px] sm:text-base font-medium flex-wrap">
                        <span className="text-[#D9A438] font-semibold">
                          {categoryLabel}
                          {restaurantLabel
                            ? ` - ${t.specsLabels.restaurantName}: ${restaurantLabel}`
                            : ''}
                        </span>
                        <span className="text-slate-500" aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1.5 text-slate-200">
                          <MapPin className="w-4 h-4 text-[#D9A438]/85 shrink-0" />
                          <span>{loc.location}</span>
                        </span>
                        {scheduleLabel && (
                          <>
                            <span className="text-slate-500" aria-hidden="true">·</span>
                            <span className="text-amber-200">{scheduleLabel}</span>
                          </>
                        )}
                      </div>

                      {/* Row 2: Title (omitted for Looking for Job posts since Job Title is removed) */}
                      {!isLookingForJobPost && (
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-50 leading-snug">
                          {loc.title}
                        </h3>
                      )}

                      {/* Row 3: Detailed Description */}
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {loc.description}
                      </p>

                      {/* Row 4: Posted by and Posted on */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-[#D9A438]/85 shrink-0" />
                          <span>
                            {t.specsLabels.postedBy}:{' '}
                            <strong className="font-medium text-slate-200">
                              {item.ownerName || 'Member'}
                            </strong>
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-mono-num">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            {t.specsLabels.postedAt}: {formatPostDateTime(item.createdAt, lang)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 lg:pt-0 lg:border-t-0 lg:border-l lg:border-slate-800/80 lg:pl-6 lg:w-72 shrink-0 flex flex-col items-center justify-center text-center gap-2.5">
                      {/* Non-clickable Recruiter Mobile Number placed centered above Share Post */}
                      <div className="w-full flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                          {t.recruiterMobile}
                        </span>
                        <div
                          aria-label={`${t.recruiterMobile}: ${phoneDisplay}`}
                          className="w-full max-w-full overflow-hidden inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-[#D9A438]/40 text-xs sm:text-sm font-bold font-mono-num text-[#D9A438] whitespace-nowrap select-text"
                        >
                          <Phone className="w-4 h-4 shrink-0" />
                          <span className="truncate">{phoneDisplay}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleShare(item)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 text-slate-200 text-xs font-medium hover:border-[#D9A438] hover:text-[#D9A438] transition-colors whitespace-nowrap cursor-pointer"
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

                      {canModify(item) && (
                        <div className="w-full flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditListing(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700/80 text-xs text-slate-300 hover:border-[#D9A438] hover:text-[#D9A438] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{t.editPost}</span>
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => onFlagListing(item)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer ${
                                item.flagged
                                  ? 'border-amber-400/70 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                                  : 'border-amber-500/35 text-amber-300 hover:border-amber-400'
                              }`}
                            >
                              <Flag className="w-3.5 h-3.5" />
                              <span>{item.flagged ? t.moderation.unflagBtn : t.moderation.flagBtn}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteListing(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-xs text-rose-400 hover:text-rose-300 hover:border-rose-400 cursor-pointer"
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
      <section id="rentals" className="scroll-mt-36 py-14 sm:py-24 border-b border-slate-800/70">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeRentalItems.map((item) => {
                const loc = getLocalized(item);
                return (
                  <article
                    key={item.id}
                    id={`post-${item.id}`}
                    className={`scroll-mt-44 jobsquad-surface jobsquad-card-hover rounded-xl overflow-hidden flex flex-col ${
                      item.flagged ? 'border-amber-500/60 bg-amber-950/15' : ''
                    }`}
                  >
                    <ImageSlider
                      images={item.images}
                      alt={loc.title}
                      aspectClass="aspect-[16/10]"
                      emptyLabel={loc.title}
                    />

                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2.5">
                        {item.flagged && (
                          <div className="rounded-lg border border-amber-500/45 bg-amber-950/45 px-3 py-2 text-xs text-amber-200 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>
                              <strong className="font-semibold">{t.moderation.flaggedBadge}</strong>
                              {item.flagReason ? `: ${item.flagReason}` : ''}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
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

                        <p className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-[#D9A438]/85 shrink-0" />
                          <span>{loc.location}</span>
                        </p>

                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                          {loc.description}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-[#D9A438]/85 shrink-0" />
                            <span>
                              {t.specsLabels.postedBy}:{' '}
                              <strong className="font-medium text-slate-200">
                                {item.ownerName || 'Member'}
                              </strong>
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-mono-num">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>
                              {t.specsLabels.postedAt}: {formatPostDateTime(item.createdAt, lang)}
                            </span>
                          </span>
                        </div>

                        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
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
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditListing(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-slate-300 hover:text-[#D9A438] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{t.editPost}</span>
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => onFlagListing(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-amber-300 hover:text-amber-200 cursor-pointer"
                              >
                                <Flag className="w-3.5 h-3.5" />
                                <span>{item.flagged ? t.moderation.unflagBtn : t.moderation.flagBtn}</span>
                              </button>
                            )}
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
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: LOCAL SALES MARKETPLACE */}
      <section id="sales" className="scroll-mt-36 py-14 sm:py-24 border-b border-slate-800/70">
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
                    className={`scroll-mt-44 jobsquad-surface jobsquad-card-hover rounded-xl overflow-hidden flex flex-col ${
                      item.flagged ? 'border-amber-500/60 bg-amber-950/15' : ''
                    }`}
                  >
                    <ImageSlider
                      images={item.images}
                      alt={loc.title}
                      aspectClass="aspect-[4/3]"
                      emptyLabel={loc.title}
                    />

                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2.5">
                        {item.flagged && (
                          <div className="rounded-lg border border-amber-500/45 bg-amber-950/45 px-3 py-2 text-xs text-amber-200 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>
                              <strong className="font-semibold">{t.moderation.flaggedBadge}</strong>
                              {item.flagReason ? `: ${item.flagReason}` : ''}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
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

                        <p className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-[#D9A438]/85 shrink-0" />
                          <span>{loc.location}</span>
                        </p>

                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                          {loc.description}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-[#D9A438]/85 shrink-0" />
                            <span>
                              {t.specsLabels.postedBy}:{' '}
                              <strong className="font-medium text-slate-200">
                                {item.ownerName || 'Member'}
                              </strong>
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-mono-num">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>
                              {t.specsLabels.postedAt}: {formatPostDateTime(item.createdAt, lang)}
                            </span>
                          </span>
                        </div>

                        <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
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
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditListing(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-300 hover:text-[#D9A438] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{t.editPost}</span>
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => onFlagListing(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-amber-300 hover:text-amber-200 cursor-pointer"
                              >
                                <Flag className="w-3.5 h-3.5" />
                                <span>{item.flagged ? t.moderation.unflagBtn : t.moderation.flagBtn}</span>
                              </button>
                            )}
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
