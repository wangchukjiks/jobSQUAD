import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogOut,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { UI_TEXT } from '../i18n/translations.ts';
import {
  deleteMyAccount,
  fetchCaptchaChallenge,
  fetchCurrentAuthUser,
  loginWithCredentials,
  logoutServerSession,
  registerWithDetails,
  syncFirebaseSession,
  updateMyProfile,
  verifyCaptchaAnswer,
} from '../lib/api.ts';
import {
  checkIsAdmin,
  deleteOwnFirebaseAccount,
  getUserProfile,
  saveUserProfile,
  signInWithGooglePopup,
  signOutUser,
} from '../lib/firebase.ts';
import { formatPhoneNumber } from '../lib/phone.ts';
import type { AccountType, SupportedLang, UserProfile } from '../types/index.ts';
import { CaptchaField } from './CaptchaField.tsx';
import { PhoneInput } from './PhoneInput.tsx';

interface AuthModalProps {
  open: boolean;
  lang: SupportedLang;
  firebaseUser: User | null;
  profile: UserProfile | null;
  onProfileSaved: (profile: UserProfile) => void;
  onAccountDeleted: () => void;
  onOpenLegal: (tab: 'terms' | 'privacy') => void;
  onClose: () => void;
}

const PROTECTED_ADMIN_EMAIL = 'wangchukjiks@gmail.com';

function mapGoogleAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const msg = err instanceof Error ? err.message : String(err || 'Google sign-in failed.');
  if (code === 'auth/unauthorized-domain' || msg.includes('auth/unauthorized-domain')) {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return `Google Sign-In is not yet authorized for "${host}". Add "${host}" under Firebase Console → Authentication → Settings → Authorized domains, or register / log in with Email & Password.`;
  }
  if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
    return 'Google Sign-In popup was blocked by your mobile or desktop browser. Allow popups (or open this link in Chrome/Safari instead of an in-app browser) and click "Continue with Google" again, or sign in with Email & Password.';
  }
  if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
    return 'Google Sign-In window was closed before completing sign-in. Please click "Continue with Google" to try again.';
  }
  if (code === 'auth/cancelled-popup-request' || msg.includes('cancelled-popup-request')) {
    return 'A previous Google Sign-In popup was still open. Please try again.';
  }
  if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
    return 'Google Sign-In provider is not enabled in Firebase Authentication.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with the same email address using another sign-in method.';
  }
  return msg;
}

