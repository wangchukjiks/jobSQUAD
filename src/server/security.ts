import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const EPHEMERAL_SECRET = crypto.randomBytes(32).toString('hex');

function getSigningSecret(): string {
  return process.env.CSRF_SECRET && process.env.CSRF_SECRET.length >= 16
    ? process.env.CSRF_SECRET
    : EPHEMERAL_SECRET;
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    try {
      const key = decodeURIComponent(part.slice(0, idx).trim());
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      if (key) cookies[key] = val;
    } catch {
      // Skip malformed cookie segments
    }
  }
  return cookies;
}

export function signPayload(payload: string): string {
  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isHttpsRequest(req: Request): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https'
  );
}

export function issueCsrfToken(req: Request, res: Response): string {
  const nonce = crypto.randomBytes(24).toString('hex');
  const issuedAt = Date.now().toString(36);
  const base = `${nonce}.${issuedAt}`;
  const sig = signPayload(base);
  const token = `${base}.${sig}`;
  const isSecure = isHttpsRequest(req);

  res.cookie('js_csrf', token, {
    httpOnly: true,
    sameSite: isSecure ? 'none' : 'lax',
    secure: isSecure,
    maxAge: 2 * 60 * 60 * 1000,
    path: '/',
  });

  return token;
}

export function verifySignedCsrfToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [nonce, issuedAtStr, sig] = parts;
  if (!nonce || !issuedAtStr || !sig) return false;

  const expectedSig = signPayload(`${nonce}.${issuedAtStr}`);
  if (!safeEqual(sig, expectedSig)) return false;

  const issuedAt = parseInt(issuedAtStr, 36);
  if (Number.isNaN(issuedAt) || Date.now() - issuedAt > 2 * 60 * 60 * 1000) {
    return false;
  }
  return true;
}

export function verifyCsrfToken(token: string | undefined, cookieToken: string | undefined): boolean {
  if (!verifySignedCsrfToken(token)) return false;
  if (cookieToken) {
    return safeEqual(token!, cookieToken);
  }
  // If browser iframe rules suppress third-party cookies, HMAC-signed X-CSRF-Token still prevents cross-origin forgery
  return true;
}

export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  const headerToken = req.headers['x-csrf-token'];
  const token = Array.isArray(headerToken) ? headerToken[0] : headerToken;
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies['js_csrf'];

  if (!verifyCsrfToken(token, cookieToken)) {
    res.status(403).json({ error: 'Invalid or expired CSRF token.' });
    return;
  }
  next();
}

export interface SessionPayload {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  accountType: 'seeker' | 'employer' | 'lister';
  isAdmin: boolean;
  exp: number;
}

export function issueSessionCookie(
  req: Request,
  res: Response,
  user: Omit<SessionPayload, 'exp'>
): string {
  const payloadObj: SessionPayload = {
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = signPayload(`sess:${encoded}`);
  const token = `${encoded}.${sig}`;
  const isSecure = isHttpsRequest(req);

  res.cookie('js_session', token, {
    httpOnly: true,
    sameSite: isSecure ? 'none' : 'lax',
    secure: isSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return token;
}

export function clearSessionCookie(req: Request, res: Response): void {
  const isSecure = isHttpsRequest(req);
  res.clearCookie('js_session', {
    httpOnly: true,
    sameSite: isSecure ? 'none' : 'lax',
    secure: isSecure,
    path: '/',
  });
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;
  const expected = signPayload(`sess:${encoded}`);
  if (!safeEqual(sig, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.uid || !parsed.email || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readSessionFromRequest(req: Request): SessionPayload | null {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies['js_session']) {
    const sess = verifySessionToken(cookies['js_session']);
    if (sess) return sess;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    return verifySessionToken(bearer);
  }
  return null;
}

export interface CaptchaChallenge {
  question: string;
  token: string;
}

export function createCaptchaChallenge(): CaptchaChallenge {
  const a = crypto.randomInt(2, 19);
  const b = crypto.randomInt(2, 15);
  const useSubtraction = a > b + 2 && crypto.randomInt(0, 2) === 1;
  const answer = useSubtraction ? a - b : a + b;
  const question = useSubtraction ? `${a} - ${b} = ?` : `${a} + ${b} = ?`;

  const nonce = crypto.randomBytes(12).toString('hex');
  const exp = Date.now() + 10 * 60 * 1000;
  const payload = `${nonce}:${exp}:${answer}`;
  const sig = signPayload(payload);
  const token = Buffer.from(`${payload}:${sig}`).toString('base64url');

  return { question, token };
}

export function verifyCaptchaChallenge(token: string | undefined, userAnswer: string | number | undefined): boolean {
  if (!token || userAnswer === undefined || userAnswer === null) return false;
  const parsedAnswer = String(userAnswer).trim();
  if (!/^-?\d{1,4}$/.test(parsedAnswer)) return false;

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return false;
    const [nonce, expStr, expectedAnswer, sig] = parts;
    const expectedSig = signPayload(`${nonce}:${expStr}:${expectedAnswer}`);
    if (!safeEqual(sig, expectedSig)) return false;
    const exp = Number(expStr);
    if (Number.isNaN(exp) || Date.now() > exp) return false;
    return safeEqual(parsedAnswer, expectedAnswer);
  } catch {
    return false;
  }
}

export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
