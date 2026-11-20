import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { formatPhoneNumber } from '../lib/phone.ts';
import type { Listing } from '../types/index.ts';

export interface StoredUser {
  uid: string;
  googleUid?: string;
  email: string;
  displayName: string;
  phone: string;
  accountType: 'seeker' | 'employer' | 'lister';
  authProvider?: 'local' | 'google';
  isAdmin: boolean;
  acceptedTerms?: boolean;
  acceptedTermsAt?: number;
  passwordSalt: string;
  passwordHash: string;
  createdAt: number;
}

export interface ContactInquiryRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: number;
}

interface StoreData {
  users: StoredUser[];
  listings: Listing[];
  deletedIds: string[];
  inquiries: ContactInquiryRecord[];
}

const ADMIN_EMAILS = new Set(['wangchukjiks@gmail.com']);
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'jobsquad-store.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  if (!salt || !expectedHash) return false;
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function createInitialStore(): StoreData {
  const defaultAdminSalt = crypto.randomBytes(16).toString('hex');
  const defaultAdmin: StoredUser = {
    uid: 'admin_wangchukjiks',
    email: 'wangchukjiks@gmail.com',
    displayName: 'JobSQUAD Administrator',
    phone: '+33 7 59 16 31 33',
    accountType: 'employer',
    authProvider: 'local',
    isAdmin: true,
    acceptedTerms: true,
    acceptedTermsAt: Date.now(),
    passwordSalt: defaultAdminSalt,
    passwordHash: hashPassword('Worldisbig@33', defaultAdminSalt),
    createdAt: Date.now(),
  };

  return {
    users: [defaultAdmin],
    listings: [],
    deletedIds: [],
    inquiries: [],
  };
}

function loadStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const initial = createInitialStore();
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as StoreData;
    if (!Array.isArray(parsed.users)) parsed.users = [];
    if (!Array.isArray(parsed.listings)) parsed.listings = [];
    if (!Array.isArray(parsed.deletedIds)) parsed.deletedIds = [];
    if (!Array.isArray(parsed.inquiries)) parsed.inquiries = [];

    let dirty = false;

    // Ensure default administrator account always exists
    const hasDefaultAdmin = parsed.users.some(
      (u) => u.email.toLowerCase() === 'wangchukjiks@gmail.com'
    );
    if (!hasDefaultAdmin) {
      const init = createInitialStore();
      parsed.users.unshift(init.users[0]);
      dirty = true;
    }

    // Normalize all users: standardized (+CC 0 00 00 00 00) phones, authProvider, and admin Terms acceptance
    for (const u of parsed.users) {
      const isAdminUser = u.isAdmin || ADMIN_EMAILS.has(u.email.toLowerCase());
      if (isAdminUser) {
        if (!u.isAdmin) {
          u.isAdmin = true;
          dirty = true;
        }
        if (u.acceptedTerms !== true) {
          u.acceptedTerms = true;
          u.acceptedTermsAt = u.acceptedTermsAt || u.createdAt || Date.now();
          dirty = true;
        } else if (!u.acceptedTermsAt) {
          u.acceptedTermsAt = u.createdAt || Date.now();
          dirty = true;
        }
      }
      if (!u.authProvider) {
        u.authProvider = u.passwordHash ? 'local' : 'google';
        dirty = true;
      }
      if (u.phone && u.phone.trim()) {
        const formatted = formatPhoneNumber(u.phone);
        if (formatted && formatted !== u.phone) {
          u.phone = formatted;
          dirty = true;
        }
      }
    }

    for (const item of parsed.listings) {
      if (item.contactPhone && item.contactPhone.trim()) {
        const formatted = formatPhoneNumber(item.contactPhone);
        if (formatted && formatted !== item.contactPhone) {
          item.contactPhone = formatted;
          dirty = true;
        }
      }
    }

    if (dirty) {
      saveStore(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load server store:', err);
    return createInitialStore();
  }
}

function saveStore(data: StoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist server store:', err);
  }
}

export function registerAccount(input: {
  email: string;
  password: string;
  displayName: string;
  phone: string;
  accountType: 'seeker' | 'employer' | 'lister';
  acceptedTerms: boolean;
}): StoredUser {
  const store = loadStore();
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const user: StoredUser = {
    uid: `usr_${crypto.randomBytes(10).toString('hex')}`,
    email: normalizedEmail,
    displayName: input.displayName.trim(),
    phone: formatPhoneNumber(input.phone.trim()),
    accountType: input.accountType,
    authProvider: 'local',
    isAdmin: ADMIN_EMAILS.has(normalizedEmail),
    acceptedTerms: Boolean(input.acceptedTerms),
    acceptedTermsAt: now,
    passwordSalt: salt,
    passwordHash: hashPassword(input.password, salt),
    createdAt: now,
  };

  store.users.push(user);
  saveStore(store);
  return user;
}

