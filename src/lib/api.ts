import type {
  AccountType,
  Listing,
  SupportedLang,
  TranslationBundle,
  UserProfile,
} from '../types/index.ts';

let cachedCsrfToken: string | null = null;
let inMemorySessionToken: string | null = null;

async function parseJsonSafe<T>(res: Response): Promise<T> {
  const raw = await res.text();
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('<')) {
    throw new Error(
      'Backend API returned an unexpected response. Please verify the application server is running.'
    );
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error('Invalid JSON response received from server.');
  }
}

export async function ensureCsrfToken(forceRefresh = false): Promise<string> {
  if (cachedCsrfToken && !forceRefresh) return cachedCsrfToken;
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
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

  let res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });

  if (res.status === 403) {
    token = await ensureCsrfToken(true);
    res = await fetch(url, {
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

  let res = await fetch(url, {
    method,
    credentials: 'include',
    headers: buildHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 403) {
    token = await ensureCsrfToken(true);
    res = await fetch(url, {
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
  const res = await fetch(`/api/captcha?t=${Date.now()}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await parseJsonSafe<{ question: string; token: string }>(res);
  if (!res.ok) throw new Error('Failed to load CAPTCHA');
  return data;
}

export async function verifyCaptchaAnswer(captchaToken: string, captchaAnswer: string): Promise<boolean> {
  const result = await postProtected<{ valid: boolean }>('/api/captcha/verify', {
    captchaToken,
    captchaAnswer,
  });
  return Boolean(result.valid);
}

export async function fetchCurrentAuthUser(): Promise<UserProfile | null> {
  try {
    const headers: Record<string, string> = {};
    if (inMemorySessionToken) {
      headers['Authorization'] = `Bearer ${inMemorySessionToken}`;
    }
    const res = await fetch('/api/auth/me', { credentials: 'include', headers });
    if (!res.ok) return null;
    const data = await parseJsonSafe<{ user: UserProfile | null }>(res);
    return data.user || null;
  } catch {
    return null;
  }
}

export async function registerWithDetails(input: {
  displayName: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
  captchaToken: string;
  captchaAnswer: string;
}): Promise<UserProfile> {
  const res = await postProtected<{ user: UserProfile; sessionToken?: string }>(
    '/api/auth/register',
    input
  );
  if (res.sessionToken) inMemorySessionToken = res.sessionToken;
  return res.user;
}

export async function loginWithCredentials(input: {
  email: string;
  password: string;
}): Promise<UserProfile> {
  const res = await postProtected<{ user: UserProfile; sessionToken?: string }>(
    '/api/auth/login',
    input
  );
  if (res.sessionToken) inMemorySessionToken = res.sessionToken;
  return res.user;
}

export async function syncFirebaseSession(idToken: string): Promise<void> {
  const res = await postProtected<{ ok: boolean; sessionToken?: string }>(
    '/api/auth/firebase-session',
    { idToken }
  );
  if (res.sessionToken) {
    inMemorySessionToken = res.sessionToken;
  }
}

export async function logoutServerSession(): Promise<void> {
  try {
    await postProtected('/api/auth/logout', {});
  } finally {
    inMemorySessionToken = null;
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
    const res = await fetch('/api/listings', { credentials: 'include', cache: 'no-store', headers });
    if (!res.ok) return { listings: [], deletedIds: [] };
    return await parseJsonSafe<{ listings: Listing[]; deletedIds: string[] }>(res);
  } catch {
    return { listings: [], deletedIds: [] };
  }
}

export async function saveServerListing(listing: Partial<Listing>): Promise<Listing> {
  const res = await postProtected<{ listing: Listing }>('/api/listings', listing);
  return res.listing;
}

export async function updateServerListing(id: string, listing: Partial<Listing>): Promise<Listing> {
  const res = await requestProtected<{ listing: Listing }>('PUT', `/api/listings/${encodeURIComponent(id)}`, listing);
  return res.listing;
}

export async function deleteServerListingById(id: string): Promise<void> {
  await requestProtected<{ ok: boolean }>('DELETE', `/api/listings/${encodeURIComponent(id)}`);
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
  stats: {
    jobs: number;
    houses: number;
    cars: number;
    sales: number;
    total: number;
    categories: Record<string, number>;
  };
}): Promise<{ reply: string; mode: 'gemini' | 'live-fallback' }> {
  return postProtected('/api/chat', input);
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
  messageId?: string;
  note?: string;
}> {
  return postProtected('/api/contact', input);
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
  messageId?: string;
  note?: string;
}> {
  return postProtected('/api/listing-inquiry', input);
}

export function compressImageToDataUrl(file: File, maxDimension = 800, quality = 0.72): Promise<string> {
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
        if (dataUrl.length > 420000) {
          resolve(canvas.toDataURL('image/jpeg', 0.58));
        } else {
          resolve(dataUrl);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
