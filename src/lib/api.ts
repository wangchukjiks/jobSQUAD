import type {
  AccountType,
  Listing,
  SupportedLang,
  TranslationBundle,
  UserProfile,
} from '../types/index.ts';
import {
  buildSmartCatalogReply,
  type ChatbotHistoryItem,
  type ChatbotStats,
} from './chatbotEngine.ts';
import { formatPhoneNumber } from './phone.ts';

let cachedCsrfToken: string | null = null;
const SESSION_TOKEN_STORAGE_KEY = 'jobsquad_srv_session_token_v1';

function readStoredSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredSessionToken(token: string | null): void {
  inMemorySessionToken = token;
  try {
    if (token) localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage issues
  }
}

let inMemorySessionToken: string | null = readStoredSessionToken();

class ApiBackendUnavailableError extends Error {
  constructor() {
    super('Backend API is unavailable on this static host.');
  }
}

const STATIC_USERS_KEY = 'jobsquad_static_users_v1';
const STATIC_SESSION_KEY = 'jobsquad_static_session_v1';
const STATIC_LISTINGS_KEY = 'jobsquad_static_listings_v1';
const STATIC_DELETED_KEY = 'jobsquad_static_deleted_v1';
const ADMIN_PASS_SHA256 = '40849f49aecec61d86c6920ac1ce5c0ff85b6b35f2536faeb9a53c7bc4ed1afe';

interface StaticStoredUser extends UserProfile {
  passwordHash: string;
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues
  }
}

function getStaticUsers(): StaticStoredUser[] {
  const existing = readLocalJson<StaticStoredUser[]>(STATIC_USERS_KEY, []);
  let dirty = false;
  const adminIdx = existing.findIndex((u) => u.email.toLowerCase() === 'wangchukjiks@gmail.com');
  if (adminIdx < 0) {
    existing.unshift({
      uid: 'admin_wangchukjiks',
      email: 'wangchukjiks@gmail.com',
      displayName: 'JobSQUAD Administrator',
      phone: '+33 7 59 16 31 33',
      accountType: 'employer',
      acceptedTerms: true,
      acceptedTermsAt: Date.now(),
      isAdmin: true,
      passwordHash: ADMIN_PASS_SHA256,
    });
    dirty = true;
  } else {
    const admin = existing[adminIdx];
    if (!admin.acceptedTerms) {
      admin.acceptedTerms = true;
      admin.acceptedTermsAt = admin.acceptedTermsAt || Date.now();
      dirty = true;
    }
    if (!admin.isAdmin) {
      admin.isAdmin = true;
      dirty = true;
    }
    if (admin.phone) {
      const formattedAdminPhone = formatPhoneNumber(admin.phone);
      if (formattedAdminPhone && formattedAdminPhone !== admin.phone) {
        admin.phone = formattedAdminPhone;
        dirty = true;
      }
    }
  }
  if (dirty) {
    writeLocalJson(STATIC_USERS_KEY, existing);
  }
  return existing;
}

function getStaticSession(): UserProfile | null {
  return readLocalJson<UserProfile | null>(STATIC_SESSION_KEY, null);
}

function setStaticSession(user: UserProfile | null): void {
  if (!user) {
    try {
      localStorage.removeItem(STATIC_SESSION_KEY);
    } catch {
      // Ignore
    }
    return;
  }
  writeLocalJson(STATIC_SESSION_KEY, user);
}

function createLocalCaptchaChallenge(): { question: string; token: string } {
  const a = Math.floor(Math.random() * 14) + 3;
  const b = Math.floor(Math.random() * 11) + 2;
  const useSub = a > b + 1 && Math.random() > 0.5;
  const answer = useSub ? a - b : a + b;
  const question = useSub ? `${a} - ${b} = ?` : `${a} + ${b} = ?`;
  return {
    question,
    token: `local:${btoa(String(answer))}`,
  };
}

function verifyLocalCaptcha(token: string, answer: string): boolean {
  if (!token.startsWith('local:')) return false;
  try {
    const expected = atob(token.slice(6)).trim();
    return answer.trim() === expected;
  } catch {
    return false;
  }
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 2
): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init);
      if (
        (res.status === 502 || res.status === 503 || res.status === 504) &&
        attempt < retries
      ) {
        lastResponse = res;
        await new Promise((resolve) => setTimeout(resolve, 650));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, 650));
    }
  }
  return lastResponse!;
}

