import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Globe,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  Search,
  Shield,
  UserCheck,
  X,
} from 'lucide-react';
import { formatLocalizedPrice, LANGUAGE_OPTIONS, UI_TEXT } from '../i18n/translations.ts';
import { matchesListingSearch } from '../lib/search.ts';
import type { Listing, SupportedLang, UserProfile } from '../types/index.ts';

interface HeaderProps {
  lang: SupportedLang;
  onChangeLang: (lang: SupportedLang) => void;
  onOpenContact: () => void;
  onOpenAuth: () => void;
  onOpenCreateListing: () => void;
  onSelectRentalsSubmenu: (sub: 'house' | 'car') => void;
  onSelectLookingForJob: () => void;
  onSelectScope: (scope: 'all' | 'mine' | 'admin') => void;
  activeScope: 'all' | 'mine' | 'admin';
  user: UserProfile | null;
  isAdmin: boolean;
  onSignOut: () => void;
  listings: Listing[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSubmitSearch: () => void;
  onSelectSearchResult: (item: Listing) => void;
}

export function Header({
  lang,
  onChangeLang,
  onOpenContact,
  onOpenAuth,
  onOpenCreateListing,
  onSelectRentalsSubmenu,
  onSelectLookingForJob,
  onSelectScope,
  activeScope,
  user,
  isAdmin,
  onSignOut,
  listings,
  searchQuery,
  onSearchChange,
  onSubmitSearch,
  onSelectSearchResult,
}: HeaderProps) {
  const t = UI_TEXT[lang];
  const [rentalsOpen, setRentalsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const trimmedQuery = searchQuery.trim();
  const matchingListings = useMemo(() => {
    if (!trimmedQuery) return [];
    return listings.filter((item) => matchesListingSearch(item, trimmedQuery, lang));
  }, [listings, trimmedQuery, lang]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setRentalsOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchDropdownOpen(false);
    setMobileMenuOpen(false);
    onSubmitSearch();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#071121]/92 backdrop-blur-md">
      {/* Top Utility Bar: Centralized Contact Us + Support Mobile, Top-Right Language */}
      <div className="border-b border-slate-800/70 bg-[#050C18]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-9 py-1.5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 text-xs">
          <div className="hidden sm:block" aria-hidden="true" />

          <div className="flex items-center justify-center gap-5 sm:gap-7">
            <button
              type="button"
              onClick={onOpenContact}
              className="inline-flex items-center gap-1.5 text-slate-200 hover:text-[#D9A438] transition-colors whitespace-nowrap shrink-0 cursor-pointer font-medium"
            >
              <Mail className="w-3.5 h-3.5 text-[#D9A438]" />
              <span>{t.contactUs}</span>
            </button>
            <a
              href="tel:+33759163133"
              className="inline-flex items-center gap-1.5 text-slate-200 hover:text-[#D9A438] transition-colors font-mono-num whitespace-nowrap shrink-0 font-medium"
            >
              <Phone className="w-3.5 h-3.5 text-[#D9A438]" />
              <span>+33 7 59 16 31 33</span>
            </a>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
            <Globe className="w-3.5 h-3.5 text-[#D9A438]" />
            <label htmlFor="lang-select" className="sr-only">
              Language
            </label>
            <select
              id="lang-select"
              value={lang}
              onChange={(e) => onChangeLang(e.target.value as SupportedLang)}
              className="bg-[#0E1B30] text-slate-100 border border-slate-700/80 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-[#D9A438] cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code} className="bg-[#0E1B30] text-slate-100">
                  {opt.nativeLabel}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Brand Logo Zone */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('hero');
          }}
          className="inline-flex items-center shrink-0 rounded-lg bg-[#F8FAFC] px-2.5 py-1 border border-[#D9A438]/40 shadow-sm hover:border-[#D9A438] transition-colors"
        >
          <img
            src="/assets/aistudio/job-squad-logo-2000px_8dfce4de.png"
            alt="JobSQUAD"
            referrerPolicy="no-referrer"
            className="h-8 sm:h-9 w-auto object-contain"
          />
        </a>

        {/* Primary Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium text-slate-200">
          <button
            type="button"
            onClick={() => scrollToSection('about')}
            className="hover:text-[#D9A438] transition-colors whitespace-nowrap shrink-0 cursor-pointer uppercase"
          >
            {t.navAbout}
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('recruitment')}
            className="hover:text-[#D9A438] transition-colors whitespace-nowrap shrink-0 cursor-pointer uppercase"
          >
            {t.navRecruitment}
          </button>

          {/* Rentals Dropdown Submenu (House / Car) */}
          <div
            className="relative"
            onMouseEnter={() => setRentalsOpen(true)}
            onMouseLeave={() => setRentalsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setRentalsOpen((v) => !v)}
              aria-expanded={rentalsOpen}
              className="inline-flex items-center gap-1 hover:text-[#D9A438] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2 uppercase"
            >
              <span>{t.navRentals}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {rentalsOpen && (
              <div className="absolute left-0 top-full w-48 rounded-lg border border-slate-700/80 bg-[#0D1A2F] shadow-xl py-1.5 z-50">
                <button
                  type="button"
                  onClick={() => {
                    onSelectRentalsSubmenu('house');
                    scrollToSection('rentals');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-[#162742] hover:text-[#D9A438] transition-colors cursor-pointer uppercase"
                >
                  {t.navHouse}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectRentalsSubmenu('car');
                    scrollToSection('rentals');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-[#162742] hover:text-[#D9A438] transition-colors cursor-pointer uppercase"
                >
                  {t.navCar}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => scrollToSection('sales')}
            className="hover:text-[#D9A438] transition-colors whitespace-nowrap shrink-0 cursor-pointer uppercase"
          >
            {t.navSales}
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectLookingForJob();
              scrollToSection('recruitment');
            }}
            className="hover:text-[#D9A438] transition-colors whitespace-nowrap shrink-0 cursor-pointer uppercase"
          >
            {t.navLookingForJob}
          </button>
        </nav>

        {/* Right Primary Action / Auth Zone */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onSelectScope(activeScope === 'mine' ? 'all' : 'mine');
                  scrollToSection('recruitment');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeScope === 'mine'
                    ? 'border-[#D9A438] bg-[#D9A438]/15 text-[#D9A438]'
                    : 'border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                }`}
              >
                {t.myPosts}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const nextScope = activeScope === 'admin' ? 'all' : 'admin';
                    onSelectScope(nextScope);
                    if (nextScope === 'admin') {
                      window.setTimeout(() => scrollToSection('admin-console'), 60);
                    } else {
                      scrollToSection('recruitment');
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeScope === 'admin'
                      ? 'border-[#D9A438] bg-[#D9A438]/15 text-[#D9A438]'
                      : 'border-slate-700 text-amber-300 hover:border-[#D9A438]/60'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t.adminPanel}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenCreateListing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D9A438] text-[#071121] text-xs font-semibold hover:bg-[#E5B34B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.postListing}</span>
              </button>

              <button
                type="button"
                onClick={onOpenAuth}
                title={user.displayName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 hover:border-slate-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer max-w-[140px]"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#D9A438] shrink-0" />
                <span className="truncate">{user.displayName}</span>
              </button>

              <button
                type="button"
                onClick={onSignOut}
                aria-label={t.signOut}
                title={t.signOut}
                className="p-2 rounded-lg border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-lg bg-[#D9A438] text-[#071121] text-xs font-semibold hover:bg-[#E5B34B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.registerLogin}
            </button>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex lg:hidden items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={onOpenCreateListing}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#D9A438] text-[#071121] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.postListing}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle Menu"
            className="p-2.5 rounded-lg border border-slate-700 text-slate-200 hover:border-[#D9A438] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#081325] px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => scrollToSection('about')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-[#13223A] uppercase"
          >
            {t.navAbout}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('recruitment')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-[#13223A] uppercase"
          >
            {t.navRecruitment}
          </button>
          <div className="pl-3 space-y-1 border-l border-slate-700/80 ml-3">
            <button
              type="button"
              onClick={() => {
                onSelectRentalsSubmenu('house');
                scrollToSection('rentals');
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-[#13223A] hover:text-[#D9A438] uppercase"
            >
              {t.navRentals} — {t.navHouse}
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectRentalsSubmenu('car');
                scrollToSection('rentals');
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-[#13223A] hover:text-[#D9A438] uppercase"
            >
              {t.navRentals} — {t.navCar}
            </button>
          </div>
          <button
            type="button"
            onClick={() => scrollToSection('sales')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-[#13223A] uppercase"
          >
            {t.navSales}
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectLookingForJob();
              scrollToSection('recruitment');
            }}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-[#13223A] uppercase"
          >
            {t.navLookingForJob}
          </button>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {user ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectScope(activeScope === 'mine' ? 'all' : 'mine');
                    scrollToSection('recruitment');
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-200"
                >
                  {t.myPosts}
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextScope = activeScope === 'admin' ? 'all' : 'admin';
                      onSelectScope(nextScope);
                      if (nextScope === 'admin') {
                        window.setTimeout(() => scrollToSection('admin-console'), 60);
                      } else {
                        scrollToSection('recruitment');
                      }
                    }}
                    className="px-3 py-2 rounded-lg border border-amber-500/40 text-xs text-amber-300"
                  >
                    {t.adminPanel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300"
                >
                  {t.signOut}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-2.5 rounded-lg bg-[#D9A438] text-[#071121] text-sm font-semibold"
              >
                {t.registerLogin}
              </button>
            )}
          </div>
        </div>
      )}
      {/* Global Search Bar Strip */}
      <div className="border-t border-slate-800/70 bg-[#061020]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div ref={searchContainerRef} className="relative max-w-3xl mx-auto">
            <form
              onSubmit={handleSearchFormSubmit}
              role="search"
              className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#0B172A] px-3 py-1.5 focus-within:border-[#D9A438] transition-colors"
            >
              <Search className="w-4 h-4 text-[#D9A438] shrink-0" aria-hidden="true" />
              <input
                type="text"
                role="searchbox"
                aria-label={t.search.placeholder}
                value={searchQuery}
                onFocus={() => {
                  if (trimmedQuery) setSearchDropdownOpen(true);
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  onSearchChange(val);
                  setSearchDropdownOpen(val.trim().length > 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchDropdownOpen(false);
                }}
                placeholder={t.search.placeholder}
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              {trimmedQuery && (
                <>
                  <span className="hidden sm:inline-block text-[11px] font-mono-num text-amber-300/90 whitespace-nowrap shrink-0 px-1.5">
                    {matchingListings.length} {t.search.matchesCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange('');
                      setSearchDropdownOpen(false);
                    }}
                    aria-label={t.search.clear}
                    title={t.search.clear}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                type="submit"
                className="px-3 py-1 rounded-md bg-[#D9A438] text-[#071121] text-xs font-semibold hover:bg-[#E5B34B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.search.button}
              </button>
            </form>

            {searchDropdownOpen && trimmedQuery && (
              <div className="jobsquad-surface absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl shadow-2xl border border-slate-700/90 overflow-hidden">
                {matchingListings.length === 0 ? (
                  <div className="px-4 py-4 text-xs sm:text-sm text-slate-400 text-center">
                    {t.search.noResults}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
                    {matchingListings.slice(0, 6).map((item) => {
                      const tr = item.translations?.[lang];
                      const displayTitle =
                        item.type === 'job' && item.category === 'looking_for_job'
                          ? `${t.categories.looking_for_job} — ${item.ownerName || 'Member'}`
                          : tr?.title || item.title;
                      const displayLocation = tr?.location || item.location;
                      const period =
                        item.type === 'house'
                          ? 'month'
                          : item.type === 'car'
                            ? 'day'
                            : 'once';

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSearchDropdownOpen(false);
                            setMobileMenuOpen(false);
                            onSelectSearchResult(item);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#13223A]/90 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="px-1.5 py-0.5 rounded bg-[#D9A438]/15 border border-[#D9A438]/35 text-[#D9A438] font-semibold shrink-0">
                                {t.search.typeLabels[item.type]}
                              </span>
                              <span className="text-slate-400 truncate">
                                {t.categories[item.category] || item.category}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-slate-100 truncate">
                              {displayTitle}
                            </p>
                            <p className="inline-flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-full">
                              <MapPin className="w-3 h-3 text-[#D9A438]/80 shrink-0" />
                              <span className="truncate">{displayLocation}</span>
                            </p>
                          </div>
                          {item.type !== 'job' && (
                            <span className="font-mono-num text-xs font-bold text-[#D9A438] shrink-0">
                              {formatLocalizedPrice(item.priceEur, lang, period)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
