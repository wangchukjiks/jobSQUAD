import { useState } from 'react';
import { Download, Mail, MapPin, Phone } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations.ts';
import type { SupportedLang } from '../types/index.ts';

interface FooterProps {
  lang: SupportedLang;
  onOpenContact: () => void;
}

export function Footer({ lang, onOpenContact }: FooterProps) {
  const t = UI_TEXT[lang];
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const handleDownloadProject = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      const res = await fetch('/api/download-project', { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Archive unavailable.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jobsquad-project.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setDownloadError('Download blocked in embedded preview — use the AI Studio Download Project button in the top bar.');
    } finally {
      setDownloading(false);
    }
  };

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
            <div>
              <button
                type="button"
                onClick={handleDownloadProject}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#D9A438]/45 bg-[#0B1628] text-xs font-semibold text-[#D9A438] hover:bg-[#13223A] transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? 'Preparing ZIP...' : 'Download Source (.zip)'}</span>
              </button>
              {downloadError && (
                <p className="mt-2 text-xs text-amber-300 leading-relaxed max-w-xs">
                  {downloadError}
                </p>
              )}
            </div>
          </div>

          {/* Direct Contact Details */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-semibold text-slate-100">
              {t.footerContactHeading}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <a
                  href="mailto:jigsonbusyness@gmail.com"
                  className="inline-flex items-center gap-2 hover:text-[#D9A438] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#D9A438] shrink-0" />
                  <span>jigsonbusyness@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+33759163133"
                  className="inline-flex items-center gap-2 font-mono-num hover:text-[#D9A438] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#D9A438] shrink-0" />
                  <span>+33 759163133</span>
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
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} JobSQUAD. {t.footerRights}</p>
          <p>10 Voie Falguiere, Vitry Sur Seine, 94400, France</p>
        </div>
      </div>
    </footer>
  );
}
