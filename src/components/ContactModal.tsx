import React, { useEffect, useState } from 'react';
import { Check, CheckCircle2, Copy, ExternalLink, Mail, Send, X } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations.ts';
import { fetchCaptchaChallenge, submitContactInquiry } from '../lib/api.ts';
import type { SupportedLang } from '../types/index.ts';
import { CaptchaField } from './CaptchaField.tsx';

interface ContactModalProps {
  open: boolean;
  lang: SupportedLang;
  onClose: () => void;
}

const CONTACT_EMAIL = 'contact.jobsquad@gmail.com';

export function ContactModal({ open, lang, onClose }: ContactModalProps) {
  const t = UI_TEXT[lang];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fallbackUrls, setFallbackUrls] = useState<{ mailto: string; gmail: string } | null>(null);
  const [copiedFallback, setCopiedFallback] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setFallbackUrls(null);
    setCopiedFallback(false);
    setSuccess(false);
    setDeliveryNote('');
    setCaptchaQuestion('');
    setCaptchaToken('');
    setCaptchaAnswer('');
  }, [open]);

  if (!open) return null;

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

  const buildFallbackUrls = () => {
    const mailtoSubject = encodeURIComponent(`[JobSQUAD Contact] ${subject.trim() || 'Inquiry'}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\nPhone: ${phone.trim() || 'N/A'}\n\n${message.trim()}`
    );
    return {
      mailto: `mailto:${CONTACT_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`,
      gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}&su=${mailtoSubject}&body=${mailtoBody}`,
    };
  };

  const handleCopyFallback = async () => {
    const content = `To: ${CONTACT_EMAIL}\nSubject: [JobSQUAD Contact] ${subject.trim()}\nFrom: ${name.trim()} (${email.trim()}${phone.trim() ? `, ${phone.trim()}` : ''})\n\n${message.trim()}`;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFallback(true);
      setTimeout(() => setCopiedFallback(false), 2400);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFallbackUrls(null);
    setCopiedFallback(false);
    setDeliveryNote('');
    setSubmitting(true);

    try {
      const result = await submitContactInquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        message: message.trim(),
        captchaToken,
        captchaAnswer,
      });

      if (!result.delivered) {
        const computed = buildFallbackUrls();
        setError(result.note || 'Email could not be delivered by the mail service.');
        setFallbackUrls({
          mailto: result.mailtoUrl || computed.mailto,
          gmail: result.gmailUrl || computed.gmail,
        });
        await refreshChallenge();
        return;
      }

      setSuccess(true);
      setDeliveryNote(result.sandboxForwarded && result.note ? result.note : '');
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      setCaptchaAnswer('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to send message.';
      setError(msg);
      if (!/captcha|complete all required/i.test(msg)) {
        setFallbackUrls(buildFallbackUrls());
      }
      await refreshChallenge();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError('');
    setFallbackUrls(null);
    setDeliveryNote('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="jobsquad-surface w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-50">{t.contactModal.title}</h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="py-6 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <p className="text-sm text-slate-200 leading-relaxed">{t.contactModal.success}</p>
              {deliveryNote && (
                <p className="text-xs text-amber-300/90 bg-amber-950/30 border border-amber-500/30 rounded-lg p-3 leading-relaxed">
                  {deliveryNote}
                </p>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-sm hover:bg-[#E5B34B] transition-colors cursor-pointer"
              >
                {t.ok}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t.contactModal.subtitle}
              </p>

              {error && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-950/35 px-4 py-3 text-xs text-amber-100 space-y-3">
                  <p className="leading-relaxed">{error}</p>
                  {fallbackUrls && (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={fallbackUrls.gmail}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#D9A438] text-[#071121] font-semibold hover:bg-[#E5B34B] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Gmail</span>
                      </a>
                      <a
                        href={fallbackUrls.mailto}
                        target="_top"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-600 bg-[#0A1527] text-slate-100 font-medium hover:border-[#D9A438] hover:text-[#D9A438] transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Open Email App</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyFallback}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-700 bg-[#0A1527] text-slate-200 font-medium hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer"
                      >
                        {copiedFallback ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Message</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">{t.contactModal.name}</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">{t.contactModal.email}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">{t.contactModal.phone}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 7 59 16 31 33"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 font-mono-num focus:outline-none focus:border-[#D9A438]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">{t.contactModal.subject}</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={160}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">{t.contactModal.message}</label>
                <textarea
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
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
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-sm hover:bg-[#E5B34B] transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? t.contactModal.sending : t.contactModal.submit}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
