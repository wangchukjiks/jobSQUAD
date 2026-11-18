import React, { useEffect, useState } from 'react';
import { Check, CheckCircle2, Mail, MapPin, Phone, Send, Share2, X } from 'lucide-react';
import { formatLocalizedPrice, UI_TEXT } from '../i18n/translations.ts';
import { fetchCaptchaChallenge, sendListingInquiry } from '../lib/api.ts';
import type { Listing, SupportedLang, UserProfile } from '../types/index.ts';
import { CaptchaField } from './CaptchaField.tsx';
import { ImageSlider } from './ImageSlider.tsx';

interface ListingDetailModalProps {
  listing: Listing | null;
  lang: SupportedLang;
  currentUser?: UserProfile | null;
  onClose: () => void;
}

export function ListingDetailModal({
  listing,
  lang,
  currentUser,
  onClose,
}: ListingDetailModalProps) {
  const t = UI_TEXT[lang];
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [message, setMessage] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');

  useEffect(() => {
    setActiveImageIdx(0);
    setComposerOpen(false);
    setError('');
    setSentSuccess(false);
    setDeliveryNote('');
    setCaptchaQuestion('');
    setCaptchaToken('');
    setCaptchaAnswer('');
    setSenderName(currentUser?.displayName || '');
    setSenderEmail(currentUser?.email || '');
    setSenderPhone(currentUser?.phone || '');
    if (listing) {
      const tr = listing.translations?.[lang];
      const localizedTitle = tr?.title || listing.title;
      const localizedLocation = tr?.location || listing.location;
      setMessage(
        `Hello ${listing.ownerName}, I am interested in "${localizedTitle}" (${localizedLocation}) on JobSQUAD. Please let me know if it is still available.`
      );
    } else {
      setMessage('');
    }
  }, [listing?.id, currentUser?.uid]);

  if (!listing) return null;

  const tr = listing.translations?.[lang];
  const title = tr?.title || listing.title;
  const description = tr?.description || listing.description;
  const location = tr?.location || listing.location;

  const period =
    listing.type === 'house'
      ? 'month'
      : listing.type === 'car'
        ? 'day'
        : listing.type === 'sale'
          ? 'once'
          : listing.specs?.pricePeriod || 'month';

  const mailSubject = encodeURIComponent(`[JobSQUAD] ${title}`);
  const mailBody = encodeURIComponent(
    `Hello ${listing.ownerName},\n\nI am reaching out regarding "${title}" (${location}) on JobSQUAD.`
  );

  const refreshChallenge = async () => {
    try {
      const next = await fetchCaptchaChallenge();
      setCaptchaQuestion(next.question);
      setCaptchaToken(next.token);
      setCaptchaAnswer('');
    } catch {
      // Ignore refresh failure
    }
  };

  const handleOpenComposer = () => {
    setComposerOpen((prev) => !prev);
    setError('');
    if (!composerOpen) {
      setSentSuccess(false);
      setDeliveryNote('');
      if (!senderName && currentUser?.displayName) setSenderName(currentUser.displayName);
      if (!senderEmail && currentUser?.email) setSenderEmail(currentUser.email);
      if (!senderPhone && currentUser?.phone) setSenderPhone(currentUser.phone);
    }
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDeliveryNote('');
    setSubmitting(true);

    try {
      const result = await sendListingInquiry({
        listingId: listing.id,
        ownerEmail: listing.contactEmail,
        ownerName: listing.ownerName,
        listingTitle: title,
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        senderPhone: senderPhone.trim(),
        message: message.trim(),
        captchaToken,
        captchaAnswer,
      });

      if (!result.delivered) {
        setError(result.note || 'Email could not be delivered to the owner right now.');
        await refreshChallenge();
        return;
      }

      setSentSuccess(true);
      setDeliveryNote(result.sandboxForwarded && result.note ? result.note : '');
      setCaptchaAnswer('');
      setCaptchaQuestion('');
      setCaptchaToken('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send email to owner.');
      await refreshChallenge();
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#post-${listing.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: location, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Ignore user cancel
    }
  };

  const isMarketplaceOrRental = listing.type === 'house' || listing.type === 'car' || listing.type === 'sale';
  const mobileLabel = listing.type === 'sale' ? t.sellerMobile : t.ownerMobile;
  const emailBtnLabel =
    listing.type === 'job'
      ? t.sendEmail
      : listing.type === 'sale'
        ? t.emailSeller
        : t.emailOwner;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="jobsquad-surface w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
          <div className="text-xs text-slate-400">
            <span className="text-[#D9A438] font-medium">
              {t.categories[listing.category] || listing.category}
            </span>
            <span aria-hidden="true"> · </span>
            <span>{t.specsLabels.postedBy}: {listing.ownerName}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {listing.images.length > 0 && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <ImageSlider
                  images={listing.images}
                  alt={title}
                  aspectClass="aspect-[16/10]"
                  activeIndex={activeImageIdx}
                  onIndexChange={setActiveImageIdx}
                />
              </div>
              {listing.images.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-20 h-14 rounded-lg overflow-hidden border transition-colors shrink-0 cursor-pointer ${
                        idx === activeImageIdx
                          ? 'border-[#D9A438]'
                          : 'border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${title} ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <h3 id="detail-modal-title" className="text-xl sm:text-2xl font-bold text-slate-50">
                {title}
              </h3>
              <p className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-[#D9A438]" />
                <span>{location}</span>
              </p>
            </div>
            {listing.type !== 'job' && (
              <div className="text-2xl font-bold font-mono-num text-[#D9A438] shrink-0">
                {formatLocalizedPrice(listing.priceEur, lang, period)}
              </div>
            )}
          </div>

          {/* Structured Specs Grid */}
          {listing.type === 'house' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-[#0A1527] border border-slate-800 p-4 text-xs">
              <div>
                <p className="text-slate-400">{t.specsLabels.bedrooms}</p>
                <p className="font-semibold font-mono-num text-slate-100 mt-0.5">
                  {listing.specs?.bedrooms ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">{t.specsLabels.bathrooms}</p>
                <p className="font-semibold font-mono-num text-slate-100 mt-0.5">
                  {listing.specs?.bathrooms ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">{t.specsLabels.area}</p>
                <p className="font-semibold font-mono-num text-slate-100 mt-0.5">
                  {listing.specs?.areaSqm ? `${listing.specs.areaSqm} m²` : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">{t.specsLabels.furnished}</p>
                <p className="font-semibold text-slate-100 mt-0.5">
                  {listing.specs?.furnished ? t.specsLabels.yes : t.specsLabels.no}
                </p>
              </div>
            </div>
          )}

          {listing.type === 'car' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-[#0A1527] border border-slate-800 p-4 text-xs">
              <div>
                <p className="text-slate-400">{t.specsLabels.year}</p>
                <p className="font-semibold font-mono-num text-slate-100 mt-0.5">
                  {listing.specs?.year ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">{t.specsLabels.transmission}</p>
                <p className="font-semibold text-slate-100 mt-0.5">
                  {listing.specs?.transmission || '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">{t.specsLabels.fuel}</p>
                <p className="font-semibold text-slate-100 mt-0.5">
                  {listing.specs?.fuel || '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">{t.specsLabels.seats}</p>
                <p className="font-semibold font-mono-num text-slate-100 mt-0.5">
                  {listing.specs?.seats ?? '—'}
                </p>
              </div>
            </div>
          )}

          {listing.type === 'sale' && (
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#0A1527] border border-slate-800 p-4 text-xs">
              <div>
                <p className="text-slate-400">{t.specsLabels.brand}</p>
                <p className="font-semibold text-slate-100 mt-0.5">
                  {listing.specs?.brand || '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">{t.specsLabels.condition}</p>
                <p className="font-semibold text-slate-100 mt-0.5">
                  {listing.specs?.condition || '—'}
                </p>
              </div>
            </div>
          )}

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line">
            {description}
          </p>

          {/* Non-clickable Mobile Number Label + Direct Email Composer */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            {isMarketplaceOrRental && (
              <div className="rounded-xl bg-[#0A1527] border border-[#D9A438]/35 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-400">{mobileLabel}</p>
                  <div
                    aria-label={`${mobileLabel}: ${listing.contactPhone}`}
                    className="inline-flex items-center gap-2 text-base font-bold font-mono-num text-[#D9A438] select-text"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{listing.contactPhone}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleOpenComposer}
                aria-expanded={composerOpen}
                className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-sm hover:bg-[#E5B34B] transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>{emailBtnLabel}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-200 text-sm font-medium hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t.linkCopied}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>{t.sharePost}</span>
                  </>
                )}
              </button>
            </div>

            {composerOpen && (
              <div className="rounded-xl border border-slate-700/80 bg-[#0A1527] p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">{emailBtnLabel}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {listing.ownerName} · {listing.contactEmail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setComposerOpen(false)}
                    aria-label="Close email form"
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {sentSuccess ? (
                  <div className="py-4 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {t.contactModal.success}
                    </p>
                    {deliveryNote && (
                      <p className="text-xs text-amber-300/90 bg-amber-950/30 border border-amber-500/30 rounded-lg p-3 leading-relaxed">
                        {deliveryNote}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSentSuccess(false);
                        setDeliveryNote('');
                        setComposerOpen(false);
                      }}
                      className="px-5 py-2 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-xs hover:bg-[#E5B34B] transition-colors cursor-pointer"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendInquiry} className="space-y-3.5">
                    {error && (
                      <div className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-200">
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-300">
                          {t.contactModal.name}
                        </label>
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={120}
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#0F1D33] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-300">
                          {t.contactModal.email}
                        </label>
                        <input
                          type="email"
                          required
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#0F1D33] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">
                        {t.contactModal.phone}
                      </label>
                      <input
                        type="tel"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="+33 7 59 16 31 33"
                        className="w-full px-3 py-2 rounded-lg bg-[#0F1D33] border border-slate-700 text-sm text-slate-100 font-mono-num focus:outline-none focus:border-[#D9A438]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">
                        {t.contactModal.message}
                      </label>
                      <textarea
                        required
                        minLength={5}
                        maxLength={3000}
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#0F1D33] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
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

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <a
                        href={`mailto:${listing.contactEmail}?subject=${mailSubject}&body=${mailBody}`}
                        className="text-xs text-slate-400 hover:text-[#D9A438] underline"
                      >
                        {listing.contactEmail}
                      </a>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-sm hover:bg-[#E5B34B] transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>{submitting ? t.contactModal.sending : t.contactModal.submit}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
