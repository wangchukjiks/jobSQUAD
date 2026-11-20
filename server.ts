import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  clearSessionCookie,
  createCaptchaChallenge,
  issueCsrfToken,
  issueSessionCookie,
  readSessionFromRequest,
  requireCsrf,
  verifyCaptchaChallenge,
} from './src/server/security.ts';
import {
  generateAssistantReply,
  translateListingContent,
  type SupportedLang,
} from './src/server/gemini.ts';
import { sendContactEmail, sendListingInquiryEmail } from './src/server/email.ts';
import { SEED_LISTINGS } from './src/data/seedListings.ts';
import {
  authenticateAccount,
  deleteOwnStoredUser,
  deleteServerListing,
  deleteStoredUser,
  getAllServerListings,
  getAllStoredUsers,
  getServerListingById,
  getStoredUserByUid,
  registerAccount,
  updateOwnStoredUser,
  updateStoredUser,
  upsertGoogleStoredUser,
  upsertServerListing,
} from './src/server/store.ts';
import { formatPhoneNumber, getDialCodeForCountry } from './src/lib/phone.ts';
import type { Listing } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_LANGS: SupportedLang[] = ['zh', 'en', 'fr', 'es', 'dz', 'gsw', 'bo'];

function getFirebaseApiKey(): string {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf8');
    const parsed = JSON.parse(raw) as { apiKey?: string };
    return parsed.apiKey || '';
  } catch {
    return '';
  }
}

