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
  deleteServerListing,
  getAllServerListings,
  getServerListingById,
  registerAccount,
  upsertServerListing,
} from './src/server/store.ts';
import type { Listing } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_LANGS: SupportedLang[] = ['zh', 'en', 'fr', 'es', 'dz', 'gsw'];

function getFirebaseApiKey(): string {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf8');
    const parsed = JSON.parse(raw) as { apiKey?: string };
    return parsed.apiKey || '';
  } catch {
    return '';
  }
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

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

  // Authentication Endpoints (Email/Password Registration & Login + Default Admin)
  app.get('/api/auth/me', (req, res) => {
    const session = readSessionFromRequest(req);
    if (!session) {
      res.json({ user: null });
      return;
    }
    res.json({
      user: {
        uid: session.uid,
        email: session.email,
        displayName: session.displayName,
        phone: session.phone,
        accountType: session.accountType,
        isAdmin: session.isAdmin,
      },
    });
  });

  app.post('/api/auth/register', requireCsrf, (req, res) => {
    try {
      const {
        displayName,
        email,
        phone,
        password,
        accountType,
        captchaToken,
        captchaAnswer,
      } = req.body ?? {};

      if (!verifyCaptchaChallenge(captchaToken, captchaAnswer)) {
        res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
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
      const { idToken } = req.body ?? {};
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
      const isAdminUser = Boolean(fbAccount.emailVerified) && normalizedEmail === 'wangchukjiks@gmail.com';
      const sessionToken = issueSessionCookie(req, res, {
        uid: fbAccount.localId,
        email: normalizedEmail,
        displayName: fbAccount.displayName || normalizedEmail.split('@')[0],
        phone: '',
        accountType: 'employer',
        isAdmin: isAdminUser,
      });

      res.json({
        ok: true,
        isAdmin: isAdminUser,
        sessionToken,
      });
    } catch (err) {
      console.error('Firebase session sync error:', err);
      res.status(500).json({ error: 'Failed to sync session.' });
    }
  });

  // Server-backed Listings CRUD (supports email/password accounts, synced Google sessions & admin management)
  app.get('/api/listings', (req, res) => {
    const session = readSessionFromRequest(req);
    const data = getAllServerListings();
    if (session && !session.isAdmin) {
      res.json({
        listings: data.listings.filter((item) => item.ownerId === session.uid),
        deletedIds: data.deletedIds,
      });
      return;
    }
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
      contactPhone: body.contactPhone.trim(),
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
      contactPhone: String(incoming.contactPhone || existing?.contactPhone || '').trim(),
      images:
        targetType === 'job'
          ? []
          : Array.isArray(incoming.images)
            ? incoming.images.slice(0, 3)
            : existing?.images || [],
      specs: incoming.specs || existing?.specs || {},
      translations: incoming.translations || existing?.translations || ({} as Listing['translations']),
      status: incoming.status === 'closed' ? 'closed' : 'active',
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      isSeeded: false,
    };

    const saved = upsertServerListing(merged);
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
      const { message, language, stats } = req.body ?? {};
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

      const result = await generateAssistantReply({
        message: message.trim(),
        language: lang,
        stats: safeStats,
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

  // Project archive download endpoint (both dev and production)
  const serveProjectZip = (_req: express.Request, res: express.Response) => {
    const publicZip = path.resolve(__dirname, 'public', 'jobsquad-project.zip');
    const distZip = path.resolve(__dirname, 'dist', 'jobsquad-project.zip');
    const zipPath = fs.existsSync(publicZip) ? publicZip : distZip;
    if (!fs.existsSync(zipPath)) {
      res.status(404).json({ error: 'Project zip archive not found.' });
      return;
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="jobsquad-project.zip"');
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(zipPath);
  };
  app.get('/jobsquad-project.zip', serveProjectZip);
  app.get('/api/download-project', serveProjectZip);

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

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`JobSQUAD server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
