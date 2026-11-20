import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  CheckCircle2,
  Database,
  Edit3,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { UI_TEXT } from '../i18n/translations.ts';
import {
  deleteServerAdminUser,
  fetchServerAdminUsers,
  updateServerAdminUser,
} from '../lib/api.ts';
import {
  adminDeleteUserProfile,
  adminUpdateUserProfile,
  listAllUserProfiles,
} from '../lib/firebase.ts';
import { formatPhoneNumber } from '../lib/phone.ts';
import type { AccountType, SupportedLang, UserProfile } from '../types/index.ts';
import { PhoneInput } from './PhoneInput.tsx';

interface AdminUsersPanelProps {
  lang: SupportedLang;
  isAdmin: boolean;
  firebaseUser: User | null;
  currentUser: UserProfile | null;
  onCurrentUserUpdated?: (updated: UserProfile) => void;
  onBackToAll?: () => void;
}

type UserSource = 'firestore' | 'server' | 'synced';

interface ManagedUserRecord extends UserProfile {
  source: UserSource;
  hasFirestore?: boolean;
  firestoreUid?: string;
  hasServer?: boolean;
  serverUid?: string;
  authProvider?: 'local' | 'google';
  createdAt?: number;
  updatedAt?: number;
}

const PROTECTED_ADMIN_EMAIL = 'wangchukjiks@gmail.com';

