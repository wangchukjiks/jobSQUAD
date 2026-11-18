import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Listing } from '../types/index.ts';

export interface StoredUser {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  accountType: 'seeker' | 'employer' | 'lister';
  isAdmin: boolean;
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
    phone: '+33 759163133',
    accountType: 'employer',
    isAdmin: true,
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

    // Ensure default administrator account always exists
    const hasDefaultAdmin = parsed.users.some(
      (u) => u.email.toLowerCase() === 'wangchukjiks@gmail.com'
    );
    if (!hasDefaultAdmin) {
      const init = createInitialStore();
      parsed.users.unshift(init.users[0]);
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
}): StoredUser {
  const store = loadStore();
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const user: StoredUser = {
    uid: `usr_${crypto.randomBytes(10).toString('hex')}`,
    email: normalizedEmail,
    displayName: input.displayName.trim(),
    phone: input.phone.trim(),
    accountType: input.accountType,
    isAdmin: ADMIN_EMAILS.has(normalizedEmail),
    passwordSalt: salt,
    passwordHash: hashPassword(input.password, salt),
    createdAt: Date.now(),
  };

  store.users.push(user);
  saveStore(store);
  return user;
}

export function authenticateAccount(email: string, password: string): StoredUser {
  const store = loadStore();
  const normalizedEmail = email.trim().toLowerCase();
  const user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error('Invalid email or password.');
  }
  return user;
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
    phone: input.phone || '',
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
