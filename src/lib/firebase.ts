import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
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
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Listing, UserProfile } from '../types/index.ts';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: String(data.uid),
      displayName: String(data.displayName),
      email: String(data.email),
      phone: String(data.phone),
      accountType: data.accountType,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(profile: Omit<UserProfile, 'isAdmin'>): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const ref = doc(db, 'users', profile.uid);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, {
        displayName: profile.displayName,
        phone: profile.phone,
        accountType: profile.accountType,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        uid: profile.uid,
        displayName: profile.displayName,
        email: profile.email,
        phone: profile.phone,
        accountType: profile.accountType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
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

export async function deleteListingDoc(listingId: string): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await deleteDoc(doc(db, 'listings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