export function AuthModal({
  open,
  lang,
  firebaseUser,
  profile,
  onProfileSaved,
  onAccountDeleted,
  onOpenLegal,
  onClose,
}: AuthModalProps) {
  const t = UI_TEXT[lang];
  const [mode, setMode] = useState<'register' | 'login'>('register');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('employer');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const resetFormFields = (nextMode: 'register' | 'login' = 'register') => {
    setMode(nextMode);
    setDisplayName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setAccountType('employer');
    setAcceptedTerms(false);
    setCaptchaQuestion('');
    setCaptchaToken('');
    setCaptchaAnswer('');
    setError('');
    setStatusMessage('');
    setConfirmDeleteOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    setError('');
    setStatusMessage('');
    setPassword('');
    setCaptchaQuestion('');
    setCaptchaToken('');
    setCaptchaAnswer('');
    setConfirmDeleteOpen(false);
    if (firebaseUser) {
      setDisplayName(profile?.displayName || firebaseUser.displayName || '');
      setEmail(firebaseUser.email || '');
      setPhone(profile?.phone ? formatPhoneNumber(profile.phone) : '');
      setAccountType(profile?.accountType || 'employer');
      setAcceptedTerms(Boolean(profile?.acceptedTerms || profile?.isAdmin));
    } else if (profile) {
      setDisplayName(profile.displayName || '');
      setEmail(profile.email || '');
      setPhone(profile.phone ? formatPhoneNumber(profile.phone) : '');
      setAccountType(profile.accountType || 'employer');
      setAcceptedTerms(Boolean(profile.acceptedTerms || profile.isAdmin));
    } else {
      resetFormFields('register');
    }
  }, [open, firebaseUser, profile]);

  if (!open) return null;

  const isCompleteProfile = Boolean(
    profile && profile.phone && (profile.acceptedTerms || profile.isAdmin || !firebaseUser)
  );
  const isLoggedInView = Boolean(profile && isCompleteProfile);
  const isGoogleNeedsProfile = Boolean(firebaseUser && !isCompleteProfile);
  const isPrimaryAdmin =
    (profile?.email || firebaseUser?.email || '').trim().toLowerCase() === PROTECTED_ADMIN_EMAIL;

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
    setStatusMessage('');
    setLoading(true);
    try {
      const fbUser = await signInWithGooglePopup();
      const adminFlag = await checkIsAdmin(fbUser);

      let existingProfile: UserProfile | null = null;
      try {
        existingProfile = await getUserProfile(fbUser.uid);
      } catch {
        existingProfile = null;
      }

      let syncedUser: UserProfile | null = null;
      try {
        const idToken = await fbUser.getIdToken();
        syncedUser = await syncFirebaseSession(
          idToken,
          existingProfile
            ? {
                uid: fbUser.uid,
                email: fbUser.email || existingProfile.email,
                displayName: existingProfile.displayName,
                phone: existingProfile.phone,
                accountType: existingProfile.accountType,
                acceptedTerms: existingProfile.acceptedTerms,
              }
            : {
                uid: fbUser.uid,
                email: fbUser.email || '',
                displayName: fbUser.displayName || undefined,
              }
        );
      } catch {
        // Continue even on static hosts
      }

      if (!existingProfile) {
        if (
          syncedUser &&
          syncedUser.email.toLowerCase() === (fbUser.email || '').toLowerCase()
        ) {
          existingProfile = syncedUser;
        } else {
          const srvProfile = await fetchCurrentAuthUser().catch(() => null);
          if (
            srvProfile &&
            srvProfile.email.toLowerCase() === (fbUser.email || '').toLowerCase()
          ) {
            existingProfile = srvProfile;
          }
        }
      }

      if (
        existingProfile &&
        existingProfile.phone &&
        (existingProfile.acceptedTerms || adminFlag || existingProfile.isAdmin)
      ) {
        const mergedProfile: UserProfile = {
          ...existingProfile,
          phone: formatPhoneNumber(existingProfile.phone),
          acceptedTerms: true,
          isAdmin: Boolean(adminFlag || existingProfile.isAdmin),
        };
        onProfileSaved(mergedProfile);
        onClose();
        return;
      }

      setDisplayName(existingProfile?.displayName || fbUser.displayName || '');
      setEmail(fbUser.email || '');
      setPhone(existingProfile?.phone ? formatPhoneNumber(existingProfile.phone) : '');
      setAccountType(existingProfile?.accountType || 'employer');
      setAcceptedTerms(Boolean(existingProfile?.acceptedTerms || adminFlag));
    } catch (err) {
      setError(mapGoogleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchGoogleAccount = async () => {
    setError('');
    setStatusMessage('');
    setLoading(true);
    try {
      await Promise.allSettled([signOutUser(), logoutServerSession()]);
      resetFormFields('register');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    if (!acceptedTerms) {
      setError(t.legal.checkboxRequiredError);
      return;
    }
    const formattedPhone = formatPhoneNumber(phone);
    if (formattedPhone.replace(/\D/g, '').length < 6) {
      setError('Please enter a valid mobile number with country code.');
      return;
    }
    setLoading(true);
    try {
      const registeredUser = await registerWithDetails({
        displayName: displayName.trim(),
        email: email.trim(),
        phone: formattedPhone,
        password,
        accountType,
        acceptedTerms: true,
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
    setStatusMessage('');
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
    setStatusMessage('');

    const formattedPhone = formatPhoneNumber(phone);
    if (displayName.trim().length < 2 || formattedPhone.replace(/\D/g, '').length < 6) {
      setError('Please enter your full name and valid mobile number.');
      return;
    }
    if (!acceptedTerms) {
      setError(t.legal.checkboxRequiredError);
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
        phone: formattedPhone,
        accountType,
        acceptedTerms: true,
        acceptedTermsAt: Date.now(),
      };
      await saveUserProfile(nextProfile);
      try {
        const idToken = await firebaseUser.getIdToken();
        await syncFirebaseSession(idToken, {
          uid: nextProfile.uid,
          email: nextProfile.email,
          displayName: nextProfile.displayName,
          phone: nextProfile.phone,
          accountType: nextProfile.accountType,
          acceptedTerms: true,
        });
      } catch {
        // Continue with Firestore-persisted profile
      }
      const adminFlag = await checkIsAdmin(firebaseUser);
      onProfileSaved({ ...nextProfile, isAdmin: adminFlag || profile?.isAdmin });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLoggedInProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    setStatusMessage('');

    const formattedPhone = formatPhoneNumber(phone);
    if (displayName.trim().length < 2 || formattedPhone.replace(/\D/g, '').length < 6) {
      setError('Please enter a valid display name and mobile number.');
      return;
    }

    setLoading(true);
    try {
      let updated: UserProfile = {
        ...profile,
        displayName: displayName.trim(),
        phone: formattedPhone,
        accountType,
        acceptedTerms: true,
      };

      if (firebaseUser) {
        await saveUserProfile({
          uid: firebaseUser.uid,
          displayName: updated.displayName,
          email: firebaseUser.email || profile.email,
          phone: updated.phone,
          accountType: updated.accountType,
          acceptedTerms: true,
        });
      }

      try {
        const srvUpdated = await updateMyProfile({
          displayName: updated.displayName,
          phone: updated.phone,
          accountType: updated.accountType,
        });
        updated = { ...updated, ...srvUpdated, isAdmin: profile.isAdmin || srvUpdated.isAdmin };
      } catch (err) {
        if (!firebaseUser) {
          throw err;
        }
        try {
          const idToken = await firebaseUser.getIdToken();
          await syncFirebaseSession(idToken, {
            uid: firebaseUser.uid,
            email: updated.email,
            displayName: updated.displayName,
            phone: updated.phone,
            accountType: updated.accountType,
            acceptedTerms: true,
          });
        } catch {
          // Firestore update succeeded
        }
      }

      onProfileSaved(updated);
      setStatusMessage(t.authModal.profileUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (isPrimaryAdmin) {
      setError(t.authModal.adminDeleteDisabled);
      return;
    }
    setError('');
    setDeletingAccount(true);
    try {
      if (firebaseUser) {
        await deleteOwnFirebaseAccount(firebaseUser.uid);
      }
      await deleteMyAccount().catch((err) => {
        if (!firebaseUser) throw err;
      });
      setConfirmDeleteOpen(false);
      onAccountDeleted();
      onClose();
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        setError(mapGoogleAuthError(err));
      } else {
        setError(err instanceof Error ? err.message : 'Unable to delete account.');
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  const modalHeaderTitle = isLoggedInView
    ? t.authModal.accountTitle
    : isGoogleNeedsProfile
      ? t.authModal.completeProfile
      : t.authModal.title;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="jobsquad-surface w-full max-w-md rounded-2xl overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-50">{modalHeaderTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82dvh] overflow-y-auto">
          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-xs text-rose-200 leading-relaxed">
              {error}
            </div>
          )}

          {statusMessage && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/45 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {isLoggedInView && profile ? (
            <div className="space-y-5">
              <div className="rounded-lg bg-[#0A1527] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300 flex items-center justify-between gap-2">
                <div className="min-w-0 truncate">
                  <span className="text-slate-400">{t.authModal.signedInAs}: </span>
                  <span className="font-medium text-[#D9A438]">{profile.email}</span>
                </div>
                {profile.isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#D9A438]/15 border border-[#D9A438]/40 text-[10px] font-semibold text-[#D9A438] shrink-0">
                    <UserCheck className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>

              <form onSubmit={handleUpdateLoggedInProfile} className="space-y-3.5">
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
                    {t.authModal.phone}
                  </label>
                  <PhoneInput value={phone} onChange={setPhone} required />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    {t.authModal.accountType}
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                  >
                    <option value="seeker">{t.authModal.seeker}</option>
                    <option value="employer">{t.authModal.employer}</option>
                    <option value="lister">{t.authModal.lister}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-sm hover:bg-[#E5B34B] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t.authModal.updateProfileBtn}</span>
                </button>
              </form>

              {firebaseUser && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSwitchGoogleAccount}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.authModal.switchAccountBtn}</span>
                </button>
              )}

              <div className="pt-4 border-t border-slate-800 space-y-3">
                {isPrimaryAdmin ? (
                  <p className="text-xs text-slate-400 text-center">
                    {t.authModal.adminDeleteDisabled}
                  </p>
                ) : !confirmDeleteOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-rose-500/40 bg-rose-950/30 text-xs font-semibold text-rose-300 hover:bg-rose-950/60 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t.authModal.deleteAccountBtn}</span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-rose-500/45 bg-rose-950/35 p-4 space-y-3">
                    <div className="flex items-start gap-2.5 text-rose-200">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold">{t.authModal.deleteAccountTitle}</p>
                        <p className="text-xs text-rose-200/85 leading-relaxed">
                          {t.authModal.deleteAccountConfirm}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={deletingAccount}
                        onClick={() => setConfirmDeleteOpen(false)}
                        className="px-3.5 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 hover:text-white cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="button"
                        disabled={deletingAccount}
                        onClick={handleConfirmDeleteAccount}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 disabled:opacity-60 cursor-pointer"
                      >
                        {deletingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{t.authModal.deleteAccountConfirmBtn}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : isGoogleNeedsProfile && firebaseUser ? (
            <form onSubmit={handleSaveGoogleProfile} className="space-y-4">
              <div className="rounded-lg bg-[#0A1527] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300 flex items-center justify-between gap-2">
                <div className="min-w-0 truncate">
                  <span className="text-slate-400">{t.authModal.signedInAs}: </span>
                  <span className="font-medium text-[#D9A438]">{firebaseUser.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchGoogleAccount}
                  className="text-[11px] font-medium text-slate-400 hover:text-[#D9A438] underline shrink-0 cursor-pointer"
                >
                  {t.signOut}
                </button>
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
                <PhoneInput value={phone} onChange={setPhone} required />
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

              <label className="flex items-start gap-2.5 rounded-lg border border-slate-700/80 bg-[#0A1527] px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-[#071121] accent-[#D9A438] cursor-pointer shrink-0"
                />
                <span>
                  {t.legal.checkboxPrefix}{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenLegal('terms');
                    }}
                    className="font-semibold text-[#D9A438] underline hover:text-[#E5B34B] cursor-pointer"
                  >
                    {t.legal.termsLink}
                  </button>{' '}
                  {t.legal.checkboxAnd}{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenLegal('privacy');
                    }}
                    className="font-semibold text-[#D9A438] underline hover:text-[#E5B34B] cursor-pointer"
                  >
                    {t.legal.privacyLink}
                  </button>
                  <span className="text-rose-400 ml-1" aria-hidden="true">*</span>
                </span>
              </label>

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

              {/* Register vs Log In Tab Switcher */}
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

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      {t.authModal.phone}
                    </label>
                    <PhoneInput value={phone} onChange={setPhone} required />
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

                  <label className="flex items-start gap-2.5 rounded-lg border border-slate-700/80 bg-[#0A1527] px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-[#071121] accent-[#D9A438] cursor-pointer shrink-0"
                    />
                    <span>
                      {t.legal.checkboxPrefix}{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenLegal('terms');
                        }}
                        className="font-semibold text-[#D9A438] underline hover:text-[#E5B34B] cursor-pointer"
                      >
                        {t.legal.termsLink}
                      </button>{' '}
                      {t.legal.checkboxAnd}{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenLegal('privacy');
                        }}
                        className="font-semibold text-[#D9A438] underline hover:text-[#E5B34B] cursor-pointer"
                      >
                        {t.legal.privacyLink}
                      </button>
                      <span className="text-rose-400 ml-1" aria-hidden="true">*</span>
                    </span>
                  </label>

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
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg border border-slate-600 bg-[#0A1527] text-slate-100 font-semibold text-sm hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer disabled:opacity-60"
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