async function parseJsonSafe<T>(res: Response): Promise<T> {
  const raw = await res.text();
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('<')) {
    if (res.status === 413) {
      throw new Error('Uploaded images are too large. Please upload fewer or smaller images.');
    }
    if (res.url && res.url.includes('accounts.google.com')) {
      throw new Error('Preview authentication session expired. Please refresh the page and try again.');
    }
    if (res.status === 404 || (res.status === 200 && /^<!doctype|^<html/i.test(trimmed))) {
      throw new ApiBackendUnavailableError();
    }
    if (res.status >= 500) {
      throw new Error(
        `Application server is restarting or temporarily unavailable (HTTP ${res.status}). Please retry in a moment.`
      );
    }
    throw new Error(
      `Unexpected HTML response received from server (HTTP ${res.status}). Please refresh the page and verify the server is running.`
    );
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(`Invalid JSON response received from server (HTTP ${res.status}).`);
  }
}

export async function ensureCsrfToken(forceRefresh = false): Promise<string> {
  if (cachedCsrfToken && !forceRefresh) return cachedCsrfToken;
  const res = await fetchWithRetry('/api/csrf-token', { credentials: 'include', cache: 'no-store' });
  const data = await parseJsonSafe<{ csrfToken: string }>(res);
  if (!res.ok || !data.csrfToken) {
    throw new Error('Unable to initialize security session.');
  }
  cachedCsrfToken = data.csrfToken;
  return cachedCsrfToken;
}

async function postProtected<T>(url: string, body: unknown): Promise<T> {
  let token = await ensureCsrfToken();
  const buildHeaders = (csrf: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
    };
    if (inMemorySessionToken) {
      headers['Authorization'] = `Bearer ${inMemorySessionToken}`;
    }
    return headers;
  };

  let res = await fetchWithRetry(url, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });

  if (res.status === 403) {
    token = await ensureCsrfToken(true);
    res = await fetchWithRetry(url, {
      method: 'POST',
      credentials: 'include',
      headers: buildHeaders(token),
      body: JSON.stringify(body),
    });
  }

  const data = await parseJsonSafe<T & { error?: string }>(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Request failed');
  }
  return data;
}

