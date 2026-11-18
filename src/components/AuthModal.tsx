import React, { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { UI_TEXT } from '../i18n/translations.ts';
import {
  fetchCaptchaChallenge,
  loginWithCredentials,
  registerWithDetails,
  verifyCaptchaAnswer,
} from '../lib/api.ts';
import { saveUserProfile, signInWithGooglePopup } from '../lib/firebase.ts';
import type { AccountType, SupportedLang, UserProfile } from '../types/index.ts';
import { CaptchaField } from './CaptchaField.tsx';

interface AuthModalProps {
  open: boolean;
  lang: SupportedLang;
  firebaseUser: User | null;
  profile: UserProfile | null;
  onProfileSaved: (profile: UserProfile) => void;
  onClose: () => void;
}

export function AuthModal({
  open,
  lang,
  firebaseUser,
  profile,
  onProfileSaved,
  onClose,
}: AuthModalProps) {
  const t = UI_TEXT[lang];
  const [mode, setMode] = useState<'register' | 'login'>('register');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('employer');

  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetFormFields = (nextMode: 'register' | 'login' = 'register') => {
    setMode(nextMode);
    setDisplayName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setAccountType('employer');
    setCaptchaQuestion('');
    setCaptchaToken('');
    setCaptchaAnswer('');
    setError('');
  };

  useEffect(() => {
    if (!open) return;
    setError('');
    setPassword('');
    setCaptchaQuestion('');
    setCaptchaToken('');
    setCaptchaAnswer('');
    if (firebaseUser) {
      setDisplayName(profile?.displayName || firebaseUser.displayName || '');
      setEmail(firebaseUser.email || '');
      setPhone(profile?.phone || '');
      setAccountType(profile?.accountType || 'employer');
    } else if (profile) {
      setDisplayName(profile.displayName || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setAccountType(profile.accountType || 'employer');
    } else {
      resetFormFields('register');
    }
  }, [open, firebaseUser, profile]);

  if (!open) return null;

  const refreshCaptcha = async () => {
    try {
      const next = await fetchCaptchaChallenge();
      setCaptchaQuestion(next.question);
      setCaptchaToken(next.token);
      setCaptchaAnswer('');
    } catch {
      // Ignore refresh error
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGooglePopup();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      if (msg.includes('auth/unauthorized-domain')) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setError(
          `Google Sign-In is not yet authorized for "${host}". Add "${host}" under Firebase Console → Authentication → Settings → Authorized domains, or register / log in with Email & Password above.`
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const registeredUser = await registerWithDetails({
        displayName: displayName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        accountType,
        captchaToken,
        captchaAnswer,
      });
      onProfileSaved(registeredUser);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
      await refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await loginWithCredentials({
        email: email.trim(),
        password,
      });
      onProfileSaved(loggedInUser);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !firebaseUser.email) return;
    setError('');

    if (displayName.trim().length < 2 || phone.trim().length < 6) {
      setError('Please enter your full name and valid mobile number.');
      return;
    }

    setLoading(true);
    try {
      const ok = await verifyCaptchaAnswer(captchaToken, captchaAnswer);
      if (!ok) {
        setError('CAPTCHA verification failed.');
        await refreshCaptcha();
        setLoading(false);
        return;
      }

      const nextProfile: Omit<UserProfile, 'isAdmin'> = {
        uid: firebaseUser.uid,
        displayName: displayName.trim(),
        email: firebaseUser.email,
        phone: phone.trim(),
        accountType,
      };
      await saveUserProfile(nextProfile);
      onProfileSaved({ ...nextProfile, isAdmin: profile?.isAdmin });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="jobsquad-surface w-full max-w-md rounded-2xl overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-50">{t.authModal.title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-xs text-rose-200">
              {error}
            </div>
          )}

          {firebaseUser ? (
            <form onSubmit={handleSaveGoogleProfile} className="space-y-4">
              <div className="rounded-lg bg-[#0A1527] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300">
                <span className="text-slate-400">{t.authModal.signedInAs}: </span>
                <span className="font-medium text-[#D9A438]">{firebaseUser.email}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {t.authModal.displayName}
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">{t.authModal.phone}</label>
                <input
                  type="tel"
                  required
                  minLength={6}
                  maxLength={40}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 font-mono-num focus:outline-none focus:border-[#D9A438]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {t.authModal.accountType}
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                >
                  <option value="seeker">{t.authModal.seeker}</option>
                  <option value="employer">{t.authModal.employer}</option>
                  <option value="lister">{t.authModal.lister}</option>
                </select>
              </div>

              <CaptchaField
                label={t.captchaLabel}
                placeholder={t.captchaPlaceholder}
                question={captchaQuestion}
                token={captchaToken}
                answer={captchaAnswer}
                onChallengeLoaded={(q, tk) => {
                  setCaptchaQuestion(q);
                  setCaptchaToken(tk);
                }}
                onAnswerChange={setCaptchaAnswer}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-sm hover:bg-[#E5B34B] transition-colors cursor-pointer disabled:opacity-60"
              >
                {t.authModal.saveProfile}
              </button>
            </form>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t.authModal.subtitle}
              </p>

              {/* Register vs Log In Tab Switcher (Register shown by default!) */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0A1527] border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMode('register');
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'register'
                      ? 'bg-[#D9A438] text-[#071121]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t.authModal.registerTab}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMode('login');
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[#D9A438] text-[#071121]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t.authModal.loginTab}
                </button>
              </div>

              {mode === 'register' ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      {t.authModal.displayName}
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={120}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      {t.authModal.email}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">
                        {t.authModal.phone}
                      </label>
                      <input
                        type="tel"
                        required
                        minLength={6}
                        maxLength={40}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+33 6 00 00 00 00"
                        className="w-full px-3.5 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 font-mono-num focus:outline-none focus:border-[#D9A438]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">
                        {t.authModal.accountType}
                      </label>
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value as AccountType)}
                        className="w-full px-3 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                      >
                        <option value="seeker">{t.authModal.seeker}</option>
                        <option value="employer">{t.authModal.employer}</option>
                        <option value="lister">{t.authModal.lister}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      {t.authModal.password}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                    />
                  </div>

                  <CaptchaField
                    label={t.captchaLabel}
                    placeholder={t.captchaPlaceholder}
                    question={captchaQuestion}
                    token={captchaToken}
                    answer={captchaAnswer}
                    onChallengeLoaded={(q, tk) => {
                      setCaptchaQuestion(q);
                      setCaptchaToken(tk);
                    }}
                    onAnswerChange={setCaptchaAnswer}
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-sm hover:bg-[#E5B34B] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {t.authModal.createAccountBtn}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      {t.authModal.email}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      {t.authModal.password}
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-sm hover:bg-[#E5B34B] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {t.authModal.loginBtn}
                  </button>
                </form>
              )}

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-[#0F1C30] px-2.5 text-slate-400">
                    {t.authModal.orGoogle}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg border border-slate-600 bg-[#0A1527] text-slate-100 font-semibold text-sm hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#D9A438]" />
                <span>{t.authModal.googleBtn}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
