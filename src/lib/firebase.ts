import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  initializeFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Listing, UserProfile } from '../types/index.ts';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  { experimentalAutoDetectLongPolling: true },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const BOOTSTRAPPED_ADMIN_EMAILS = new Set([
  'wangchukjiks@gmail.com',
]);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function isFirebaseProviderDisabledError(err: unknown): boolean {
  const code = (err as { code?: string })?.code || '';
  const msg = err instanceof Error ? err.message : String(err || '');
  return (
    code === 'auth/operation-not-allowed' ||
    msg.includes('operation-not-allowed') ||
    msg.includes('PASSWORD_LOGIN_DISABLED') ||
    msg.includes('ADMIN_ONLY_OPERATION')
  );
}

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithGoogleRedirectFallback(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

export async function resolveGoogleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch {
    return null;
  }
}

export async function registerWithFirebaseEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim().slice(0, 120) }).catch(() => {});
  }
  await sendEmailVerification(cred.user).catch(() => {});
  return cred.user;
}

export async function signInWithFirebaseEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function resendFirebaseVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('No active account session found.');
  }
  await sendEmailVerification(auth.currentUser);
}

export async function refreshFirebaseCurrentUser(): Promise<User | null> {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  await auth.currentUser.getIdToken(true);
  return auth.currentUser;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email && BOOTSTRAPPED_ADMIN_EMAILS.has(user.email.toLowerCase())) return true;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    const email = String(data.email || '');
    const isBootstrappedAdmin = BOOTSTRAPPED_ADMIN_EMAILS.has(email.toLowerCase());
    let acceptedTerms = Boolean(data.acceptedTerms);

    if (isBootstrappedAdmin && !acceptedTerms && auth.currentUser?.uid === uid && auth.currentUser?.emailVerified) {
      try {
        await updateDoc(ref, {
          displayName: String(data.displayName || 'JobSQUAD Administrator').slice(0, 120),
          phone: String(data.phone || '+33 7 59 16 31 33').slice(0, 40),
          accountType: data.accountType || 'employer',
          acceptedTerms: true,
          acceptedTermsAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        acceptedTerms = true;
      } catch {
        acceptedTerms = true;
      }
    }

    return {
      uid: String(data.uid),
      displayName: String(data.displayName),
      email,
      phone: String(data.phone),
      accountType: data.accountType,
      acceptedTerms: isBootstrappedAdmin ? true : acceptedTerms,
      acceptedTermsAt: data.acceptedTermsAt?.toMillis ? data.acceptedTermsAt.toMillis() : undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(profile: Omit<UserProfile, 'isAdmin'>): Promise<void> {
  const path = `users/${profile.uid}`;
  const isBootstrappedAdmin = BOOTSTRAPPED_ADMIN_EMAILS.has(profile.email.toLowerCase());
  const effectiveAcceptedTerms = Boolean(profile.acceptedTerms || isBootstrappedAdmin);
  const cleanName = (profile.displayName || 'Member').trim().slice(0, 120);
  const safeName = cleanName.length >= 2 ? cleanName : 'Member';
  const cleanEmail = profile.email.trim().toLowerCase().slice(0, 160);
  const cleanPhone = profile.phone.trim().slice(0, 40);
  try {
    const ref = doc(db, 'users', profile.uid);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      const existingData = existing.data();
      const updates: Record<string, unknown> = {
        displayName: safeName,
        phone: cleanPhone,
        accountType: profile.accountType,
        updatedAt: serverTimestamp(),
      };
      if (!('acceptedTerms' in existingData)) {
        if (!effectiveAcceptedTerms) {
          throw new Error('You must accept the Terms of Service and Privacy Policy.');
        }
        updates.acceptedTerms = true;
        updates.acceptedTermsAt = serverTimestamp();
      }
      await updateDoc(ref, updates);
    } else {
      if (!effectiveAcceptedTerms) {
        throw new Error('You must accept the Terms of Service and Privacy Policy.');
      }
      await setDoc(ref, {
        uid: profile.uid,
        displayName: safeName,
        email: cleanEmail,
        phone: cleanPhone,
        accountType: profile.accountType,
        acceptedTerms: true,
        acceptedTermsAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteOwnFirebaseAccount(uid: string): Promise<void> {
  const current = auth.currentUser;
  if (!current || current.uid !== uid) {
    throw new Error('You must be signed in to delete your account.');
  }
  if (current.email && BOOTSTRAPPED_ADMIN_EMAILS.has(current.email.toLowerCase())) {
    throw new Error('Primary administrator account cannot be deleted.');
  }

  // Delete user's Firestore listings first while authenticated
  try {
    const q = query(collection(db, 'listings'), where('ownerId', '==', uid));
    const snap = await getDocs(q);
    await Promise.allSettled(snap.docs.map((d) => deleteDoc(d.ref)));
  } catch {
    // Continue with profile & auth deletion
  }

  // Delete Firestore user profile
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch {
    // Ignore if profile doc wasn't created yet
  }

  // Delete Firebase Auth account (reauthenticating via Google popup if required)
  try {
    await deleteUser(current);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/requires-recent-login') {
      await reauthenticateWithPopup(current, googleProvider);
      await deleteUser(current);
    } else {
      throw err;
    }
  }
}

export async function listAllUserProfiles(): Promise<
  (UserProfile & { createdAt?: number; updatedAt?: number })[]
> {
  const path = 'users';
  try {
    let snap;
    try {
      snap = await getDocsFromServer(collection(db, path));
    } catch {
      snap = await getDocs(collection(db, path));
    }
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      const email = String(data.email || '');
      const isAdminEmail = BOOTSTRAPPED_ADMIN_EMAILS.has(email.toLowerCase());
      return {
        uid: String(data.uid || docSnap.id),
        displayName: String(data.displayName || ''),
        email,
        phone: String(data.phone || ''),
        accountType: data.accountType,
        acceptedTerms: isAdminEmail ? true : Boolean(data.acceptedTerms),
        acceptedTermsAt: data.acceptedTermsAt?.toMillis ? data.acceptedTermsAt.toMillis() : undefined,
        isAdmin: isAdminEmail,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : undefined,
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : undefined,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminUpdateUserProfile(
  uid: string,
  updates: {
    displayName: string;
    email: string;
    phone: string;
    accountType: UserProfile['accountType'];
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      throw new Error('User profile not found in Firestore.');
    }
    const existingData = existing.data();
    const payload: Record<string, unknown> = {
      displayName: updates.displayName.trim(),
      email: updates.email.trim().toLowerCase(),
      phone: updates.phone.trim(),
      accountType: updates.accountType,
      updatedAt: serverTimestamp(),
    };
    if (!('acceptedTerms' in existingData)) {
      payload.acceptedTerms = true;
      payload.acceptedTermsAt = serverTimestamp();
    }
    await updateDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminDeleteUserProfile(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

interface FirestoreRestValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  arrayValue?: { values?: FirestoreRestValue[] };
  mapValue?: { fields?: Record<string, FirestoreRestValue> };
}

function decodeFirestoreRestValue(val: FirestoreRestValue | undefined): unknown {
  if (!val) return undefined;
  if ('stringValue' in val && val.stringValue !== undefined) return val.stringValue;
  if ('integerValue' in val && val.integerValue !== undefined) return Number(val.integerValue);
  if ('doubleValue' in val && val.doubleValue !== undefined) return Number(val.doubleValue);
  if ('booleanValue' in val && val.booleanValue !== undefined) return Boolean(val.booleanValue);
  if ('timestampValue' in val && val.timestampValue !== undefined) {
    const ms = Date.parse(val.timestampValue);
    return Number.isFinite(ms) ? ms : Date.now();
  }
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map((v) => decodeFirestoreRestValue(v));
  }
  if ('mapValue' in val) {
    const out: Record<string, unknown> = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = decodeFirestoreRestValue(v);
    }
    return out;
  }
  return undefined;
}

function decodeListingFromRestDocument(docObj: { name?: string; fields?: Record<string, FirestoreRestValue> }): Listing | null {
  if (!docObj?.name || !docObj.fields) return null;
  const id = docObj.name.split('/').pop() || '';
  if (!id) return null;
  const d: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(docObj.fields)) {
    d[k] = decodeFirestoreRestValue(v);
  }
  return {
    id,
    ownerId: String(d.ownerId || ''),
    ownerName: String(d.ownerName || ''),
    type: d.type as Listing['type'],
    category: String(d.category || ''),
    title: String(d.title || ''),
    description: String(d.description || ''),
    location: String(d.location || ''),
    priceEur: Number(d.priceEur || 0),
    contactEmail: String(d.contactEmail || ''),
    contactPhone: String(d.contactPhone || ''),
    images: Array.isArray(d.images) ? (d.images as string[]) : [],
    specs: (d.specs && typeof d.specs === 'object' ? d.specs : {}) as Listing['specs'],
    translations: (d.translations && typeof d.translations === 'object'
      ? d.translations
      : {}) as Listing['translations'],
    status: d.status === 'closed' ? 'closed' : 'active',
    flagged: Boolean(d.flagged),
    flagReason: typeof d.flagReason === 'string' ? d.flagReason : '',
    flaggedAt: typeof d.flaggedAt === 'number' ? d.flaggedAt : undefined,
    flaggedBy: typeof d.flaggedBy === 'string' ? d.flaggedBy : '',
    createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
    updatedAt: typeof d.updatedAt === 'number' ? d.updatedAt : Date.now(),
    isSeeded: false,
    firestoreSynced: true,
  };
}

async function runFirestoreRestQuery(structuredQuery: Record<string, unknown>) {
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents:runQuery?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ structuredQuery }),
  });
  if (!res.ok) {
    throw new Error(`Firestore REST query failed (${res.status})`);
  }
  return (await res.json()) as Array<{
    document?: { name?: string; fields?: Record<string, FirestoreRestValue> };
  }>;
}

async function fetchListingsViaRest(): Promise<Listing[]> {
  const rows = await runFirestoreRestQuery({
    from: [{ collectionId: 'listings' }],
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
  });
  const items: Listing[] = [];
  for (const row of rows) {
    if (row.document) {
      const parsed = decodeListingFromRestDocument(row.document);
      if (parsed) items.push(parsed);
    }
  }
  return items;
}

async function fetchDeletedSeedsViaRest(): Promise<string[]> {
  const rows = await runFirestoreRestQuery({
    from: [{ collectionId: 'deletedSeeds' }],
  });
  const ids: string[] = [];
  for (const row of rows) {
    const name = row.document?.name;
    const id = name ? name.split('/').pop() : '';
    if (id) ids.push(id);
  }
  return ids;
}

function mapListingDoc(docSnap: QueryDocumentSnapshot): Listing {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    ownerId: String(d.ownerId || ''),
    ownerName: String(d.ownerName || ''),
    type: d.type,
    category: String(d.category || ''),
    title: String(d.title || ''),
    description: String(d.description || ''),
    location: String(d.location || ''),
    priceEur: Number(d.priceEur || 0),
    contactEmail: String(d.contactEmail || ''),
    contactPhone: String(d.contactPhone || ''),
    images: Array.isArray(d.images) ? d.images : [],
    specs: d.specs || {},
    translations: d.translations || {},
    status: d.status === 'closed' ? 'closed' : 'active',
    flagged: Boolean(d.flagged),
    flagReason: typeof d.flagReason === 'string' ? d.flagReason : '',
    flaggedAt: d.flaggedAt?.toMillis ? d.flaggedAt.toMillis() : undefined,
    flaggedBy: typeof d.flaggedBy === 'string' ? d.flaggedBy : '',
    createdAt: d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now(),
    updatedAt: d.updatedAt?.toMillis ? d.updatedAt.toMillis() : Date.now(),
    isSeeded: false,
    firestoreSynced: true,
  };
}

export async function fetchFirestoreListingsOnce(): Promise<Listing[]> {
  const path = 'listings';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  try {
    const snap = await getDocsFromServer(q);
    return snap.docs.map(mapListingDoc);
  } catch {
    try {
      return await fetchListingsViaRest();
    } catch {
      try {
        const snap = await getDocs(q);
        return snap.docs.map(mapListingDoc);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
  }
}

export function subscribeListings(
  onData: (listings: Listing[]) => void,
  onError?: (err: Error) => void,
  onReady?: () => void
): Unsubscribe {
  const path = 'listings';
  const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));

  void fetchFirestoreListingsOnce()
    .then((items) => {
      onData(items);
      if (onReady) onReady();
    })
    .catch(() => {});

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map(mapListingDoc));
      if (onReady) onReady();
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
  );
}