async function requestProtected<T>(method: 'PUT' | 'DELETE', url: string, body?: unknown): Promise<T> {
  let token = await ensureCsrfToken();
  const buildHeaders = (csrf: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
    };
    if (inMemorySessionToken) {
      headers['Authorization'] = `Bearer ${inMemorySessionToken}`;
    }
    return headers;
  };

  let res = await fetchWithRetry(url, {
    method,
    credentials: 'include',
    headers: buildHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 403) {
    token = await ensureCsrfToken(true);
    res = await fetchWithRetry(url, {
      method,
      credentials: 'include',
      headers: buildHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  const data = await parseJsonSafe<T & { error?: string }>(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Request failed');
  }
  return data;
}

export async function fetchCaptchaChallenge(): Promise<{ question: string; token: string }> {
  try {
    const res = await fetchWithRetry(`/api/captcha?t=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    const data = await parseJsonSafe<{ question: string; token: string }>(res);
    if (!res.ok) throw new Error('Failed to load CAPTCHA');
    return data;
  } catch (err) {
    if (err instanceof ApiBackendUnavailableError) {
      return createLocalCaptchaChallenge();
    }
    throw err;
  }
}

export async function verifyCaptchaAnswer(captchaToken: string, captchaAnswer: string): Promise<boolean> {
  if (captchaToken.startsWith('local:')) {
    return verifyLocalCaptcha(captchaToken, captchaAnswer);
  }
  try {
    const result = await postProtected<{ valid: boolean }>('/api/captcha/verify', {
      captchaToken,
      captchaAnswer,
    });
    return Boolean(result.valid);
  } catch (err) {
    if (err instanceof ApiBackendUnavailableError) {
      return verifyLocalCaptcha(captchaToken, captchaAnswer);
    }
    throw err;
  }
}

export async function fetchCurrentAuthUser(): Promise<UserProfile | null> {
  try {
    const headers: Record<string, string> = {};
    if (inMemorySessionToken) {
      headers['Authorization'] = `Bearer ${inMemorySessionToken}`;
    }
    const res = await fetchWithRetry('/api/auth/me', {
      credentials: 'include',
      cache: 'no-store',
      headers,
    });
    if (!res.ok) {
      return res.status === 404 ? getStaticSession() : null;
    }
    const data = await parseJsonSafe<{ user: UserProfile | null }>(res);
    return data.user || null;
  } catch (err) {
    if (err instanceof ApiBackendUnavailableError) {
      return getStaticSession();
    }
    return null;
  }
}

export async function registerWithDetails(input: {
  displayName: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
  acceptedTerms: boolean;
  captchaToken: string;
  captchaAnswer: string;
}): Promise<UserProfile> {
  try {
    const res = await postProtected<{ user: UserProfile; sessionToken?: string }>(
      '/api/auth/register',
      input
    );
    if (res.sessionToken) writeStoredSessionToken(res.sessionToken);
    return res.user;
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;

    if (!input.acceptedTerms) {
      throw new Error('You must accept the Terms of Service and Privacy Policy to create an account.');
    }
    if (!verifyLocalCaptcha(input.captchaToken, input.captchaAnswer)) {
      throw new Error('CAPTCHA verification failed. Please try again.');
    }
    const cleanEmail = input.email.trim().toLowerCase();
    const users = getStaticUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email already exists. Please log in.');
    }
    const passwordHash = await sha256Hex(input.password);
    const now = Date.now();
    const created: StaticStoredUser = {
      uid: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      displayName: input.displayName.trim(),
      email: cleanEmail,
      phone: formatPhoneNumber(input.phone.trim()),
      accountType: input.accountType,
      acceptedTerms: true,
      acceptedTermsAt: now,
      isAdmin: cleanEmail === 'wangchukjiks@gmail.com',
      passwordHash,
    };
    users.push(created);
    writeLocalJson(STATIC_USERS_KEY, users);
    const profile: UserProfile = {
      uid: created.uid,
      displayName: created.displayName,
      email: created.email,
      phone: created.phone,
      accountType: created.accountType,
      acceptedTerms: true,
      acceptedTermsAt: now,
      isAdmin: created.isAdmin,
    };
    setStaticSession(profile);
    return profile;
  }
}

export async function loginWithCredentials(input: {
  email: string;
  password: string;
}): Promise<UserProfile> {
  try {
    const res = await postProtected<{ user: UserProfile; sessionToken?: string }>(
      '/api/auth/login',
      input
    );
    if (res.sessionToken) writeStoredSessionToken(res.sessionToken);
    return res.user;
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;

    const cleanEmail = input.email.trim().toLowerCase();
    const users = getStaticUsers();
    const match = users.find((u) => u.email.toLowerCase() === cleanEmail);
    const inputHash = await sha256Hex(input.password);
    if (!match || match.passwordHash !== inputHash) {
      throw new Error('Invalid email or password.');
    }
    const profile: UserProfile = {
      uid: match.uid,
      displayName: match.displayName,
      email: match.email,
      phone: formatPhoneNumber(match.phone),
      accountType: match.accountType,
      acceptedTerms: Boolean(match.acceptedTerms || match.isAdmin),
      acceptedTermsAt: match.acceptedTermsAt,
      isAdmin: Boolean(match.isAdmin),
    };
    setStaticSession(profile);
    return profile;
  }
}

export async function updateMyProfile(input: {
  displayName: string;
  phone: string;
  accountType: AccountType;
}): Promise<UserProfile> {
  const formattedPhone = formatPhoneNumber(input.phone.trim());
  try {
    const res = await requestProtected<{ user: UserProfile; sessionToken?: string }>('PUT', '/api/auth/me', {
      displayName: input.displayName.trim(),
      phone: formattedPhone,
      accountType: input.accountType,
    });
    if (res.sessionToken) writeStoredSessionToken(res.sessionToken);
    return res.user;
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;
    const session = getStaticSession();
    if (!session) throw new Error('Authentication required.');
    const users = getStaticUsers();
    const idx = users.findIndex((u) => u.uid === session.uid);
    const updatedUser: UserProfile = {
      ...session,
      displayName: input.displayName.trim(),
      phone: formattedPhone,
      accountType: input.accountType,
      acceptedTerms: true,
      acceptedTermsAt: session.acceptedTermsAt || Date.now(),
    };
    if (idx >= 0) {
      users[idx] = {
        ...users[idx],
        ...updatedUser,
      };
      writeLocalJson(STATIC_USERS_KEY, users);
    }
    setStaticSession(updatedUser);
    return updatedUser;
  }
}

export async function deleteMyAccount(): Promise<void> {
  try {
    await requestProtected<{ ok: boolean }>('DELETE', '/api/auth/me');
    writeStoredSessionToken(null);
    setStaticSession(null);
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) {
      throw err;
    }
    const session = getStaticSession();
    if (!session) throw new Error('Authentication required.');
    if (session.email.toLowerCase() === 'wangchukjiks@gmail.com') {
      throw new Error('Primary administrator account cannot be deleted.');
    }
    const users = getStaticUsers().filter((u) => u.uid !== session.uid);
    writeLocalJson(STATIC_USERS_KEY, users);
    const listings = readLocalJson<Listing[]>(STATIC_LISTINGS_KEY, []).filter(
      (item) => item.ownerId !== session.uid
    );
    writeLocalJson(STATIC_LISTINGS_KEY, listings);
    writeStoredSessionToken(null);
    setStaticSession(null);
  }
}

export async function syncFirebaseSession(
  idToken: string,
  profile?: {
    uid?: string;
    email?: string;
    displayName?: string;
    phone?: string;
    accountType?: AccountType;
    acceptedTerms?: boolean;
  }
): Promise<UserProfile | null> {
  try {
    const res = await postProtected<{ ok: boolean; sessionToken?: string; user?: UserProfile }>(
      '/api/auth/firebase-session',
      { idToken, profile }
    );
    if (res.sessionToken) {
      writeStoredSessionToken(res.sessionToken);
    }
    return res.user || null;
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;

    if (profile?.email) {
      const cleanEmail = profile.email.trim().toLowerCase();
      const users = getStaticUsers();
      const idx = users.findIndex(
        (u) => (profile.uid && u.uid === profile.uid) || u.email.toLowerCase() === cleanEmail
      );
      const formattedPhone = profile.phone ? formatPhoneNumber(profile.phone.trim()) : '';
      const isAdminEmail = cleanEmail === 'wangchukjiks@gmail.com';
      const now = Date.now();
      if (idx >= 0) {
        const existing = users[idx];
        const nextAccepted = Boolean(
          existing.acceptedTerms || profile.acceptedTerms || isAdminEmail
        );
        users[idx] = {
          ...existing,
          displayName: profile.displayName?.trim() || existing.displayName,
          phone: formattedPhone || existing.phone,
          accountType: profile.accountType || existing.accountType,
          acceptedTerms: nextAccepted,
          acceptedTermsAt: nextAccepted ? existing.acceptedTermsAt || now : existing.acceptedTermsAt,
          isAdmin: Boolean(existing.isAdmin || isAdminEmail),
        };
      } else {
        users.push({
          uid: profile.uid || `usr_${now.toString(36)}`,
          displayName: profile.displayName?.trim() || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: formattedPhone,
          accountType: profile.accountType || 'employer',
          acceptedTerms: Boolean(profile.acceptedTerms || isAdminEmail),
          acceptedTermsAt: profile.acceptedTerms || isAdminEmail ? now : undefined,
          isAdmin: isAdminEmail,
          passwordHash: '',
        });
      }
      writeLocalJson(STATIC_USERS_KEY, users);
      const stored = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (stored) {
        return {
          uid: stored.uid,
          displayName: stored.displayName,
          email: stored.email,
          phone: stored.phone,
          accountType: stored.accountType,
          acceptedTerms: stored.acceptedTerms,
          acceptedTermsAt: stored.acceptedTermsAt,
          isAdmin: stored.isAdmin,
        };
      }
    }
    return null;
  }
}

export async function logoutServerSession(): Promise<void> {
  try {
    await postProtected('/api/auth/logout', {});
  } catch {
    // Ignore when static-only
  } finally {
    writeStoredSessionToken(null);
    setStaticSession(null);
  }
}

export interface ServerAdminUser extends UserProfile {
  createdAt?: number;
}

export async function fetchServerAdminUsers(): Promise<ServerAdminUser[]> {
  try {
    const headers: Record<string, string> = {};
    if (inMemorySessionToken) {
      headers['Authorization'] = `Bearer ${inMemorySessionToken}`;
    }
    const res = await fetchWithRetry('/api/admin/users', {
      credentials: 'include',
      cache: 'no-store',
      headers,
    });
    if (!res.ok) {
      if (res.status === 404) {
        return getStaticUsers().map((u) => ({
          uid: u.uid,
          displayName: u.displayName,
          email: u.email,
          phone: u.phone,
          accountType: u.accountType,
          acceptedTerms: u.acceptedTerms,
          acceptedTermsAt: u.acceptedTermsAt,
          isAdmin: u.isAdmin,
        }));
      }
      return [];
    }
    const data = await parseJsonSafe<{ users: ServerAdminUser[] }>(res);
    return Array.isArray(data.users) ? data.users : [];
  } catch (err) {
    if (err instanceof ApiBackendUnavailableError) {
      return getStaticUsers().map((u) => ({
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        phone: u.phone,
        accountType: u.accountType,
        acceptedTerms: u.acceptedTerms,
        acceptedTermsAt: u.acceptedTermsAt,
        isAdmin: u.isAdmin,
      }));
    }
    return [];
  }
}

export async function updateServerAdminUser(
  uid: string,
  updates: {
    displayName: string;
    email: string;
    phone: string;
    accountType: AccountType;
    newPassword?: string;
  }
): Promise<ServerAdminUser> {
  try {
    const res = await requestProtected<{ user: ServerAdminUser }>(
      'PUT',
      `/api/admin/users/${encodeURIComponent(uid)}`,
      updates
    );
    return res.user;
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;
    const session = getStaticSession();
    if (!session?.isAdmin) throw new Error('Forbidden: administrator access required.');
    const users = getStaticUsers();
    const idx = users.findIndex((u) => u.uid === uid);
    if (idx < 0) throw new Error('User account not found.');
    const nextEmail = updates.email.trim().toLowerCase();
    if (users.some((u) => u.uid !== uid && u.email.toLowerCase() === nextEmail)) {
      throw new Error('Another account already uses this email address.');
    }
    const nextPasswordHash =
      updates.newPassword && updates.newPassword.length >= 8
        ? await sha256Hex(updates.newPassword)
        : users[idx].passwordHash;
    const updated: StaticStoredUser = {
      ...users[idx],
      displayName: updates.displayName.trim(),
      email: nextEmail,
      phone: updates.phone.trim() ? formatPhoneNumber(updates.phone.trim()) : '',
      accountType: updates.accountType,
      isAdmin: users[idx].isAdmin || nextEmail === 'wangchukjiks@gmail.com',
      passwordHash: nextPasswordHash,
    };
    users[idx] = updated;
    writeLocalJson(STATIC_USERS_KEY, users);
    return {
      uid: updated.uid,
      displayName: updated.displayName,
      email: updated.email,
      phone: updated.phone,
      accountType: updated.accountType,
      acceptedTerms: updated.acceptedTerms,
      acceptedTermsAt: updated.acceptedTermsAt,
      isAdmin: updated.isAdmin,
    };
  }
}

export async function deleteServerAdminUser(uid: string): Promise<void> {
  try {
    await requestProtected<{ ok: boolean }>('DELETE', `/api/admin/users/${encodeURIComponent(uid)}`);
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;
    const session = getStaticSession();
    if (!session?.isAdmin) throw new Error('Forbidden: administrator access required.');
    const users = getStaticUsers();
    const target = users.find((u) => u.uid === uid);
    if (!target) throw new Error('User account not found.');
    if (target.email.toLowerCase() === 'wangchukjiks@gmail.com') {
      throw new Error('Primary administrator account cannot be deleted.');
    }
    writeLocalJson(
      STATIC_USERS_KEY,
      users.filter((u) => u.uid !== uid)
    );
  }
}

export async function fetchServerListings(): Promise<{
  listings: Listing[];
  deletedIds: string[];
}> {
  try {
    const headers: Record<string, string> = {};
    if (inMemorySessionToken) {
      headers['Authorization'] = `Bearer ${inMemorySessionToken}`;
    }
    const res = await fetchWithRetry('/api/listings', {
      credentials: 'include',
      cache: 'no-store',
      headers,
    });
    if (!res.ok) {
      if (res.status === 404) {
        return {
          listings: readLocalJson<Listing[]>(STATIC_LISTINGS_KEY, []),
          deletedIds: readLocalJson<string[]>(STATIC_DELETED_KEY, []),
        };
      }
      return { listings: [], deletedIds: [] };
    }
    return await parseJsonSafe<{ listings: Listing[]; deletedIds: string[] }>(res);
  } catch (err) {
    if (err instanceof ApiBackendUnavailableError) {
      return {
        listings: readLocalJson<Listing[]>(STATIC_LISTINGS_KEY, []),
        deletedIds: readLocalJson<string[]>(STATIC_DELETED_KEY, []),
      };
    }
    return { listings: [], deletedIds: [] };
  }
}

export async function saveServerListing(listing: Partial<Listing>): Promise<Listing> {
  try {
    const res = await postProtected<{ listing: Listing }>('/api/listings', listing);
    return res.listing;
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;
    const session = getStaticSession();
    if (!session) throw new Error('Authentication required to publish listings.');
    const items = readLocalJson<Listing[]>(STATIC_LISTINGS_KEY, []);
    const created: Listing = {
      id: listing.id || `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ownerId: session.uid,
      ownerName: listing.ownerName || session.displayName,
      type: listing.type || 'job',
      category: listing.category || 'babysitting',
      title: String(listing.title || '').trim(),
      description: String(listing.description || '').trim(),
      location: String(listing.location || '').trim(),
      priceEur: listing.type === 'job' ? 0 : Number(listing.priceEur) || 0,
      contactEmail: listing.contactEmail || session.email,
      contactPhone: formatPhoneNumber(String(listing.contactPhone || '').trim()),
      images: listing.type === 'job' ? [] : listing.images || [],
      specs: listing.specs || {},
      translations: listing.translations || ({} as Listing['translations']),
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSeeded: false,
    };
    items.unshift(created);
    writeLocalJson(STATIC_LISTINGS_KEY, items);
    return created;
  }
}

export async function updateServerListing(id: string, listing: Partial<Listing>): Promise<Listing> {
  try {
    const res = await requestProtected<{ listing: Listing }>('PUT', `/api/listings/${encodeURIComponent(id)}`, listing);
    return res.listing;
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;
    const session = getStaticSession();
    if (!session) throw new Error('Authentication required.');
    const items = readLocalJson<Listing[]>(STATIC_LISTINGS_KEY, []);
    const idx = items.findIndex((item) => item.id === id);
    const updated: Listing = {
      ...(idx >= 0 ? items[idx] : (listing as Listing)),
      ...listing,
      id,
      updatedAt: Date.now(),
      isSeeded: false,
    };
    if (idx >= 0) items[idx] = updated;
    else items.unshift(updated);
    writeLocalJson(STATIC_LISTINGS_KEY, items);
    return updated;
  }
}

export async function flagServerListing(
  id: string,
  payload: { flagged: boolean; flagReason: string; listingSnapshot?: Listing }
): Promise<Listing> {
  try {
    const res = await postProtected<{ listing: Listing }>(
      `/api/listings/${encodeURIComponent(id)}/flag`,
      payload
    );
    return res.listing;
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;
    const session = getStaticSession();
    if (!session?.isAdmin) throw new Error('Forbidden: administrator access required.');
    const items = readLocalJson<Listing[]>(STATIC_LISTINGS_KEY, []);
    const idx = items.findIndex((item) => item.id === id);
    const base = idx >= 0 ? items[idx] : payload.listingSnapshot;
    if (!base) throw new Error('Listing not found.');
    const updated: Listing = {
      ...base,
      id,
      flagged: payload.flagged,
      flagReason: payload.flagged ? payload.flagReason.trim().slice(0, 500) : '',
      flaggedAt: payload.flagged ? Date.now() : undefined,
      flaggedBy: payload.flagged ? session.email : undefined,
      updatedAt: Date.now(),
      isSeeded: false,
    };
    if (idx >= 0) items[idx] = updated;
    else items.unshift(updated);
    writeLocalJson(STATIC_LISTINGS_KEY, items);
    return updated;
  }
}

export async function deleteServerListingById(id: string): Promise<void> {
  try {
    await requestProtected<{ ok: boolean }>('DELETE', `/api/listings/${encodeURIComponent(id)}`);
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;
    const items = readLocalJson<Listing[]>(STATIC_LISTINGS_KEY, []).filter((i) => i.id !== id);
    const deleted = readLocalJson<string[]>(STATIC_DELETED_KEY, []);
    if (!deleted.includes(id)) deleted.push(id);
    writeLocalJson(STATIC_LISTINGS_KEY, items);
    writeLocalJson(STATIC_DELETED_KEY, deleted);
  }
}

export async function translateListingViaServer(input: {
  title: string;
  description: string;
  location: string;
  specsSummary?: string;
}): Promise<{ translations: TranslationBundle; cached: boolean; aiTranslated: boolean }> {
  return postProtected('/api/translate', input);
}

export async function sendAssistantMessage(input: {
  message: string;
  language: SupportedLang;
  stats: ChatbotStats;
  listings?: Listing[];
  history?: ChatbotHistoryItem[];
}): Promise<{ reply: string; mode: 'gemini' | 'live-fallback' }> {
  const listings = input.listings || [];
  const compactListings = listings.slice(0, 60).map((item) => ({
    id: item.id,
    type: item.type,
    category: item.category,
    title: item.title,
    description: item.description.slice(0, 260),
    location: item.location,
    priceEur: item.priceEur,
    contactPhone: item.contactPhone,
    ownerName: item.ownerName,
    specs: item.specs,
    translations: item.translations
      ? {
          [input.language]: item.translations[input.language],
          en: item.translations.en,
        }
      : undefined,
  }));

  try {
    return await postProtected('/api/chat', {
      message: input.message,
      language: input.language,
      stats: input.stats,
      listings: compactListings,
      history: (input.history || []).slice(-8),
    });
  } catch {
    return {
      reply: buildSmartCatalogReply({
        message: input.message,
        language: input.language,
        stats: input.stats,
        listings,
        history: input.history,
      }),
      mode: 'live-fallback',
    };
  }
}

export async function submitContactInquiry(input: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  captchaToken: string;
  captchaAnswer: string;
}): Promise<{
  ok: boolean;
  delivered: boolean;
  saved?: boolean;
  deliveredTo?: string;
  sandboxForwarded?: boolean;
  staticFallback?: boolean;
  mailtoUrl?: string;
  gmailUrl?: string;
  messageId?: string;
  note?: string;
}> {
  try {
    return await postProtected('/api/contact', input);
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;
    if (!verifyLocalCaptcha(input.captchaToken, input.captchaAnswer)) {
      throw new Error('CAPTCHA verification failed. Please try again.');
    }
    const recipient = 'contact.jobsquad@gmail.com';
    const mailtoSubject = encodeURIComponent(`[JobSQUAD Contact] ${input.subject}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone || 'N/A'}\n\n${input.message}`
    );
    return {
      ok: true,
      delivered: false,
      staticFallback: true,
      mailtoUrl: `mailto:${recipient}?subject=${mailtoSubject}&body=${mailtoBody}`,
      gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${mailtoSubject}&body=${mailtoBody}`,
      note: 'Automated server delivery is only active on the live Development App URL. Use Open in Gmail, Open Email App, or Copy below to send your message directly.',
    };
  }
}

export async function sendListingInquiry(input: {
  listingId: string;
  ownerEmail: string;
  ownerName: string;
  listingTitle: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
  captchaToken: string;
  captchaAnswer: string;
}): Promise<{
  ok: boolean;
  delivered: boolean;
  saved?: boolean;
  deliveredTo?: string;
  sandboxForwarded?: boolean;
  staticFallback?: boolean;
  mailtoUrl?: string;
  gmailUrl?: string;
  messageId?: string;
  note?: string;
}> {
  try {
    return await postProtected('/api/listing-inquiry', input);
  } catch (err) {
    if (!(err instanceof ApiBackendUnavailableError)) throw err;
    if (!verifyLocalCaptcha(input.captchaToken, input.captchaAnswer)) {
      throw new Error('CAPTCHA verification failed. Please try again.');
    }
    const mailtoSubject = encodeURIComponent(`[JobSQUAD] Inquiry: ${input.listingTitle}`);
    const mailtoBody = encodeURIComponent(
      `Hello ${input.ownerName},\n\n${input.message}\n\nFrom: ${input.senderName} (${input.senderEmail}${input.senderPhone ? `, ${input.senderPhone}` : ''})`
    );
    return {
      ok: true,
      delivered: false,
      staticFallback: true,
      mailtoUrl: `mailto:${input.ownerEmail}?subject=${mailtoSubject}&body=${mailtoBody}`,
      gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(input.ownerEmail)}&su=${mailtoSubject}&body=${mailtoBody}`,
      note: 'Automated server delivery is only active on the live Development App URL. Use Open in Gmail, Open Email App, or Copy below to email the owner directly.',
    };
  }
}

export function compressImageToDataUrl(file: File, maxDimension = 680, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Only image files are permitted.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > 220000) {
          resolve(canvas.toDataURL('image/jpeg', 0.48));
        } else {
          resolve(dataUrl);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
