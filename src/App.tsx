import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AuthModal } from './components/AuthModal.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { ChatbotWidget } from './components/ChatbotWidget.tsx';
import { ContactModal } from './components/ContactModal.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Footer } from './components/Footer.tsx';
import { Header } from './components/Header.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { ListingDetailModal } from './components/ListingDetailModal.tsx';
import { ListingFormModal } from './components/ListingFormModal.tsx';
import { ListingsBoard } from './components/ListingsBoard.tsx';
import { SEED_LISTINGS } from './data/seedListings.ts';
import { UI_TEXT } from './i18n/translations.ts';
import {
  deleteServerListingById,
  ensureCsrfToken,
  fetchCurrentAuthUser,
  fetchServerListings,
  logoutServerSession,
  syncFirebaseSession,
} from './lib/api.ts';
import {
  auth,
  checkIsAdmin,
  deleteListingDoc,
  fetchFirestoreListingsOnce,
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
  const [activeScope, setActiveScope] = useState<'all' | 'mine' | 'admin'>('all');

  const [contactOpen, setContactOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Listing | null>(null);

  const t = UI_TEXT[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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

      try {
        const idToken = await fbUser.getIdToken();
        await syncFirebaseSession(idToken);
      } catch {
        // Continue with client-side Firebase session
      }

      const adminFlag = await checkIsAdmin(fbUser);
      setIsAdmin(adminFlag);

      try {
        const existingProfile = await getUserProfile(fbUser.uid);
        if (existingProfile) {
          setUserProfile({ ...existingProfile, isAdmin: adminFlag });
        } else {
          setUserProfile({
            uid: fbUser.uid,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Member',
            email: fbUser.email || '',
            phone: '',
            accountType: 'employer',
            isAdmin: adminFlag,
          });
          setAuthOpen(true);
        }
      } catch {
        setUserProfile({
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Member',
          email: fbUser.email || '',
          phone: '',
          accountType: 'employer',
          isAdmin: adminFlag,
        });
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

  const visibleListings = useMemo(() => {
    if (userProfile && !isAdmin) {
      return allListings.filter((item) => item.ownerId === userProfile.uid);
    }
    return allListings;
  }, [allListings, userProfile, isAdmin]);

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

  const handleOpenPost = () => {
    if (!userProfile || !userProfile.phone) {
      setAuthOpen(true);
      return;
    }
    setEditingListing(null);
    setFormOpen(true);
  };

  const handleEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setFormOpen(true);
  };

  const handleListingSaved = (saved: Listing) => {
    setDeletedIds((prev) => prev.filter((id) => id !== saved.id));
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

  return (
    <div className="min-h-screen jobsquad-canvas text-slate-100 flex flex-col">
      <Header
        lang={lang}
        onChangeLang={setLang}
        onOpenContact={() => setContactOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenCreateListing={handleOpenPost}
        onSelectRentalsSubmenu={(sub) => setRentalsSubtab(sub)}
        onSelectScope={(scope) => setActiveScope(scope)}
        activeScope={activeScope}
        user={userProfile}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
      />

      <main className="flex-1">
        <HeroSection
          lang={lang}
          stats={stats}
          onExploreJobs={() => {
            document.getElementById('recruitment')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onPostListing={handleOpenPost}
        />

        <AboutSection lang={lang} />

        <ListingsBoard
          lang={lang}
          listings={visibleListings}
          rentalsSubtab={rentalsSubtab}
          onChangeRentalsSubtab={setRentalsSubtab}
          currentUserId={userProfile?.uid || null}
          isAdmin={isAdmin}
          activeScope={activeScope}
          onClearScope={() => setActiveScope('all')}
          onViewDetails={(item) => setDetailListing(item)}
          onEditListing={handleEditListing}
          onDeleteListing={(item) => setPendingDelete(item)}
        />
      </main>

      <Footer lang={lang} onOpenContact={() => setContactOpen(true)} />

      <ChatbotWidget lang={lang} stats={stats} />

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
        }}
        onClose={() => setAuthOpen(false)}
      />

      <ListingFormModal
        open={formOpen}
        lang={lang}
        user={userProfile}
        editingListing={editingListing}
        onSaved={handleListingSaved}
        onClose={() => {
          setFormOpen(false);
          setEditingListing(null);
        }}
      />

      <ListingDetailModal
        listing={detailListing}
        lang={lang}
        currentUser={userProfile}
        onClose={() => setDetailListing(null)}
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
                Cancel
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