function resolveServerPort(): number {
  const argv = process.argv;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port' && argv[i + 1]) {
      const parsed = Number(argv[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    } else if (argv[i].startsWith('--port=')) {
      const parsed = Number(argv[i].slice('--port='.length));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  if (process.env.NODE_ENV === 'development') {
    return 3000;
  }
  return Number(process.env.PORT || 3000);
}

async function startServer() {
  const app = express();
  const port = resolveServerPort();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '4mb' }));

  // Baseline HTTP security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Prevent mobile/proxy caching on dynamic API responses
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'jobsquad-api' });
  });

  app.get('/api/csrf-token', (req, res) => {
    const token = issueCsrfToken(req, res);
    res.json({ csrfToken: token });
  });

  app.get('/api/captcha', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const challenge = createCaptchaChallenge();
    res.json(challenge);
  });

  app.post('/api/captcha/verify', requireCsrf, (req, res) => {
    const { captchaToken, captchaAnswer } = req.body ?? {};
    const valid = verifyCaptchaChallenge(captchaToken, captchaAnswer);
    if (!valid) {
      res.status(400).json({ valid: false, error: 'Incorrect or expired CAPTCHA answer.' });
      return;
    }
    res.json({ valid: true });
  });

  const geoIpCache = new Map<string, { countryCode: string; expiresAt: number }>();

  function normalizeClientIp(rawIp: string): string {
    let ip = rawIp.trim();
    if (ip.startsWith('::ffff:')) ip = ip.slice(7);
    const portMatch = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (portMatch) ip = portMatch[1];
    return ip;
  }

  function isPrivateOrLocalIp(ip: string): boolean {
    if (!ip) return true;
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === 'localhost' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }
    const ipv4 = lower.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (!ipv4) return false;
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }

  function extractPublicVisitorIp(req: express.Request): string | null {
    const candidates: string[] = [];
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string') {
      candidates.push(...xff.split(','));
    } else if (Array.isArray(xff)) {
      candidates.push(...xff.flatMap((v) => v.split(',')));
    }
    const xRealIp = req.headers['x-real-ip'];
    if (typeof xRealIp === 'string') candidates.push(xRealIp);
    if (req.ip) candidates.push(req.ip);
    if (req.socket?.remoteAddress) candidates.push(req.socket.remoteAddress);

    for (const raw of candidates) {
      const clean = normalizeClientIp(raw);
      if (clean && !isPrivateOrLocalIp(clean)) {
        return clean;
      }
    }
    return null;
  }

  app.get('/api/geo', async (req, res) => {
    const headerCandidates = [
      req.headers['cf-ipcountry'],
      req.headers['x-appengine-country'],
      req.headers['x-vercel-ip-country'],
      req.headers['x-country-code'],
      req.headers['cloudfront-viewer-country'],
      req.headers['x-client-country'],
      req.headers['fastly-client-country'],
    ];

    let countryCode = '';
    let fromProxyHeader = false;
    let detectedBy: 'proxy' | 'geoip' | 'accept-language' | 'default' = 'default';

    for (const candidate of headerCandidates) {
      const val = Array.isArray(candidate) ? candidate[0] : candidate;
      if (typeof val === 'string' && /^[A-Za-z]{2}$/.test(val.trim()) && val.trim().toUpperCase() !== 'XX') {
        countryCode = val.trim().toUpperCase();
        fromProxyHeader = true;
        detectedBy = 'proxy';
        break;
      }
    }

    if (!countryCode) {
      const visitorIp = extractPublicVisitorIp(req);
      if (visitorIp) {
        const cached = geoIpCache.get(visitorIp);
        if (cached && cached.expiresAt > Date.now()) {
          countryCode = cached.countryCode;
          detectedBy = 'geoip';
        } else {
          try {
            const geoRes = await fetch(
              `https://ipwho.is/${encodeURIComponent(visitorIp)}?fields=success,country_code`,
              { signal: AbortSignal.timeout(1500) }
            );
            if (geoRes.ok) {
              const geoJson = (await geoRes.json()) as {
                success?: boolean;
                country_code?: string;
              };
              if (
                geoJson.success &&
                typeof geoJson.country_code === 'string' &&
                /^[A-Za-z]{2}$/.test(geoJson.country_code.trim())
              ) {
                countryCode = geoJson.country_code.trim().toUpperCase();
                detectedBy = 'geoip';
                geoIpCache.set(visitorIp, {
                  countryCode,
                  expiresAt: Date.now() + 6 * 60 * 60 * 1000,
                });
              }
            }
          } catch {
            // Fall through to accept-language
          }
        }
      }
    }

    if (!countryCode) {
      const acceptLang = req.headers['accept-language'];
      if (typeof acceptLang === 'string') {
        const match = acceptLang.match(/[a-z]{2,3}[-_]([A-Z]{2})/);
        if (match?.[1]) {
          countryCode = match[1].toUpperCase();
          detectedBy = 'accept-language';
        }
      }
    }

    const resolvedCountry = countryCode || 'FR';
    res.json({
      countryCode: resolvedCountry,
      dialCode: getDialCodeForCountry(resolvedCountry),
      fromProxyHeader,
      detectedBy,
    });
  });

  // Authentication Endpoints (Email/Password Registration & Login + Default Admin)
  app.get('/api/auth/me', (req, res) => {
    const session = readSessionFromRequest(req);
    if (!session) {
      res.json({ user: null });
      return;
    }
    const stored = getStoredUserByUid(session.uid);
    if (!stored && (session.uid.startsWith('usr_') || session.uid.startsWith('admin_'))) {
      clearSessionCookie(req, res);
      res.json({ user: null });
      return;
    }
    res.json({
      user: {
        uid: session.uid,
        email: session.email,
        displayName: stored?.displayName ?? session.displayName,
        phone: stored?.phone ?? session.phone,
        accountType: stored?.accountType ?? session.accountType,
        isAdmin: stored?.isAdmin ?? session.isAdmin,
        acceptedTerms: stored?.acceptedTerms ?? (session.isAdmin ? true : undefined),
        acceptedTermsAt: stored?.acceptedTermsAt,
      },
    });
  });

  app.put('/api/auth/me', requireCsrf, (req, res) => {
    const session = readSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    try {
      const { displayName, phone, accountType } = (req.body ?? {}) as {
        displayName?: string;
        phone?: string;
        accountType?: string;
      };
      if (
        typeof displayName !== 'string' ||
        displayName.trim().length < 2 ||
        displayName.trim().length > 120 ||
        typeof phone !== 'string' ||
        phone.trim().length < 6 ||
        phone.trim().length > 40
      ) {
        res.status(400).json({ error: 'Please provide a valid display name and mobile number.' });
        return;
      }
      const safeType =
        accountType === 'seeker' || accountType === 'employer' || accountType === 'lister'
          ? accountType
          : 'employer';

      const updated = updateOwnStoredUser(
        session.uid,
        {
          displayName,
          phone,
          accountType: safeType,
        },
        { email: session.email, isAdmin: session.isAdmin }
      );

      const sessionToken = issueSessionCookie(req, res, {
        uid: updated.uid,
        email: updated.email,
        displayName: updated.displayName,
        phone: updated.phone,
        accountType: updated.accountType,
        isAdmin: updated.isAdmin,
      });

      res.json({ user: updated, sessionToken });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to update profile.',
      });
    }
  });

  app.delete('/api/auth/me', requireCsrf, (req, res) => {
    const session = readSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    try {
      deleteOwnStoredUser(session.uid, session.email);
      clearSessionCookie(req, res);
      res.json({ ok: true });
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Unable to delete account.',
      });
    }
  });

  app.post('/api/auth/register', requireCsrf, (req, res) => {
    try {
      const {
        displayName,
        email,
        phone,
        password,
        accountType,
        acceptedTerms,
        captchaToken,
        captchaAnswer,
      } = req.body ?? {};

      if (!verifyCaptchaChallenge(captchaToken, captchaAnswer)) {
        res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
        return;
      }

      if (acceptedTerms !== true) {
        res.status(400).json({
          error: 'You must accept the Terms of Service and Privacy Policy to create an account.',
        });
        return;
      }

      if (
        typeof displayName !== 'string' ||
        displayName.trim().length < 2 ||
        displayName.trim().length > 120 ||
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof phone !== 'string' ||
        phone.trim().length < 6 ||
        phone.trim().length > 40 ||
        typeof password !== 'string' ||
        password.length < 8
      ) {
        res.status(400).json({
          error: 'Please provide valid name, email, mobile number, and password (8+ characters).',
        });
        return;
      }

      const safeType =
        accountType === 'seeker' || accountType === 'employer' || accountType === 'lister'
          ? accountType
          : 'employer';

      const user = registerAccount({
        displayName,
        email,
        phone,
        password,
        accountType: safeType,
        acceptedTerms: true,
      });

      const sessionToken = issueSessionCookie(req, res, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        accountType: user.accountType,
        isAdmin: user.isAdmin,
      });

      res.json({
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          phone: user.phone,
          accountType: user.accountType,
          acceptedTerms: user.acceptedTerms,
          acceptedTermsAt: user.acceptedTermsAt,
          isAdmin: user.isAdmin,
        },
        sessionToken,
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Registration failed.',
      });
    }
  });

  app.post('/api/auth/login', requireCsrf, (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const user = authenticateAccount(email, password);
      const sessionToken = issueSessionCookie(req, res, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        accountType: user.accountType,
        isAdmin: user.isAdmin,
      });

      res.json({
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          phone: user.phone,
          accountType: user.accountType,
          acceptedTerms: user.acceptedTerms ?? true,
          acceptedTermsAt: user.acceptedTermsAt ?? user.createdAt,
          isAdmin: user.isAdmin,
        },
        sessionToken,
      });
    } catch (err) {
      res.status(401).json({
        error: err instanceof Error ? err.message : 'Invalid credentials.',
      });
    }
  });

  app.post('/api/auth/logout', requireCsrf, (req, res) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  app.post('/api/auth/firebase-session', requireCsrf, async (req, res) => {
    try {
      const { idToken, profile } = (req.body ?? {}) as {
        idToken?: string;
        profile?: {
          displayName?: string;
          phone?: string;
          accountType?: string;
          acceptedTerms?: boolean;
        };
      };
      const apiKey = getFirebaseApiKey();
      if (typeof idToken !== 'string' || !idToken || !apiKey) {
        res.status(400).json({ error: 'Invalid Firebase authentication token.' });
        return;
      }

      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );

      if (!verifyRes.ok) {
        res.status(401).json({ error: 'Unable to verify Google/Firebase session.' });
        return;
      }

      const verifyData = (await verifyRes.json()) as {
        users?: {
          localId?: string;
          email?: string;
          emailVerified?: boolean;
          displayName?: string;
        }[];
      };
      const fbAccount = verifyData.users?.[0];
      if (!fbAccount?.localId || !fbAccount?.email) {
        res.status(401).json({ error: 'Invalid Firebase user record.' });
        return;
      }

      const normalizedEmail = fbAccount.email.trim().toLowerCase();
      const isAdminUser =
        Boolean(fbAccount.emailVerified) && normalizedEmail === 'wangchukjiks@gmail.com';

      const safeDisplayName =
        typeof profile?.displayName === 'string' && profile.displayName.trim().length >= 2
          ? profile.displayName.trim().slice(0, 120)
          : fbAccount.displayName || normalizedEmail.split('@')[0];
      const safePhone =
        typeof profile?.phone === 'string' && profile.phone.trim().length >= 4
          ? formatPhoneNumber(profile.phone.trim())
          : '';
      const safeAccountType =
        profile?.accountType === 'seeker' ||
        profile?.accountType === 'employer' ||
        profile?.accountType === 'lister'
          ? profile.accountType
          : undefined;
      const safeAcceptedTerms =
        typeof profile?.acceptedTerms === 'boolean' ? profile.acceptedTerms : undefined;

      const storedUser = upsertGoogleStoredUser({
        uid: fbAccount.localId,
        email: normalizedEmail,
        displayName: safeDisplayName,
        phone: safePhone,
        accountType: safeAccountType,
        acceptedTerms: safeAcceptedTerms,
        isAdmin: isAdminUser,
      });

      const sessionToken = issueSessionCookie(req, res, {
        uid: storedUser.uid,
        email: storedUser.email,
        displayName: storedUser.displayName,
        phone: storedUser.phone,
        accountType: storedUser.accountType,
        isAdmin: storedUser.isAdmin,
      });

      res.json({
        ok: true,
        isAdmin: storedUser.isAdmin,
        sessionToken,
        user: storedUser,
      });
    } catch (err) {
      console.error('Firebase session sync error:', err);
      res.status(500).json({ error: 'Failed to sync session.' });
    }
  });

  // Admin User Management Endpoints (strictly administrator-only)
  app.get('/api/admin/users', (req, res) => {
    const session = readSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!session.isAdmin) {
      res.status(403).json({ error: 'Forbidden: administrator access required.' });
      return;
    }
    res.json({ users: getAllStoredUsers() });
  });

  app.put('/api/admin/users/:uid', requireCsrf, (req, res) => {
    const session = readSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!session.isAdmin) {
      res.status(403).json({ error: 'Forbidden: administrator access required.' });
      return;
    }

    try {
      const uid = String(req.params.uid);
      const { displayName, email, phone, accountType, newPassword } = (req.body ?? {}) as {
        displayName?: string;
        email?: string;
        phone?: string;
        accountType?: string;
        newPassword?: string;
      };

      const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
      if (
        typeof displayName !== 'string' ||
        displayName.trim().length < 2 ||
        displayName.trim().length > 120 ||
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        (cleanPhone.length > 0 && (cleanPhone.length < 6 || cleanPhone.length > 40))
      ) {
        res.status(400).json({
          error: 'Please provide valid display name, email address, and mobile number.',
        });
        return;
      }

      if (typeof newPassword === 'string' && newPassword.trim().length > 0 && newPassword.length < 8) {
        res.status(400).json({ error: 'New password must be at least 8 characters.' });
        return;
      }

      const safeType =
        accountType === 'seeker' || accountType === 'employer' || accountType === 'lister'
          ? accountType
          : 'employer';

      const updated = updateStoredUser(uid, {
        displayName,
        email,
        phone: cleanPhone,
        accountType: safeType,
        newPassword: typeof newPassword === 'string' && newPassword.length >= 8 ? newPassword : undefined,
      });

      res.json({ user: updated });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to update user account.',
      });
    }
  });

  app.delete('/api/admin/users/:uid', requireCsrf, (req, res) => {
    const session = readSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!session.isAdmin) {
      res.status(403).json({ error: 'Forbidden: administrator access required.' });
      return;
    }

    try {
      const uid = String(req.params.uid);
      deleteStoredUser(uid);
      res.json({ ok: true, uid });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to delete user account.',
      });
    }
  });

  // Server-backed Listings CRUD (public read, owner/admin write)
  app.get('/api/listings', (_req, res) => {
    const data = getAllServerListings();
    res.json(data);
  });

  app.post('/api/listings', requireCsrf, (req, res) => {
    const session = readSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required to publish listings.' });
      return;
    }

    const body = req.body as Partial<Listing>;
    const listingType =
      body.type === 'house' || body.type === 'car' || body.type === 'sale' ? body.type : 'job';

    if (
      !body ||
      typeof body.title !== 'string' ||
      body.title.trim().length < 2 ||
      typeof body.description !== 'string' ||
      body.description.trim().length < 10 ||
      typeof body.location !== 'string' ||
      body.location.trim().length < 2 ||
      typeof body.contactPhone !== 'string' ||
      body.contactPhone.trim().length < 6
    ) {
      res.status(400).json({ error: 'Missing required listing details or mobile number.' });
      return;
    }

    if (
      (listingType === 'house' || listingType === 'car' || listingType === 'sale') &&
      (!Array.isArray(body.images) || body.images.length < 1)
    ) {
      res.status(400).json({ error: 'At least 1 image is required for House, Car, and Sales posts.' });
      return;
    }

    const newListing: Listing = {
      id: body.id || `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ownerId: session.uid,
      ownerName: body.ownerName || session.displayName,
      type: listingType,
      category: body.category || 'babysitting',
      title: body.title.trim(),
      description: body.description.trim(),
      location: body.location.trim(),
      priceEur: listingType === 'job' ? 0 : Number(body.priceEur) || 0,
      contactEmail: body.contactEmail || session.email,
      contactPhone: formatPhoneNumber(body.contactPhone.trim()),
      images: listingType === 'job' ? [] : Array.isArray(body.images) ? body.images.slice(0, 3) : [],
      specs: body.specs || {},
      translations: body.translations || ({} as Listing['translations']),
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSeeded: false,
    };

    const saved = upsertServerListing(newListing);
    res.json({ listing: saved });
  });

  app.put('/api/listings/:id', requireCsrf, (req, res) => {
    const session = readSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const id = String(req.params.id);
    const existing = getServerListingById(id);
    const incoming = req.body as Partial<Listing>;

    if (existing && !session.isAdmin && existing.ownerId !== session.uid) {
      res.status(403).json({ error: 'Forbidden: you can only edit your own listings.' });
      return;
    }
    if (!existing && !session.isAdmin) {
      res.status(403).json({ error: 'Forbidden: only administrators can edit this listing.' });
      return;
    }

    const targetType = incoming.type || existing?.type || 'job';
    const merged: Listing = {
      id,
      ownerId: existing?.ownerId || incoming.ownerId || session.uid,
      ownerName: incoming.ownerName || existing?.ownerName || session.displayName,
      type: targetType,
      category: incoming.category || existing?.category || 'babysitting',
      title: String(incoming.title || existing?.title || '').trim(),
      description: String(incoming.description || existing?.description || '').trim(),
      location: String(incoming.location || existing?.location || '').trim(),
      priceEur: targetType === 'job' ? 0 : Number(incoming.priceEur ?? existing?.priceEur ?? 0),
      contactEmail: String(incoming.contactEmail || existing?.contactEmail || session.email).trim(),
      contactPhone: formatPhoneNumber(String(incoming.contactPhone || existing?.contactPhone || '').trim()),
      images:
        targetType === 'job'
          ? []
          : Array.isArray(incoming.images)
            ? incoming.images.slice(0, 3)
            : existing?.images || [],
      specs: incoming.specs || existing?.specs || {},
      translations: incoming.translations || existing?.translations || ({} as Listing['translations']),
      status: incoming.status === 'closed' ? 'closed' : 'active',
      flagged: session.isAdmin && typeof incoming.flagged === 'boolean' ? incoming.flagged : existing?.flagged,
      flagReason:
        session.isAdmin && typeof incoming.flagReason === 'string'
          ? incoming.flagReason.trim().slice(0, 500)
          : existing?.flagReason,
      flaggedAt:
        session.isAdmin && typeof incoming.flagged === 'boolean'
          ? incoming.flagged
            ? Date.now()
            : undefined
          : existing?.flaggedAt,
      flaggedBy:
        session.isAdmin && typeof incoming.flagged === 'boolean'
          ? incoming.flagged
            ? session.email
            : undefined
          : existing?.flaggedBy,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      isSeeded: false,
    };

    const saved = upsertServerListing(merged);
    res.json({ listing: saved });
  });

  app.post('/api/listings/:id/flag', requireCsrf, (req, res) => {
    const session = readSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!session.isAdmin) {
      res.status(403).json({ error: 'Forbidden: only administrators can flag or unflag listings.' });
      return;
    }

    const id = String(req.params.id);
    const { flagged, flagReason, listingSnapshot } = (req.body ?? {}) as {
      flagged?: boolean;
      flagReason?: string;
      listingSnapshot?: Partial<Listing>;
    };

    if (typeof flagged !== 'boolean') {
      res.status(400).json({ error: 'Invalid flag state.' });
      return;
    }

    const cleanReason = typeof flagReason === 'string' ? flagReason.trim().slice(0, 500) : '';
    if (flagged && cleanReason.length < 2) {
      res.status(400).json({ error: 'Please select or enter a reason for flagging this post.' });
      return;
    }

    const baseListing =
      getServerListingById(id) ||
      SEED_LISTINGS.find((s) => s.id === id) ||
      (listingSnapshot && typeof listingSnapshot.title === 'string'
        ? (listingSnapshot as Listing)
        : undefined);

    if (!baseListing) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    const updated: Listing = {
      ...baseListing,
      id,
      flagged,
      flagReason: flagged ? cleanReason : '',
      flaggedAt: flagged ? Date.now() : undefined,
      flaggedBy: flagged ? session.email : undefined,
      updatedAt: Date.now(),
      isSeeded: false,
    };

    const saved = upsertServerListing(updated);
    res.json({ listing: saved });
  });

  app.delete('/api/listings/:id', requireCsrf, (req, res) => {
    const session = readSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const id = String(req.params.id);
    const existing = getServerListingById(id);
    if (existing && !session.isAdmin && existing.ownerId !== session.uid) {
      res.status(403).json({ error: 'Forbidden: you can only delete your own listings.' });
      return;
    }
    if (!existing && !session.isAdmin) {
      res.status(403).json({ error: 'Forbidden: only administrators can delete this listing.' });
      return;
    }

    deleteServerListing(id);
    res.json({ ok: true, id });
  });

  app.post('/api/translate', requireCsrf, async (req, res) => {
    try {
      const { title, description, location, specsSummary } = req.body ?? {};
      if (
        typeof title !== 'string' ||
        title.trim().length < 2 ||
        title.trim().length > 180 ||
        typeof description !== 'string' ||
        description.trim().length < 5 ||
        description.trim().length > 3500 ||
        typeof location !== 'string' ||
        location.trim().length < 2 ||
        location.trim().length > 180
      ) {
        res.status(400).json({ error: 'Invalid listing translation payload.' });
        return;
      }

      const result = await translateListingContent({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        specsSummary: typeof specsSummary === 'string' ? specsSummary.trim().slice(0, 300) : '',
      });

      res.json(result);
    } catch (error) {
      console.error('Translation route error:', error);
      res.status(500).json({ error: 'Failed to translate listing content.' });
    }
  });

  app.post('/api/chat', requireCsrf, async (req, res) => {
    try {
      const { message, language, stats, listings: clientListings, history } = req.body ?? {};
      if (typeof message !== 'string' || message.trim().length < 1 || message.trim().length > 1000) {
        res.status(400).json({ error: 'Message must be between 1 and 1000 characters.' });
        return;
      }
      const lang: SupportedLang = VALID_LANGS.includes(language) ? language : 'zh';
      const safeStats = {
        jobs: Number(stats?.jobs) || 0,
        houses: Number(stats?.houses) || 0,
        cars: Number(stats?.cars) || 0,
        sales: Number(stats?.sales) || 0,
        total: Number(stats?.total) || 0,
        categories: typeof stats?.categories === 'object' && stats.categories ? stats.categories : {},
      };

      // Merge seed + server store + any client-passed Firestore listings
      const serverData = getAllServerListings();
      const deletedSet = new Set(serverData.deletedIds);
      const mergedMap = new Map<string, Listing>();
      for (const s of SEED_LISTINGS) {
        if (!deletedSet.has(s.id)) mergedMap.set(s.id, s);
      }
      for (const srv of serverData.listings) {
        if (!deletedSet.has(srv.id)) mergedMap.set(srv.id, srv);
      }
      if (Array.isArray(clientListings)) {
        for (const cl of clientListings.slice(0, 40)) {
          if (cl && typeof cl.id === 'string' && typeof cl.title === 'string' && !mergedMap.has(cl.id)) {
            mergedMap.set(cl.id, cl as Listing);
          }
        }
      }

      const safeHistory = Array.isArray(history)
        ? history
            .filter(
              (h): h is { role: 'user' | 'assistant'; text: string } =>
                Boolean(h && (h.role === 'user' || h.role === 'assistant') && typeof h.text === 'string')
            )
            .slice(-8)
        : [];

      const result = await generateAssistantReply({
        message: message.trim(),
        language: lang,
        stats: safeStats,
        listings: Array.from(mergedMap.values()),
        history: safeHistory,
      });

      res.json(result);
    } catch (error) {
      console.error('Chat route error:', error);
      res.status(500).json({ error: 'Assistant temporarily unavailable.' });
    }
  });

  app.post('/api/contact', requireCsrf, async (req, res) => {
    try {
      const { name, email, phone, subject, message, captchaToken, captchaAnswer } = req.body ?? {};

      if (!verifyCaptchaChallenge(captchaToken, captchaAnswer)) {
        res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
        return;
      }

      if (
        typeof name !== 'string' ||
        name.trim().length < 2 ||
        name.trim().length > 120 ||
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof subject !== 'string' ||
        subject.trim().length < 2 ||
        subject.trim().length > 160 ||
        typeof message !== 'string' ||
        message.trim().length < 10 ||
        message.trim().length > 3000
      ) {
        res.status(400).json({ error: 'Please complete all required contact fields accurately.' });
        return;
      }

      const cleanPhone = typeof phone === 'string' ? phone.trim().slice(0, 40) : '';
      const delivery = await sendContactEmail({
        name: name.trim(),
        email: email.trim(),
        phone: cleanPhone,
        subject: subject.trim(),
        message: message.trim(),
      });

      res.json({ ok: true, ...delivery });
    } catch (error) {
      console.error('Contact route error:', error);
      res.status(500).json({ error: 'Failed to process contact request.' });
    }
  });

  app.post('/api/listing-inquiry', requireCsrf, async (req, res) => {
    try {
      const {
        listingId,
        ownerEmail,
        ownerName,
        listingTitle,
        senderName,
        senderEmail,
        senderPhone,
        message,
        captchaToken,
        captchaAnswer,
      } = req.body ?? {};

      if (!verifyCaptchaChallenge(captchaToken, captchaAnswer)) {
        res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
        return;
      }

      if (
        typeof senderName !== 'string' ||
        senderName.trim().length < 2 ||
        senderName.trim().length > 120 ||
        typeof senderEmail !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim()) ||
        typeof message !== 'string' ||
        message.trim().length < 5 ||
        message.trim().length > 3000
      ) {
        res.status(400).json({ error: 'Please complete your name, valid email, and message.' });
        return;
      }

      const idStr = typeof listingId === 'string' ? listingId.trim() : '';
      const storedListing =
        (idStr ? getServerListingById(idStr) : undefined) ||
        (idStr ? SEED_LISTINGS.find((s) => s.id === idStr) : undefined);

      const resolvedOwnerEmail = (storedListing?.contactEmail || String(ownerEmail || '')).trim();
      const resolvedOwnerName = (storedListing?.ownerName || String(ownerName || 'Owner')).trim();
      const resolvedTitle = (storedListing?.title || String(listingTitle || 'JobSQUAD Listing')).trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedOwnerEmail)) {
        res.status(400).json({ error: 'Listing owner email address is unavailable.' });
        return;
      }

      const cleanPhone = typeof senderPhone === 'string' ? senderPhone.trim().slice(0, 40) : '';
      const delivery = await sendListingInquiryEmail({
        ownerEmail: resolvedOwnerEmail,
        ownerName: resolvedOwnerName,
        listingTitle: resolvedTitle,
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        senderPhone: cleanPhone,
        message: message.trim(),
      });

      res.json({ ok: true, ...delivery });
    } catch (error) {
      console.error('Listing inquiry route error:', error);
      res.status(500).json({ error: 'Failed to send listing inquiry email.' });
    }
  });

  // Never allow /api/* routes to fall through to SPA HTML index.html
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Express JSON error middleware
  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.error('API Error:', err);
      res.status(500).json({ error: 'Internal server error.' });
      return;
    }
    next(err);
  });

  const DEFAULT_PUBLIC_ORIGIN =
    'https://ais-pre-azkh2mfnufrlj2cmihgtle-1013138806688.europe-west2.run.app';

  function resolvePublicOrigin(req: express.Request): string {
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const host = (Array.isArray(rawHost) ? rawHost[0] : rawHost).split(',')[0].trim();
    const isLocalHost =
      !host ||
      host.startsWith('localhost') ||
      host.startsWith('127.0.0.1') ||
      host.startsWith('0.0.0.0');

    if (!isLocalHost) {
      const rawProto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const proto =
        (Array.isArray(rawProto) ? rawProto[0] : rawProto).split(',')[0].trim() || 'https';
      const effectiveProto = host.endsWith('.run.app') ? 'https' : proto;
      return `${effectiveProto}://${host}`;
    }

    const envAppUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
    if (envAppUrl.startsWith('http://') || envAppUrl.startsWith('https://')) {
      return envAppUrl;
    }

    return DEFAULT_PUBLIC_ORIGIN;
  }

  function injectSocialMetaOrigin(html: string, origin: string): string {
    const cleanOrigin = origin.replace(/\/+$/, '');
    return html.split(DEFAULT_PUBLIC_ORIGIN).join(cleanOrigin);
  }

  const distDir = path.resolve(__dirname, 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (process.env.NODE_ENV !== 'development' && fs.existsSync(distDir));
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.get('*', async (req, res, next) => {
      const reqPath = req.path || '/';
      const accept = String(req.headers.accept || '');
      const ua = String(req.headers['user-agent'] || '');
      const isBotCrawler =
        /bot|crawler|spider|facebookexternalhit|twitterbot|whatsapp|slack|discord|telegram|linkedin|embedly|pinterest/i.test(
          ua
        );
      const isDocumentRequest =
        reqPath === '/' ||
        (!reqPath.includes('.') &&
          !reqPath.startsWith('/api/') &&
          !reqPath.startsWith('/@') &&
          !reqPath.startsWith('/src/') &&
          !reqPath.startsWith('/assets/') &&
          !reqPath.startsWith('/node_modules/') &&
          (accept.includes('text/html') || isBotCrawler));

      if (!isDocumentRequest) {
        next();
        return;
      }

      try {
        const templatePath = path.resolve(__dirname, 'index.html');
        const template = fs.readFileSync(templatePath, 'utf8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, template);
        const withOrigin = injectSocialMetaOrigin(transformed, resolvePublicOrigin(req));
        res.status(200).set({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
          'Surrogate-Control': 'no-store',
          Vary: 'Host, X-Forwarded-Host, User-Agent',
        });
        res.end(withOrigin);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });

    app.use(vite.middlewares);
  } else {
    app.use(
      express.static(distDir, {
        index: false,
        setHeaders: (res, filePath) => {
          const baseName = path.basename(filePath);
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          } else if (
            filePath.includes(`${path.sep}assets${path.sep}`) &&
            !/[\\/]assets[\\/]aistudio[\\/]/.test(filePath) &&
            /-[A-Za-z0-9_-]{6,}\.(js|css|woff2?)$/.test(baseName)
          ) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          }
        },
      })
    );
    app.get('*', (req, res) => {
      const indexHtmlPath = path.join(distDir, 'index.html');
      const rawHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      const withOrigin = injectSocialMetaOrigin(rawHtml, resolvePublicOrigin(req));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('Vary', 'Host, X-Forwarded-Host, User-Agent');
      res.send(withOrigin);
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`JobSQUAD server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
