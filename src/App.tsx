import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AuthModal } from './components/AuthModal.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { AdminUsersPanel } from './components/AdminUsersPanel.tsx';
import { ChatbotWidget } from './components/ChatbotWidget.tsx';
import { ContactModal } from './components/ContactModal.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { FlagListingModal } from './components/FlagListingModal.tsx';
import { Footer } from './components/Footer.tsx';
import { Header } from './components/Header.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { LegalModal } from './components/LegalModal.tsx';
import { ListingDetailModal } from './components/ListingDetailModal.tsx';
import { ListingFormModal } from './components/ListingFormModal.tsx';
import { ListingsBoard } from './components/ListingsBoard.tsx';
import { SEED_LISTINGS } from './data/seedListings.ts';
import { UI_TEXT } from './i18n/translations.ts';
import { matchesListingSearch } from './lib/search.ts';
import {
  deleteServerListingById,
  ensureCsrfToken,
  fetchCurrentAuthUser,
  fetchServerListings,
  flagServerListing,
  logoutServerSession,
  syncFirebaseSession,
  translateListingViaServer,
} from './lib/api.ts';
import {
  auth,
  checkIsAdmin,
  deleteListingDoc,
  fetchFirestoreListingsOnce,
  flagListingDoc,
  getUserProfile,
  signOutUser,
  subscribeListings,
} from './lib/firebase.ts';
import type { Listing, SupportedLang, UserProfile } from './types/index.ts';