export function authenticateAccount(email: string, password: string): StoredUser {
  const store = loadStore();
  const normalizedEmail = email.trim().toLowerCase();
  const user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    throw new Error('Invalid email or password.');
  }
  if (!user.passwordSalt || !user.passwordHash) {
    throw new Error('This account uses Google Sign-In. Please click "Continue with Google".');
  }
  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error('Invalid email or password.');
  }
  return user;
}

export type PublicStoredUser = Omit<StoredUser, 'passwordSalt' | 'passwordHash'>;

function toPublicUser(user: StoredUser): PublicStoredUser {
  return {
    uid: user.uid,
    googleUid: user.googleUid,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone ? formatPhoneNumber(user.phone) : '',
    accountType: user.accountType,
    authProvider: user.authProvider || (user.passwordHash ? 'local' : 'google'),
    isAdmin: user.isAdmin,
    acceptedTerms: user.acceptedTerms,
    acceptedTermsAt: user.acceptedTermsAt,
    createdAt: user.createdAt,
  };
}

export function upsertGoogleStoredUser(input: {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  accountType?: 'seeker' | 'employer' | 'lister';
  acceptedTerms?: boolean;
  isAdmin?: boolean;
}): PublicStoredUser {
  const store = loadStore();
  const normalizedEmail = input.email.trim().toLowerCase();
  const now = Date.now();
  const isAdminUser = Boolean(input.isAdmin || ADMIN_EMAILS.has(normalizedEmail));

  const idx = store.users.findIndex(
    (u) =>
      u.uid === input.uid ||
      u.googleUid === input.uid ||
      u.email.toLowerCase() === normalizedEmail
  );

  const cleanName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
  const formattedPhone =
    typeof input.phone === 'string' && input.phone.trim()
      ? formatPhoneNumber(input.phone.trim())
      : '';
  const safeType =
    input.accountType === 'seeker' ||
    input.accountType === 'employer' ||
    input.accountType === 'lister'
      ? input.accountType
      : undefined;

  if (idx >= 0) {
    const existing = store.users[idx];
    const nextAcceptedTerms = Boolean(
      existing.acceptedTerms || input.acceptedTerms || isAdminUser
    );
    const updated: StoredUser = {
      ...existing,
      googleUid: input.uid,
      displayName: cleanName || existing.displayName || normalizedEmail.split('@')[0],
      phone: formattedPhone || existing.phone,
      accountType: safeType || existing.accountType,
      authProvider: existing.passwordHash ? existing.authProvider || 'local' : 'google',
      isAdmin: Boolean(existing.isAdmin || isAdminUser),
      acceptedTerms: nextAcceptedTerms,
      acceptedTermsAt: nextAcceptedTerms
        ? existing.acceptedTermsAt || now
        : existing.acceptedTermsAt,
    };
    store.users[idx] = updated;
    saveStore(store);
    return toPublicUser(updated);
  }

  const created: StoredUser = {
    uid: input.uid,
    googleUid: input.uid,
    email: normalizedEmail,
    displayName: cleanName || normalizedEmail.split('@')[0],
    phone: formattedPhone,
    accountType: safeType || 'employer',
    authProvider: 'google',
    isAdmin: isAdminUser,
    acceptedTerms: Boolean(input.acceptedTerms || isAdminUser),
    acceptedTermsAt: input.acceptedTerms || isAdminUser ? now : undefined,
    passwordSalt: '',
    passwordHash: '',
    createdAt: now,
  };

  store.users.push(created);
  saveStore(store);
  return toPublicUser(created);
}

export function getAllStoredUsers(): PublicStoredUser[] {
  const store = loadStore();
  return store.users.map(toPublicUser);
}

export function updateStoredUser(
  uid: string,
  updates: {
    displayName: string;
    email: string;
    phone: string;
    accountType: 'seeker' | 'employer' | 'lister';
    newPassword?: string;
  }
): PublicStoredUser {
  const store = loadStore();
  const idx = store.users.findIndex((u) => u.uid === uid || u.googleUid === uid);
  if (idx < 0) {
    throw new Error('User account not found.');
  }

  const normalizedEmail = updates.email.trim().toLowerCase();
  const duplicate = store.users.find(
    (u, index) => index !== idx && u.email.toLowerCase() === normalizedEmail
  );
  if (duplicate) {
    throw new Error('Another account already uses this email address.');
  }

  const existing = store.users[idx];
  const nextSalt =
    updates.newPassword && updates.newPassword.length >= 8
      ? crypto.randomBytes(16).toString('hex')
      : existing.passwordSalt;
  const nextHash =
    updates.newPassword && updates.newPassword.length >= 8
      ? hashPassword(updates.newPassword, nextSalt)
      : existing.passwordHash;

  const formattedPhone = updates.phone.trim()
    ? formatPhoneNumber(updates.phone.trim())
    : '';

  const updated: StoredUser = {
    ...existing,
    displayName: updates.displayName.trim(),
    email: normalizedEmail,
    phone: formattedPhone,
    accountType: updates.accountType,
    isAdmin: existing.isAdmin || ADMIN_EMAILS.has(normalizedEmail),
    passwordSalt: nextSalt,
    passwordHash: nextHash,
  };
  store.users[idx] = updated;
  saveStore(store);
  return toPublicUser(updated);
}

