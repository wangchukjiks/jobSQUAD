import { initializeApp } from 'firebase/app';
import {
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
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
  getFirestore,
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
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
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
          displayName: String(data.displayName || 'JobSQUAD Administrator'),
          phone: String(data.phone || '+33 7 59 16 31 33'),
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
  try {
    const ref = doc(db, 'users', profile.uid);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      const existingData = existing.data();
      const updates: Record<string, unknown> = {
        displayName: profile.displayName,
        phone: profile.phone,
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
        displayName: profile.displayName,
        email: profile.email,
        phone: profile.phone,
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
      const snap = await getDocs(q);
      return snap.docs.map(mapListingDoc);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
}

export function subscribeListings(
  onData: (listings: Listing[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'listings';
  const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));

  void fetchFirestoreListingsOnce()
    .then((items) => {
      if (items.length > 0) onData(items);
    })
    .catch(() => {});

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map(mapListingDoc));
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

export async function createListingDoc(
  listingId: string,
  payload: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'isSeeded'>
): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await setDoc(doc(db, 'listings', listingId), {
      ownerId: payload.ownerId,
      ownerName: payload.ownerName,
      type: payload.type,
      category: payload.category,
      title: payload.title,
      description: payload.description,
      location: payload.location,
      priceEur: Number(payload.priceEur),
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      images: payload.images,
      specs: payload.specs,
      translations: payload.translations,
      status: payload.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
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
  try {
    await updateDoc(doc(db, 'listings', listingId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function flagListingDoc(
  listingId: string,
  payload: { flagged: boolean; flagReason: string; flaggedBy: string }
): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await updateDoc(doc(db, 'listings', listingId), {
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
