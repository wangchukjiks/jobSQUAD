import { Mail, MapPin, Phone } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations.ts';
import { MobileAppControls } from './MobileAppControls.tsx';
import type { SupportedLang } from '../types/index.ts';

interface FooterProps {
  lang: SupportedLang;
  onOpenContact: () => void;
  onOpenLegal: (tab: 'terms' | 'privacy') => void;
}

export function Footer({ lang, onOpenContact, onOpenLegal }: FooterProps) {
  const t = UI_TEXT[lang];

  return (
    <footer className="bg-[#050C18] border-t border-slate-800/80 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-slate-800/80">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-lg bg-[#F8FAFC] px-3 py-1.5 border border-[#D9A438]/40">
              <img
                src="/assets/aistudio/job-squad-logo-2000px_8dfce4de.png"
                alt="JobSQUAD"
                referrerPolicy="no-referrer"
                className="h-9 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              {t.footerTagline}
            </p>
          </div>

          {/* Direct Contact Details */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-semibold text-slate-100">
              {t.footerContactHeading}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <a
                  href="mailto:contact.jobsquad@gmail.com"
                  target="_top"
                  className="inline-flex items-center gap-2 hover:text-[#D9A438] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#D9A438] shrink-0" />
                  <span>contact.jobsquad@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+33759163133"
                  className="inline-flex items-center gap-2 font-mono-num hover:text-[#D9A438] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#D9A438] shrink-0" />
                  <span>+33 7 59 16 31 33</span>
                </a>
              </li>
              <li className="inline-flex items-start gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-[#D9A438] shrink-0 mt-0.5" />
                <span>10 Voie Falguiere, Vitry Sur Seine, 94400, France</span>
              </li>
            </ul>
            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenContact}
                className="text-xs font-semibold text-[#D9A438] hover:underline cursor-pointer"
              >
                {t.contactUs} →
              </button>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-semibold text-slate-100">
              {t.footerSocialHeading}
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="px-3.5 py-2 rounded-lg border border-slate-800 bg-[#0B1628] text-xs font-medium text-slate-300 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="px-3.5 py-2 rounded-lg border border-slate-800 bg-[#0B1628] text-xs font-medium text-slate-300 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors"
              >
                X / Twitter
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="px-3.5 py-2 rounded-lg border border-slate-800 bg-[#0B1628] text-xs font-medium text-slate-300 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="px-3.5 py-2 rounded-lg border border-slate-800 bg-[#0B1628] text-xs font-medium text-slate-300 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://wa.me/33759163133"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="px-3.5 py-2 rounded-lg border border-slate-800 bg-[#0B1628] text-xs font-medium text-slate-300 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors"
              >
                WhatsApp
              </a>
            </div>
            <MobileAppControls lang={lang} />
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} JobSQUAD. {t.footerRights}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onOpenLegal('terms')}
              className="text-slate-300 hover:text-[#D9A438] underline-offset-4 hover:underline transition-colors cursor-pointer"
            >
              {t.legal.termsLink}
            </button>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onOpenLegal('privacy')}
              className="text-slate-300 hover:text-[#D9A438] underline-offset-4 hover:underline transition-colors cursor-pointer"
            >
              {t.legal.privacyLink}
            </button>
          </div>
          <p>10 Voie Falguiere, Vitry Sur Seine, 94400, France</p>
        </div>
      </div>
    </footer>
  );
}