export function deleteStoredUser(uid: string): void {
  const store = loadStore();
  const target = store.users.find((u) => u.uid === uid || u.googleUid === uid);
  if (!target) {
    throw new Error('User account not found.');
  }
  if (ADMIN_EMAILS.has(target.email.toLowerCase())) {
    throw new Error('Primary administrator account cannot be deleted.');
  }
  const targetIds = new Set([target.uid, target.googleUid].filter(Boolean));
  store.users = store.users.filter((u) => !targetIds.has(u.uid));
  store.listings = store.listings.filter((item) => !targetIds.has(item.ownerId));
  saveStore(store);
}

export function getStoredUserByUid(uid: string): PublicStoredUser | null {
  const store = loadStore();
  const user = store.users.find((u) => u.uid === uid || u.googleUid === uid);
  return user ? toPublicUser(user) : null;
}

export function updateOwnStoredUser(
  uid: string,
  updates: {
    displayName: string;
    phone: string;
    accountType: 'seeker' | 'employer' | 'lister';
  },
  fallbackIdentity?: { email?: string; isAdmin?: boolean }
): PublicStoredUser {
  const store = loadStore();
  let idx = store.users.findIndex((u) => u.uid === uid || u.googleUid === uid);
  if (idx < 0 && fallbackIdentity?.email) {
    const emailLower = fallbackIdentity.email.trim().toLowerCase();
    idx = store.users.findIndex((u) => u.email.toLowerCase() === emailLower);
  }
  if (idx < 0) {
    if (!fallbackIdentity?.email) {
      throw new Error('User account not found.');
    }
    return upsertGoogleStoredUser({
      uid,
      email: fallbackIdentity.email,
      displayName: updates.displayName,
      phone: updates.phone,
      accountType: updates.accountType,
      acceptedTerms: true,
      isAdmin: fallbackIdentity.isAdmin,
    });
  }
  const existing = store.users[idx];
  const updated: StoredUser = {
    ...existing,
    displayName: updates.displayName.trim(),
    phone: formatPhoneNumber(updates.phone.trim()),
    accountType: updates.accountType,
  };
  store.users[idx] = updated;
  saveStore(store);
  return toPublicUser(updated);
}

export function deleteOwnStoredUser(uid: string, email: string): void {
  if (ADMIN_EMAILS.has(email.trim().toLowerCase())) {
    throw new Error('Primary administrator account cannot be deleted.');
  }
  const store = loadStore();
  const emailLower = email.trim().toLowerCase();
  const matched = store.users.find(
    (u) => u.uid === uid || u.googleUid === uid || u.email.toLowerCase() === emailLower
  );
  const removeIds = new Set(
    [uid, matched?.uid, matched?.googleUid].filter((v): v is string => Boolean(v))
  );
  store.users = store.users.filter(
    (u) => !removeIds.has(u.uid) && u.email.toLowerCase() !== emailLower
  );
  store.listings = store.listings.filter((item) => !removeIds.has(item.ownerId));
  saveStore(store);
}

export function getAllServerListings(): { listings: Listing[]; deletedIds: string[] } {
  const store = loadStore();
  return {
    listings: store.listings,
    deletedIds: store.deletedIds,
  };
}

export function upsertServerListing(listing: Listing): Listing {
  const store = loadStore();
  const idx = store.listings.findIndex((item) => item.id === listing.id);
  const next: Listing = {
    ...listing,
    contactPhone: listing.contactPhone ? formatPhoneNumber(listing.contactPhone) : '',
    isSeeded: false,
    updatedAt: Date.now(),
  };
  if (idx >= 0) {
    store.listings[idx] = next;
  } else {
    store.listings.unshift(next);
  }
  store.deletedIds = store.deletedIds.filter((id) => id !== listing.id);
  saveStore(store);
  return next;
}

export function getServerListingById(id: string): Listing | undefined {
  const store = loadStore();
  return store.listings.find((item) => item.id === id);
}

export function deleteServerListing(id: string): void {
  const store = loadStore();
  store.listings = store.listings.filter((item) => item.id !== id);
  if (!store.deletedIds.includes(id)) {
    store.deletedIds.push(id);
  }
  saveStore(store);
}

export function saveContactInquiry(input: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): ContactInquiryRecord {
  const store = loadStore();
  const record: ContactInquiryRecord = {
    id: `inq_${crypto.randomBytes(8).toString('hex')}`,
    name: input.name,
    email: input.email,
    phone: input.phone ? formatPhoneNumber(input.phone) : '',
    subject: input.subject,
    message: input.message,
    createdAt: Date.now(),
  };
  store.inquiries.unshift(record);
  if (store.inquiries.length > 200) {
    store.inquiries = store.inquiries.slice(0, 200);
  }
  saveStore(store);
  return record;
}