export async function fetchDeletedSeedsOnce(): Promise<string[]> {
  const path = 'deletedSeeds';
  try {
    try {
      const snap = await getDocsFromServer(collection(db, path));
      return snap.docs.map((d) => d.id);
    } catch {
      try {
        return await fetchDeletedSeedsViaRest();
      } catch {
        const snap = await getDocs(collection(db, path));
        return snap.docs.map((d) => d.id);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeDeletedSeeds(
  onData: (seedIds: string[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'deletedSeeds';
  void fetchDeletedSeedsOnce()
    .then((ids) => onData(ids))
    .catch(() => {});

  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.id));
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
  );
}

export async function markSeedDeletedDoc(seedId: string): Promise<void> {
  const path = `deletedSeeds/${seedId}`;
  const current = auth.currentUser;
  if (!current) {
    throw new Error('Administrator Google authentication required to sync deletion.');
  }
  try {
    await setDoc(doc(db, 'deletedSeeds', seedId), {
      id: seedId,
      deletedBy: current.uid,
      deletedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function unmarkSeedDeletedDoc(seedId: string): Promise<void> {
  const path = `deletedSeeds/${seedId}`;
  try {
    await deleteDoc(doc(db, 'deletedSeeds', seedId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function clampString(value: unknown, fallback: string, minLen: number, maxLen: number): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  const base = raw.length >= minLen ? raw : fallback;
  return base.slice(0, maxLen);
}

function buildSanitizedFirestorePayload(listing: Listing, fallbackOwnerId: string) {
  const safeType =
    listing.type === 'house' || listing.type === 'car' || listing.type === 'sale'
      ? listing.type
      : 'job';
  const safeImages =
    safeType === 'job'
      ? []
      : (Array.isArray(listing.images) ? listing.images : [])
          .filter((img): img is string => typeof img === 'string' && img.length > 0 && img.length <= 450000)
          .slice(0, 3);
  const rawPhone = typeof listing.contactPhone === 'string' ? listing.contactPhone.trim() : '';
  const safePhone =
    safeType === 'job'
      ? rawPhone.slice(0, 40)
      : rawPhone.length >= 6
        ? rawPhone.slice(0, 40)
        : '+33 1 00 00 00 00';

  const ownerName = clampString(listing.ownerName, 'JobSQUAD Member', 2, 120);
  const title = clampString(listing.title, 'JobSQUAD Listing', 2, 160);
  let description = clampString(listing.description, 'JobSQUAD community marketplace listing.', 10, 3000);
  if (description.length < 10) {
    description = `${description} — JobSQUAD`.slice(0, 3000);
  }
  const location = clampString(listing.location, 'Europe', 2, 160);
  const contactEmail = clampString(listing.contactEmail, 'contact@jobsquad.local', 5, 160);
  const category = clampString(listing.category, 'babysitting', 1, 80);

  return {
    ownerId: fallbackOwnerId,
    ownerName,
    type: safeType,
    category,
    title,
    description,
    location,
    priceEur: safeType === 'job' ? 0 : Math.max(0, Math.min(100000000, Number(listing.priceEur) || 0)),
    contactEmail,
    contactPhone: safePhone,
    images: safeImages,
    specs: listing.specs && typeof listing.specs === 'object' ? listing.specs : {},
    translations: listing.translations && typeof listing.translations === 'object' ? listing.translations : {},
    status: listing.status === 'closed' ? ('closed' as const) : ('active' as const),
  };
}

export async function adminUpsertListingDoc(
  listingId: string,
  listing: Listing,
  moderation?: { flagged?: boolean; flagReason?: string; flaggedBy?: string }
): Promise<void> {
  const path = `listings/${listingId}`;
  const current = auth.currentUser;
  if (!current) {
    throw new Error('Administrator Google authentication required.');
  }
  try {
    const ref = doc(db, 'listings', listingId);
    const snap = await getDoc(ref);
    const base = buildSanitizedFirestorePayload(listing, current.uid);

    const hasModeration = moderation && typeof moderation.flagged === 'boolean';
    const isFlagged = hasModeration ? Boolean(moderation.flagged) : Boolean(listing.flagged);
    const reason = hasModeration
      ? isFlagged
        ? String(moderation.flagReason || '').trim().slice(0, 500)
        : ''
      : typeof listing.flagReason === 'string'
        ? listing.flagReason.trim().slice(0, 500)
        : '';
    const flaggedBy = hasModeration
      ? isFlagged
        ? String(moderation.flaggedBy || current.email || 'admin').trim().slice(0, 160)
        : ''
      : typeof listing.flaggedBy === 'string'
        ? listing.flaggedBy.trim().slice(0, 160)
        : '';

    if (snap.exists()) {
      const updatePayload: Record<string, unknown> = {
        ownerName: base.ownerName,
        category: base.category,
        title: base.title,
        description: base.description,
        location: base.location,
        priceEur: base.priceEur,
        contactEmail: base.contactEmail,
        contactPhone: base.contactPhone,
        images: base.images,
        specs: base.specs,
        translations: base.translations,
        status: base.status,
        flagged: isFlagged,
        flagReason: isFlagged ? reason : '',
        flaggedAt: isFlagged ? serverTimestamp() : null,
        flaggedBy: isFlagged ? flaggedBy : '',
        updatedAt: serverTimestamp(),
      };
      await updateDoc(ref, updatePayload);
    } else {
      const createPayload: Record<string, unknown> = {
        ...base,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (isFlagged) {
        createPayload.flagged = true;
        createPayload.flagReason = reason;
        createPayload.flaggedAt = serverTimestamp();
        createPayload.flaggedBy = flaggedBy;
      }
      await setDoc(ref, createPayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createListingDoc(
  listingId: string,
  payload: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'isSeeded'>
): Promise<void> {
  const path = `listings/${listingId}`;
  const current = auth.currentUser;
  if (!current) {
    throw new Error('Authentication required to sync listing across devices.');
  }
  if (!current.emailVerified) {
    throw new Error('Please verify your email address before publishing so your post syncs across all devices.');
  }
  try {
    const sanitized = buildSanitizedFirestorePayload(
      { ...payload, id: listingId, createdAt: Date.now(), updatedAt: Date.now() } as Listing,
      current.uid
    );
    await setDoc(doc(db, 'listings', listingId), {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function userUpsertOwnListingDoc(listingId: string, listing: Listing): Promise<void> {
  const path = `listings/${listingId}`;
  const current = auth.currentUser;
  if (!current || !current.emailVerified) {
    throw new Error('Verified account required to sync listing.');
  }
  try {
    const ref = doc(db, 'listings', listingId);
    const snap = await getDoc(ref);
    const sanitized = buildSanitizedFirestorePayload(listing, current.uid);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateListingDoc(
  listingId: string,
  updates: Partial<
    Pick<
      Listing,
      | 'ownerName'
      | 'category'
      | 'title'
      | 'description'
      | 'location'
      | 'priceEur'
      | 'contactEmail'
      | 'contactPhone'
      | 'images'
      | 'specs'
      | 'translations'
      | 'status'
    >
  >
): Promise<void> {
  const path = `listings/${listingId}`;
  const current = auth.currentUser;
  if (!current) {
    throw new Error('Authentication required to update listing.');
  }
  if (!current.emailVerified) {
    throw new Error('Please verify your email address before updating listings.');
  }
  try {
    const cleanUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.category !== undefined) {
      cleanUpdates.category = clampString(updates.category, 'babysitting', 1, 80);
    }
    if (updates.title !== undefined) {
      cleanUpdates.title = clampString(updates.title, 'JobSQUAD Listing', 2, 160);
    }
    if (updates.description !== undefined) {
      cleanUpdates.description = clampString(
        updates.description,
        'JobSQUAD community marketplace listing.',
        10,
        3000
      );
    }
    if (updates.location !== undefined) {
      cleanUpdates.location = clampString(updates.location, 'Europe', 2, 160);
    }
    if (updates.priceEur !== undefined) {
      cleanUpdates.priceEur = Math.max(0, Math.min(100000000, Number(updates.priceEur) || 0));
    }
    if (updates.contactEmail !== undefined) {
      cleanUpdates.contactEmail = clampString(updates.contactEmail, 'contact@jobsquad.local', 5, 160);
    }
    if (updates.contactPhone !== undefined) {
      cleanUpdates.contactPhone = String(updates.contactPhone || '').trim().slice(0, 40);
    }
    if (updates.images !== undefined) {
      cleanUpdates.images = (Array.isArray(updates.images) ? updates.images : [])
        .filter((img): img is string => typeof img === 'string' && img.length > 0 && img.length <= 450000)
        .slice(0, 3);
    }
    if (updates.specs !== undefined && updates.specs && typeof updates.specs === 'object') {
      cleanUpdates.specs = updates.specs;
    }
    if (
      updates.translations !== undefined &&
      updates.translations &&
      typeof updates.translations === 'object'
    ) {
      cleanUpdates.translations = updates.translations;
    }
    if (updates.status !== undefined) {
      cleanUpdates.status = updates.status === 'closed' ? 'closed' : 'active';
    }
    if (updates.ownerName !== undefined) {
      cleanUpdates.ownerName = clampString(updates.ownerName, 'JobSQUAD Member', 2, 120);
    }
    await updateDoc(doc(db, 'listings', listingId), cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function flagListingDoc(
  listingId: string,
  payload: { flagged: boolean; flagReason: string; flaggedBy: string },
  fallbackListing?: Listing
): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    const ref = doc(db, 'listings', listingId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      if (fallbackListing) {
        await adminUpsertListingDoc(listingId, fallbackListing, payload);
        return;
      }
      throw new Error('Listing document does not exist in Firestore.');
    }
    await updateDoc(ref, {
      flagged: payload.flagged,
      flagReason: payload.flagged ? payload.flagReason.trim().slice(0, 500) : '',
      flaggedAt: payload.flagged ? serverTimestamp() : null,
      flaggedBy: payload.flagged ? payload.flaggedBy.trim().slice(0, 160) : '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteListingDoc(listingId: string): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await deleteDoc(doc(db, 'listings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
