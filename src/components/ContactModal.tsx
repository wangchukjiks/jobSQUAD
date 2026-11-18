import React, { useEffect, useState } from 'react';
import { CheckCircle2, Send, X } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations.ts';
import { fetchCaptchaChallenge, submitContactInquiry } from '../lib/api.ts';
import type { SupportedLang } from '../types/index.ts';
import { CaptchaField } from './CaptchaField.tsx';

interface ContactModalProps {
  open: boolean;
  lang: SupportedLang;
  onClose: () => void;
}

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
  const [success, setSuccess] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
        setError(result.note || 'Email could not be delivered by the mail service.');
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
      setError(err instanceof Error ? err.message : 'Unable to send message.');
      await refreshChallenge();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError('');
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
                OK
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t.contactModal.subtitle}
              </p>

              {error && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-xs text-rose-200">
                  {error}
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