export function AdminUsersPanel({
  lang,
  isAdmin,
  firebaseUser,
  currentUser,
  onCurrentUserUpdated,
  onBackToAll,
}: AdminUsersPanelProps) {
  const t = UI_TEXT[lang];
  const au = t.adminUsers;

  const [users, setUsers] = useState<ManagedUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [statusBanner, setStatusBanner] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit modal state
  const [editingUser, setEditingUser] = useState<ManagedUserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<AccountType>('employer');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirmation modal state
  const [deletingUser, setDeletingUser] = useState<ManagedUserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setLoadError('');
    try {
      const [serverResult, firestoreResult] = await Promise.allSettled([
        fetchServerAdminUsers(),
        firebaseUser ? listAllUserProfiles() : Promise.resolve([]),
      ]);

      const byEmail = new Map<string, ManagedUserRecord>();

      if (serverResult.status === 'fulfilled') {
        for (const u of serverResult.value) {
          const srv = u as typeof u & { authProvider?: 'local' | 'google' };
          const key = (srv.email || srv.uid).trim().toLowerCase();
          byEmail.set(key, {
            ...srv,
            phone: srv.phone ? formatPhoneNumber(srv.phone) : '',
            source: 'server',
            hasServer: true,
            serverUid: srv.uid,
            authProvider: srv.authProvider || 'local',
          });
        }
      }

      if (firestoreResult.status === 'fulfilled') {
        for (const u of firestoreResult.value) {
          const key = (u.email || u.uid).trim().toLowerCase();
          const existing = byEmail.get(key);
          if (existing) {
            byEmail.set(key, {
              ...existing,
              displayName: u.displayName || existing.displayName,
              phone: formatPhoneNumber(u.phone || existing.phone || ''),
              accountType: u.accountType || existing.accountType,
              acceptedTerms: Boolean(existing.acceptedTerms || u.acceptedTerms || existing.isAdmin || u.isAdmin),
              acceptedTermsAt: existing.acceptedTermsAt || u.acceptedTermsAt,
              isAdmin: Boolean(existing.isAdmin || u.isAdmin),
              source: 'synced',
              hasFirestore: true,
              firestoreUid: u.uid,
              hasServer: true,
              serverUid: existing.serverUid,
              authProvider: existing.authProvider || 'google',
              createdAt: existing.createdAt || u.createdAt,
              updatedAt: u.updatedAt || existing.updatedAt,
            });
          } else {
            byEmail.set(key, {
              ...u,
              phone: u.phone ? formatPhoneNumber(u.phone) : '',
              source: 'firestore',
              hasFirestore: true,
              firestoreUid: u.uid,
              authProvider: 'google',
            });
          }
        }
      }

      if (
        firestoreResult.status === 'rejected' &&
        serverResult.status === 'rejected'
      ) {
        setLoadError('Failed to load user records.');
      }

      const merged = Array.from(byEmail.values());
      merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setUsers(merged);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load user database.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, firebaseUser]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const roleLabel = (role: AccountType) => {
    if (role === 'seeker') return t.authModal.seeker;
    if (role === 'employer') return t.authModal.employer;
    return t.authModal.lister;
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.accountType.toLowerCase().includes(q) ||
        roleLabel(u.accountType).toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
      );
    });
  }, [users, searchTerm, lang]);

  const formatDate = (ms?: number) => {
    if (!ms) return '—';
    try {
      return new Intl.DateTimeFormat(lang === 'dz' || lang === 'bo' ? 'en-GB' : lang, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(new Date(ms));
    } catch {
      return new Date(ms).toLocaleDateString();
    }
  };

  const isProtectedUser = (u: ManagedUserRecord) => {
    return (
      u.email.trim().toLowerCase() === PROTECTED_ADMIN_EMAIL ||
      (currentUser?.uid && u.uid === currentUser.uid)
    );
  };

  const openEditModal = (u: ManagedUserRecord) => {
    setEditingUser(u);
    setEditName(u.displayName);
    setEditEmail(u.email);
    setEditPhone(u.phone ? formatPhoneNumber(u.phone) : '');
    setEditRole(u.accountType);
    setEditNewPassword('');
    setEditError('');
  };

  const handleSaveUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();
    const trimmedPhone = formatPhoneNumber(editPhone.trim());

    if (!trimmedName || !trimmedEmail || !trimmedEmail.includes('@')) {
      setEditError('Please provide a valid display name and email address.');
      return;
    }

    if (
      editingUser.hasServer &&
      editNewPassword.trim().length > 0 &&
      editNewPassword.trim().length < 8
    ) {
      setEditError('New password must be at least 8 characters.');
      return;
    }

    setEditSaving(true);
    setEditError('');

    try {
      let updatedRecord: ManagedUserRecord = {
        ...editingUser,
        displayName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        accountType: editRole,
        updatedAt: Date.now(),
      };

      if (editingUser.hasFirestore && firebaseUser && editingUser.firestoreUid) {
        await adminUpdateUserProfile(editingUser.firestoreUid, {
          displayName: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          accountType: editRole,
        });
      }

      if (editingUser.hasServer && editingUser.serverUid) {
        const saved = await updateServerAdminUser(editingUser.serverUid, {
          displayName: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          accountType: editRole,
          ...(editNewPassword.trim().length >= 8 ? { newPassword: editNewPassword.trim() } : {}),
        });
        updatedRecord = {
          ...updatedRecord,
          ...saved,
          updatedAt: Date.now(),
        };
      }

      setUsers((prev) =>
        prev.map((item) =>
          item.uid === editingUser.uid && item.email === editingUser.email
            ? updatedRecord
            : item
        )
      );

      if (
        currentUser &&
        (currentUser.uid === updatedRecord.uid ||
          currentUser.email.toLowerCase() === updatedRecord.email.toLowerCase()) &&
        onCurrentUserUpdated
      ) {
        onCurrentUserUpdated({
          ...currentUser,
          displayName: updatedRecord.displayName,
          email: updatedRecord.email,
          phone: updatedRecord.phone,
          accountType: updatedRecord.accountType,
        });
      }

      setEditingUser(null);
      setStatusBanner(au.updateSuccess);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Unable to update user.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      if (deletingUser.hasFirestore && firebaseUser && deletingUser.firestoreUid) {
        await adminDeleteUserProfile(deletingUser.firestoreUid);
      }
      if (deletingUser.hasServer && deletingUser.serverUid) {
        await deleteServerAdminUser(deletingUser.serverUid);
      }
      setUsers((prev) =>
        prev.filter(
          (item) => !(item.uid === deletingUser.uid && item.email === deletingUser.email)
        )
      );
      setDeletingUser(null);
      setStatusBanner(au.deleteSuccess);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <section
      id="admin-console"
      className="scroll-mt-36 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4"
    >
      <div className="jobsquad-surface rounded-2xl p-6 sm:p-7 border border-[#D9A438]/30 space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#D9A438]/15 border border-[#D9A438]/40 text-[#D9A438]">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {au.sectionTitle}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-[#D9A438]">
                {au.totalUsers}: {users.length}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">{au.sectionSubtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onBackToAll && (
              <button
                type="button"
                onClick={onBackToAll}
                className="px-3.5 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
              >
                {au.backToListings}
              </button>
            )}
            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D9A438] text-[#071121] text-xs font-semibold hover:bg-[#E5B34B] disabled:opacity-60 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{au.refreshBtn}</span>
            </button>
          </div>
        </div>

        {/* Search & Info Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={au.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#081325] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#D9A438] focus:outline-none"
            />
          </div>

          {!firebaseUser && (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/80 text-xs text-amber-300">
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>{au.firestoreNote}</span>
            </div>
          )}
        </div>

        {statusBanner && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner('')}
              className="text-emerald-300/80 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {loadError && (
          <div className="px-4 py-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
            {loadError}
          </div>
        )}

        {/* Loading / Empty / Table */}
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center gap-2.5 py-12 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-[#D9A438]" />
            <span>{au.loading}</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400 border border-dashed border-slate-800 rounded-xl">
            {au.emptyState}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#081325] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4 font-semibold">{au.colName}</th>
                    <th className="py-3 px-4 font-semibold">{au.colEmail}</th>
                    <th className="py-3 px-4 font-semibold">{au.colPhone}</th>
                    <th className="py-3 px-4 font-semibold">{au.colRole}</th>
                    <th className="py-3 px-4 font-semibold">{au.colSource}</th>
                    <th className="py-3 px-4 font-semibold">{au.colTerms}</th>
                    <th className="py-3 px-4 font-semibold">{au.colRegistered}</th>
                    <th className="py-3 px-4 font-semibold text-right">{au.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-[#0A162B]/60">
                  {filteredUsers.map((u) => {
                    const protectedUser = isProtectedUser(u);
                    return (
                      <tr
                        key={`${u.source}:${u.uid}`}
                        className="hover:bg-[#11223E]/60 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-100">
                          <div className="flex items-center gap-2">
                            <span>{u.displayName || '—'}</span>
                            {(u.isAdmin ||
                              u.email.toLowerCase() === PROTECTED_ADMIN_EMAIL) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#D9A438]/15 border border-[#D9A438]/40 text-[10px] font-semibold text-[#D9A438]">
                                <ShieldCheck className="w-3 h-3" />
                                {au.adminBadge}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{u.email}</td>
                        <td className="py-3 px-4 text-slate-300 tabular-nums whitespace-nowrap">
                          {u.phone ? formatPhoneNumber(u.phone) : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {roleLabel(u.accountType)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                              u.source === 'firestore' || u.source === 'synced' || u.authProvider === 'google'
                                ? 'bg-sky-950/60 border-sky-500/30 text-sky-300'
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            {u.source === 'firestore'
                              ? au.sourceFirestore
                              : u.source === 'synced'
                                ? `${au.sourceFirestore} + ${au.sourceServer}`
                                : u.authProvider === 'google'
                                  ? `Google · ${au.sourceServer}`
                                  : au.sourceServer}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              u.acceptedTerms
                                ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-950/50 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {u.acceptedTerms ? au.termsAccepted : au.termsPending}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {formatDate(u.createdAt || u.acceptedTermsAt)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{au.editBtn}</span>
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(protectedUser)}
                              onClick={() => {
                                setDeleteError('');
                                setDeletingUser(u);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-rose-500/30 text-rose-300 hover:bg-rose-950/60 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{au.deleteBtn}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredUsers.map((u) => {
                const protectedUser = isProtectedUser(u);
                return (
                  <div
                    key={`${u.source}:${u.uid}`}
                    className="rounded-xl border border-slate-800 bg-[#0A162B]/80 p-4 space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-100 text-sm flex items-center gap-1.5 flex-wrap">
                          <span>{u.displayName || '—'}</span>
                          {(u.isAdmin || u.email.toLowerCase() === PROTECTED_ADMIN_EMAIL) && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#D9A438]/15 border border-[#D9A438]/40 text-[10px] font-semibold text-[#D9A438]">
                              {au.adminBadge}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 mt-0.5 break-all">{u.email}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${
                          u.source === 'firestore' || u.source === 'synced' || u.authProvider === 'google'
                            ? 'bg-sky-950/60 border-sky-500/30 text-sky-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {u.source === 'firestore'
                          ? au.sourceFirestore
                          : u.source === 'synced'
                            ? `${au.sourceFirestore} + ${au.sourceServer}`
                            : u.authProvider === 'google'
                              ? `Google · ${au.sourceServer}`
                              : au.sourceServer}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-400">
                      <div>
                        <span className="text-slate-500">{au.colPhone}: </span>
                        <span className="text-slate-200">
                          {u.phone ? formatPhoneNumber(u.phone) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">{au.colRole}: </span>
                        <span className="text-slate-200">{roleLabel(u.accountType)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">{au.colTerms}: </span>
                        <span className="text-slate-200">
                          {u.acceptedTerms ? au.termsAccepted : au.termsPending}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">{au.colRegistered}: </span>
                        <span className="text-slate-200">
                          {formatDate(u.createdAt || u.acceptedTermsAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:border-[#D9A438] hover:text-[#D9A438] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{au.editBtn}</span>
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(protectedUser)}
                        onClick={() => {
                          setDeleteError('');
                          setDeletingUser(u);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-rose-500/30 text-rose-300 hover:bg-rose-950/60 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{au.deleteBtn}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="jobsquad-surface max-w-md w-full rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">{au.editModalTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{au.editModalSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.authModal.displayName}
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#081325] border border-slate-700 text-sm text-white focus:border-[#D9A438] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.authModal.email}
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#081325] border border-slate-700 text-sm text-white focus:border-[#D9A438] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.authModal.phone}
                </label>
                <PhoneInput value={editPhone} onChange={setEditPhone} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.authModal.accountType}
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AccountType)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#081325] border border-slate-700 text-sm text-white focus:border-[#D9A438] focus:outline-none"
                >
                  <option value="seeker">{t.authModal.seeker}</option>
                  <option value="employer">{t.authModal.employer}</option>
                  <option value="lister">{t.authModal.lister}</option>
                </select>
              </div>

              {editingUser.hasServer && editingUser.authProvider !== 'google' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {au.newPasswordLabel}
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder={au.newPasswordPlaceholder}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#081325] border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:border-[#D9A438] focus:outline-none"
                  />
                </div>
              )}

              {editError && (
                <div className="px-3 py-2 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D9A438] text-[#071121] text-xs font-semibold hover:bg-[#E5B34B] disabled:opacity-60 cursor-pointer"
                >
                  {editSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{au.saveUserBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="jobsquad-surface max-w-sm w-full rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">{au.deleteModalTitle}</h3>
            <p className="text-sm text-slate-300">{au.deleteModalConfirm}</p>
            <div className="px-3 py-2 rounded-lg bg-[#081325] border border-slate-800 text-xs text-slate-300">
              <div className="font-semibold text-white">{deletingUser.displayName}</div>
              <div className="text-slate-400">{deletingUser.email}</div>
            </div>
            {deleteError && (
              <div className="px-3 py-2 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDeleteUser}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 disabled:opacity-60 cursor-pointer"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{au.deleteBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