function JobSquadShell() {
  // Default language is Chinese ('zh') as required
  const [lang, setLang] = useState<SupportedLang>('zh');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [firestoreListings, setFirestoreListings] = useState<Listing[]>([]);
  const [serverListings, setServerListings] = useState<Listing[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const [rentalsSubtab, setRentalsSubtab] = useState<'house' | 'car'>('house');
  const [selectedJobCat, setSelectedJobCat] = useState<string>('all');
  const [activeScope, setActiveScope] = useState<'all' | 'mine' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [contactOpen, setContactOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitialMode, setFormInitialMode] = useState<'job' | 'looking_for_job' | null>(null);
  const [pendingPostMode, setPendingPostMode] = useState<'job' | 'looking_for_job' | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [pendingFlag, setPendingFlag] = useState<Listing | null>(null);
  const [flagLoading, setFlagLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Listing | null>(null);

  const t = UI_TEXT[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { origin, pathname, hostname } = window.location;
    if (!origin.startsWith('https://') || hostname === 'localhost' || hostname === '127.0.0.1') {
      return;
    }
    const canonicalUrl = `${origin}${pathname}`;
    const ogCardImageUrl = `${origin}/assets/jobsquad-og-560x294.png`;
    const xCardImageUrl = `${origin}/assets/jobsquad-x-400x400.png`;

    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = canonicalUrl;

    const updates: Array<[string, string]> = [
      ['meta[property="og:url"]', canonicalUrl],
      ['meta[name="twitter:url"]', canonicalUrl],
      ['meta[property="og:image"]', ogCardImageUrl],
      ['meta[property="og:image:secure_url"]', ogCardImageUrl],
      ['meta[name="twitter:image"]', xCardImageUrl],
    ];
    for (const [selector, content] of updates) {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el) el.content = content;
    }
  }, []);

  const refreshServerListings = async () => {
    const { listings, deletedIds: del } = await fetchServerListings();
    setServerListings(listings);
    setDeletedIds(del);
  };

  useEffect(() => {
    ensureCsrfToken().catch(() => {});
    fetchCurrentAuthUser().then(async (srvUser) => {
      if (srvUser) {
        setUserProfile(srvUser);
        setIsAdmin(Boolean(srvUser.isAdmin));
      }
      await refreshServerListings();
    });
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        const srvUser = await fetchCurrentAuthUser();
        if (srvUser) {
          setUserProfile(srvUser);
          setIsAdmin(Boolean(srvUser.isAdmin));
        } else {
          setUserProfile(null);
          setIsAdmin(false);
          setActiveScope('all');
        }
        await refreshServerListings();
        return;
      }

      const adminFlag = await checkIsAdmin(fbUser);
      setIsAdmin(adminFlag);

      let existingProfile: UserProfile | null = null;
      try {
        existingProfile = await getUserProfile(fbUser.uid);
      } catch {
        existingProfile = null;
      }

      let syncedUser: UserProfile | null = null;
      try {
        const idToken = await fbUser.getIdToken();
        syncedUser = await syncFirebaseSession(
          idToken,
          existingProfile
            ? {
                uid: fbUser.uid,
                email: fbUser.email || existingProfile.email,
                displayName: existingProfile.displayName,
                phone: existingProfile.phone,
                accountType: existingProfile.accountType,
                acceptedTerms: existingProfile.acceptedTerms,
              }
            : {
                uid: fbUser.uid,
                email: fbUser.email || '',
                displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Member',
              }
        );
      } catch {
        // Continue with client-side Firebase session
      }

      const resolvedProfile = existingProfile || syncedUser;
      if (resolvedProfile && resolvedProfile.phone && (resolvedProfile.acceptedTerms || adminFlag || resolvedProfile.isAdmin)) {
        setUserProfile({ ...resolvedProfile, isAdmin: Boolean(adminFlag || resolvedProfile.isAdmin) });
      } else {
        setUserProfile({
          uid: resolvedProfile?.uid || fbUser.uid,
          displayName: resolvedProfile?.displayName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Member',
          email: resolvedProfile?.email || fbUser.email || '',
          phone: resolvedProfile?.phone || '',
          accountType: resolvedProfile?.accountType || 'employer',
          acceptedTerms: Boolean(resolvedProfile?.acceptedTerms || adminFlag),
          isAdmin: Boolean(adminFlag || resolvedProfile?.isAdmin),
        });
        if (!resolvedProfile?.phone || !(resolvedProfile?.acceptedTerms || adminFlag)) {
          setAuthOpen(true);
        }
      }

      await refreshServerListings();
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsubListings = subscribeListings(
      (items) => setFirestoreListings(items),
      (err) => console.error('Listings subscription error:', err)
    );

    const handleSyncOnResume = () => {
      if (document.visibilityState === 'visible') {
        void refreshServerListings();
        void fetchFirestoreListingsOnce()
          .then((items) => setFirestoreListings(items))
          .catch(() => {});
      }
    };

    window.addEventListener('focus', handleSyncOnResume);
    document.addEventListener('visibilitychange', handleSyncOnResume);
    return () => {
      unsubListings();
      window.removeEventListener('focus', handleSyncOnResume);
      document.removeEventListener('visibilitychange', handleSyncOnResume);
    };
  }, []);

  // Merge server-persisted listings, Firestore listings, and seed catalog (respecting admin deletions/edits)
  const allListings = useMemo(() => {
    const deletedSet = new Set(deletedIds);
    const byId = new Map<string, Listing>();

    for (const seed of SEED_LISTINGS) {
      if (!deletedSet.has(seed.id)) byId.set(seed.id, seed);
    }
    for (const fsItem of firestoreListings) {
      if (!deletedSet.has(fsItem.id)) byId.set(fsItem.id, fsItem);
    }
    for (const srvItem of serverListings) {
      if (!deletedSet.has(srvItem.id)) byId.set(srvItem.id, srvItem);
    }

    return Array.from(byId.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
  }, [firestoreListings, serverListings, deletedIds]);

  const visibleListings = allListings;
  const attemptedTranslateRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const missing = allListings.filter((item) => {
      if (item.isSeeded) return false;
      const attemptKey = `${item.id}:${lang}`;
      if (attemptedTranslateRef.current.has(attemptKey)) return false;
      return !item.translations?.[lang]?.title;
    });

    if (missing.length === 0) return;

    let cancelled = false;
    missing.slice(0, 6).forEach((item) => {
      attemptedTranslateRef.current.add(`${item.id}:${lang}`);
      void translateListingViaServer({
        title: item.title,
        description: item.description,
        location: item.location,
        specsSummary: item.translations?.en?.specsSummary || item.specs?.employmentType || '',
      })
        .then(({ translations, aiTranslated }) => {
          if (cancelled || !aiTranslated) return;
          setServerListings((prev) => {
            const exists = prev.some((p) => p.id === item.id);
            if (exists) {
              return prev.map((p) => (p.id === item.id ? { ...p, translations } : p));
            }
            return [{ ...item, translations }, ...prev];
          });
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [allListings, lang]);

  const stats = useMemo(() => {
    const categories: Record<string, number> = {};
    let jobs = 0;
    let houses = 0;
    let cars = 0;
    let sales = 0;

    for (const item of visibleListings) {
      if (item.type === 'job') jobs++;
      else if (item.type === 'house') houses++;
      else if (item.type === 'car') cars++;
      else if (item.type === 'sale') sales++;
      categories[item.category] = (categories[item.category] || 0) + 1;
    }
    return {
      jobs,
      houses,
      cars,
      sales,
      total: visibleListings.length,
      categories,
    };
  }, [visibleListings]);

  const handleOpenPost = (mode: 'job' | 'looking_for_job' = 'job') => {
    if (!userProfile || !userProfile.phone) {
      setPendingPostMode(mode);
      setAuthOpen(true);
      return;
    }
    setEditingListing(null);
    setFormInitialMode(mode);
    setFormOpen(true);
  };

  const handleEditListing = (listing: Listing) => {
    setFormInitialMode(null);
    setEditingListing(listing);
    setFormOpen(true);
  };

  const handleListingSaved = (saved: Listing) => {
    setDeletedIds((prev) => prev.filter((id) => id !== saved.id));
    if (saved.type === 'job' && saved.category === 'looking_for_job') {
      setSelectedJobCat('looking_for_job');
    }
    setServerListings((prev) => {
      const idx = prev.findIndex((item) => item.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleSaveFlag = async (target: Listing, flagged: boolean, flagReason: string) => {
    if (!isAdmin) return;
    setFlagLoading(true);
    try {
      const flaggedBy = userProfile?.email || firebaseUser?.email || 'admin';
      const isFirestoreDoc = firestoreListings.some((f) => f.id === target.id);
      let updatedListing: Listing = {
        ...target,
        flagged,
        flagReason: flagged ? flagReason : '',
        flaggedAt: flagged ? Date.now() : undefined,
        flaggedBy: flagged ? flaggedBy : undefined,
        updatedAt: Date.now(),
        isSeeded: false,
      };

      if (firebaseUser && isFirestoreDoc) {
        try {
          await flagListingDoc(target.id, {
            flagged,
            flagReason,
            flaggedBy,
          });
        } catch {
          // Continue with server persistence fallback
        }
      }

      try {
        updatedListing = await flagServerListing(target.id, {
          flagged,
          flagReason,
          listingSnapshot: target,
        });
      } catch (err) {
        if (!firebaseUser || !isFirestoreDoc) {
          throw err;
        }
      }

      setFirestoreListings((prev) =>
        prev.map((item) => (item.id === target.id ? { ...item, ...updatedListing } : item))
      );
      setServerListings((prev) => {
        const exists = prev.some((item) => item.id === target.id);
        if (exists) {
          return prev.map((item) => (item.id === target.id ? updatedListing : item));
        }
        return [updatedListing, ...prev];
      });
      setDetailListing((prev) => (prev && prev.id === target.id ? updatedListing : prev));
      setPendingFlag(null);
    } finally {
      setFlagLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    const existsOnServer = serverListings.some((s) => s.id === target.id);
    try {
      if (firebaseUser && !target.isSeeded && (target.ownerId === firebaseUser.uid || isAdmin)) {
        try {
          await deleteListingDoc(target.id);
        } catch {
          // Continue with server tombstone if needed
        }
      }
      if (isAdmin || existsOnServer || !firebaseUser) {
        try {
          await deleteServerListingById(target.id);
        } catch {
          // Ignore if already absent on server
        }
      }
      setFirestoreListings((prev) => prev.filter((item) => item.id !== target.id));
      setDeletedIds((prev) => (prev.includes(target.id) ? prev : [...prev, target.id]));
      setServerListings((prev) => prev.filter((item) => item.id !== target.id));
      setDetailListing((prev) => (prev && prev.id === target.id ? null : prev));
    } finally {
      setPendingDelete(null);
    }
  };

  const handleSignOut = async () => {
    await Promise.allSettled([signOutUser(), logoutServerSession()]);
    setUserProfile(null);
    setIsAdmin(false);
    setActiveScope('all');
    await refreshServerListings();
  };

  const scrollToElementWithHeaderOffset = (elId: string) => {
    window.setTimeout(() => {
      const el = document.getElementById(elId);
      if (!el) return;
      const headerEl = document.querySelector('header');
      const headerHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 140;
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 24;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 60);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) {
      setSelectedJobCat('all');
      setActiveScope('all');
    }
  };

  const handleSubmitSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setActiveScope('all');
    setSelectedJobCat('all');
    const matched = allListings.filter((item) => matchesListingSearch(item, q, lang));
    if (matched.some((m) => m.type === 'job')) {
      scrollToElementWithHeaderOffset('recruitment');
    } else if (matched.some((m) => m.type === 'house')) {
      setRentalsSubtab('house');
      scrollToElementWithHeaderOffset('rentals');
    } else if (matched.some((m) => m.type === 'car')) {
      setRentalsSubtab('car');
      scrollToElementWithHeaderOffset('rentals');
    } else if (matched.some((m) => m.type === 'sale')) {
      scrollToElementWithHeaderOffset('sales');
    } else {
      scrollToElementWithHeaderOffset('recruitment');
    }
  };

  const handleSelectSearchResult = (item: Listing) => {
    setActiveScope('all');
    if (item.type === 'job') {
      setSelectedJobCat(item.category === 'looking_for_job' ? 'looking_for_job' : 'all');
    } else if (item.type === 'house') {
      setRentalsSubtab('house');
    } else if (item.type === 'car') {
      setRentalsSubtab('car');
    }
    scrollToElementWithHeaderOffset(`post-${item.id}`);
  };

  return (
    <div className="min-h-screen jobsquad-canvas text-slate-100 flex flex-col">
      <Header
        lang={lang}
        onChangeLang={setLang}
        onOpenContact={() => setContactOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenCreateListing={() => handleOpenPost('job')}
        onSelectRentalsSubmenu={(sub) => setRentalsSubtab(sub)}
        onSelectLookingForJob={() => {
          setActiveScope('all');
          setSelectedJobCat('looking_for_job');
        }}
        onSelectScope={(scope) => setActiveScope(scope)}
        activeScope={activeScope}
        user={userProfile}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
        listings={visibleListings}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSubmitSearch={handleSubmitSearch}
        onSelectSearchResult={handleSelectSearchResult}
      />

      <main className="flex-1">
        <HeroSection
          lang={lang}
          stats={stats}
          onExploreJobs={() => {
            document.getElementById('recruitment')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onPostListing={() => handleOpenPost('job')}
        />

        <AboutSection lang={lang} />

        {isAdmin && activeScope === 'admin' && (
          <AdminUsersPanel
            lang={lang}
            isAdmin={isAdmin}
            firebaseUser={firebaseUser}
            currentUser={userProfile}
            onCurrentUserUpdated={(updated) => setUserProfile(updated)}
            onBackToAll={() => setActiveScope('all')}
          />
        )}

        <ListingsBoard
          lang={lang}
          listings={visibleListings}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          selectedJobCat={selectedJobCat}
          onChangeJobCat={setSelectedJobCat}
          onOpenPostLookingForJob={() => handleOpenPost('looking_for_job')}
          rentalsSubtab={rentalsSubtab}
          onChangeRentalsSubtab={setRentalsSubtab}
          currentUserId={userProfile?.uid || null}
          isAdmin={isAdmin}
          activeScope={activeScope}
          onClearScope={() => setActiveScope('all')}
          onViewDetails={(item) => setDetailListing(item)}
          onEditListing={handleEditListing}
          onFlagListing={(item) => setPendingFlag(item)}
          onDeleteListing={(item) => setPendingDelete(item)}
        />
      </main>

      <Footer
        lang={lang}
        onOpenContact={() => setContactOpen(true)}
        onOpenLegal={(tab) => setLegalTab(tab)}
      />

      <ChatbotWidget lang={lang} stats={stats} listings={visibleListings} />

      <ContactModal
        open={contactOpen}
        lang={lang}
        onClose={() => setContactOpen(false)}
      />

      <AuthModal
        open={authOpen}
        lang={lang}
        firebaseUser={firebaseUser}
        profile={userProfile}
        onProfileSaved={(saved) => {
          setUserProfile(saved);
          setIsAdmin(Boolean(saved.isAdmin));
          void refreshServerListings();
          if (pendingPostMode && saved.phone) {
            const nextMode = pendingPostMode;
            setPendingPostMode(null);
            setEditingListing(null);
            setFormInitialMode(nextMode);
            setFormOpen(true);
          }
        }}
        onAccountDeleted={() => {
          setUserProfile(null);
          setIsAdmin(false);
          setActiveScope('all');
          setPendingPostMode(null);
          setDetailListing(null);
          setAuthOpen(false);
          void refreshServerListings();
          void fetchFirestoreListingsOnce()
            .then((items) => setFirestoreListings(items))
            .catch(() => {});
        }}
        onOpenLegal={(tab) => setLegalTab(tab)}
        onClose={() => {
          setPendingPostMode(null);
          setAuthOpen(false);
        }}
      />

      <LegalModal
        open={legalTab !== null}
        initialTab={legalTab || 'terms'}
        lang={lang}
        onClose={() => setLegalTab(null)}
      />

      <ListingFormModal
        open={formOpen}
        lang={lang}
        user={userProfile}
        editingListing={editingListing}
        initialMode={formInitialMode}
        onSaved={handleListingSaved}
        onClose={() => {
          setFormOpen(false);
          setEditingListing(null);
          setFormInitialMode(null);
        }}
      />

      <ListingDetailModal
        listing={detailListing}
        lang={lang}
        currentUser={userProfile}
        isAdmin={isAdmin}
        onFlagListing={(item) => setPendingFlag(item)}
        onDeleteListing={(item) => {
          setDetailListing(null);
          setPendingDelete(item);
        }}
        onClose={() => setDetailListing(null)}
      />

      <FlagListingModal
        listing={pendingFlag}
        lang={lang}
        loading={flagLoading}
        onConfirmFlag={(item, reason) => handleSaveFlag(item, true, reason)}
        onUnflag={(item) => handleSaveFlag(item, false, '')}
        onDelete={(item) => {
          setPendingFlag(null);
          setPendingDelete(item);
        }}
        onClose={() => setPendingFlag(null)}
      />

      {/* Delete Confirmation Dialog */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="jobsquad-surface max-w-sm w-full rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">{t.deletePost}</h3>
            <p className="text-sm text-slate-300">{t.confirmDelete}</p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 cursor-pointer"
              >
                {t.deletePost}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <JobSquadShell />
    </ErrorBoundary>
  );
}
