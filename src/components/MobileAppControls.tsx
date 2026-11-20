import { useState, type MouseEvent } from 'react';
import { Download, Loader2, PlusSquare, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import type { SupportedLang } from '../types/index.ts';

interface MobileAppStrings {
  heading: string;
  apkButton: string;
  apkDownloading: string;
  apkSavedHint: string;
  apkFailedHint: string;
  installAppButton: string;
  installedLabel: string;
  platformHint: string;
  modalTitle: string;
  modalSubtitle: string;
  iosTitle: string;
  iosStep1: string;
  iosStep2: string;
  iosStep3: string;
  androidTitle: string;
  androidNote: string;
  closeLabel: string;
}

const APP_COPY: Record<SupportedLang, MobileAppStrings> = {
  zh: {
    heading: '手机应用与下载',
    apkButton: '下载 Android APK (7.6 MB)',
    apkDownloading: '正在下载 APK…',
    apkSavedHint: '已下载 JobSQUAD.apk。请打开手机“文件 / 下载”文件夹点击安装；如提示“未知来源”，请允许浏览器或文件管理器安装应用。',
    apkFailedHint: '无法获取有效 APK 文件，请刷新页面后重试，或点击右侧“安装应用”直接添加到主屏幕。',
    installAppButton: '安装应用 (iOS / Android)',
    installedLabel: '已安装至主屏幕',
    platformHint: 'Android 可直接下载完整离线包 APK 或一键安装；iOS 请通过 Safari 添加到主屏幕。',
    modalTitle: '在 iPhone 与 Android 上安装 JobSQUAD',
    modalSubtitle: 'APK 安装包仅适用于 Android；iOS 设备支持通过 Safari 一键安装为全屏独立应用。',
    iosTitle: 'iPhone / iPad (iOS Safari)',
    iosStep1: '1. 请使用苹果自带 Safari 浏览器打开本页面。',
    iosStep2: '2. 点击底部或顶部的“分享”图标，选择“添加到主屏幕”。',
    iosStep3: '3. 点击右上角“添加”，即可像原生应用一样全屏使用 JobSQUAD。',
    androidTitle: 'Android 手机 / 平板',
    androidNote: '下载签名安装包 (JobSQUAD.apk) 后在“文件 / 下载”中点击安装，或在 Chrome 菜单选择“安装应用”。',
    closeLabel: '关闭',
  },
  en: {
    heading: 'Mobile App',
    apkButton: 'Download Android APK (7.6 MB)',
    apkDownloading: 'Downloading APK…',
    apkSavedHint:
      'JobSQUAD.apk downloaded. Open your phone’s Files / Downloads folder and tap JobSQUAD.apk to install (allow "Install unknown apps" if prompted).',
    apkFailedHint:
      'Could not verify the APK file from this session. Refresh the page and try again, or use "Install App" directly.',
    installAppButton: 'Install App (iOS & Android)',
    installedLabel: 'App Installed',
    platformHint: 'Direct signed APK for Android; standalone Web App installation for iOS & Android.',
    modalTitle: 'Install JobSQUAD on iOS & Android',
    modalSubtitle:
      'Android supports direct .apk installation; Apple iOS installs JobSQUAD as a full-screen standalone app via Safari.',
    iosTitle: 'iPhone / iPad (iOS Safari)',
    iosStep1: '1. Open this page in Apple Safari on your iPhone or iPad.',
    iosStep2: '2. Tap the Share button and choose "Add to Home Screen".',
    iosStep3: '3. Tap "Add" to launch JobSQUAD as a standalone mobile app.',
    androidTitle: 'Android Devices',
    androidNote:
      'Download JobSQUAD.apk and open it from your phone’s Files / Downloads app, or tap "Install App" in Chrome.',
    closeLabel: 'Close',
  },
  fr: {
    heading: 'Application Mobile',
    apkButton: 'Télécharger APK Android (7,6 Mo)',
    apkDownloading: 'Téléchargement APK…',
    apkSavedHint:
      'JobSQUAD.apk téléchargé. Ouvrez le dossier Fichiers / Téléchargements de votre téléphone pour l’installer.',
    apkFailedHint:
      'Impossible de vérifier le fichier APK. Actualisez la page et réessayez, ou utilisez « Installer l’app ».',
    installAppButton: 'Installer l’app (iOS & Android)',
    installedLabel: 'Application installée',
    platformHint: 'APK direct pour Android ; installation autonome pour iOS (Safari) et Android.',
    modalTitle: 'Installer JobSQUAD sur iOS & Android',
    modalSubtitle:
      'Les fichiers .apk sont réservés à Android ; sur iOS, installez JobSQUAD en mode application autonome via Safari.',
    iosTitle: 'iPhone / iPad (Safari iOS)',
    iosStep1: '1. Ouvrez ce site dans Safari sur votre iPhone ou iPad.',
    iosStep2: '2. Touchez le bouton Partager puis « Sur l’écran d’accueil ».',
    iosStep3: '3. Confirmez « Ajouter » pour lancer JobSQUAD en plein écran.',
    androidTitle: 'Appareils Android',
    androidNote:
      'Téléchargez JobSQUAD.apk et ouvrez-le depuis Fichiers / Téléchargements, ou choisissez « Installer l’application » dans Chrome.',
    closeLabel: 'Fermer',
  },
  es: {
    heading: 'Aplicación Móvil',
    apkButton: 'Descargar APK Android (7,6 MB)',
    apkDownloading: 'Descargando APK…',
    apkSavedHint:
      'JobSQUAD.apk descargado. Abre la carpeta Archivos / Descargas de tu teléfono y tócalo para instalar.',
    apkFailedHint:
      'No se pudo verificar el archivo APK. Recarga la página e inténtalo de nuevo, o usa «Instalar App».',
    installAppButton: 'Instalar App (iOS y Android)',
    installedLabel: 'App instalada',
    platformHint: 'APK directo para Android; instalación independiente para iOS (Safari) y Android.',
    modalTitle: 'Instalar JobSQUAD en iOS y Android',
    modalSubtitle:
      'Los archivos .apk solo funcionan en Android; en iOS, instala JobSQUAD como app independiente desde Safari.',
    iosTitle: 'iPhone / iPad (Safari iOS)',
    iosStep1: '1. Abre este sitio en Safari desde tu iPhone o iPad.',
    iosStep2: '2. Pulsa el icono Compartir y selecciona «Añadir a pantalla de inicio».',
    iosStep3: '3. Pulsa «Añadir» para usar JobSQUAD a pantalla completa.',
    androidTitle: 'Dispositivos Android',
    androidNote:
      'Descarga JobSQUAD.apk y ábrelo desde Archivos / Descargas, o usa «Instalar aplicación» en Chrome.',
    closeLabel: 'Cerrar',
  },
  dz: {
    heading: 'འགྲུལ་འཕྲིན་མཉེན་ཆས།',
    apkButton: 'Android APK ཕབ་ལེན། (7.6 MB)',
    apkDownloading: 'APK ཕབ་ལེན་འབད་བའི་བསྒང་…',
    apkSavedHint: 'JobSQUAD.apk ཕབ་ལེན་འབད་ཚར་ཡི། Files / Downloads ནང་ལས་ཁ་ཕྱེ་སྟེ་གཞི་བཙུགས་འབད།',
    apkFailedHint: 'APK ཡིག་ཆ་བདེན་དཔྱད་འབད་མ་ཚུགས། ཤོག་ལེབ་གསར་བཏོན་འབད་དེ་ལོག་འབད་གནང་།',
    installAppButton: 'མཉེན་ཆས་གཞི་བཙུགས། (iOS & Android)',
    installedLabel: 'གཞི་བཙུགས་ཟིན།',
    platformHint: 'Android དོན་ལུ་ APK ཐད་ཀར་དང་ iOS དོན་ལུ་ Safari ཐོག་ལས་གཞི་བཙུགས་འབད།',
    modalTitle: 'iOS དང་ Android གུ་ JobSQUAD གཞི་བཙུགས།',
    modalSubtitle: 'APK འདི་ Android རྐྱངམ་གཅིག་གི་དོན་ལུ་ཨིན། iOS ནང་ Safari ཐོག་ལས་གཞི་བཙུགས་འབད་ཚུགས།',
    iosTitle: 'iPhone / iPad (iOS Safari)',
    iosStep1: '1. Apple Safari ནང་ཤོག་ལེབ་འདི་ཁ་ཕྱེ།',
    iosStep2: '2. Share ཨེབ་སྟེ་ "Add to Home Screen" གདམ་ཁ་རྐྱབས།',
    iosStep3: '3. "Add" ཨེབ་སྟེ་མཉེན་ཆས་བཟུམ་སྦེ་ལག་ལེན་འཐབ།',
    androidTitle: 'Android འཕྲུལ་ཆས།',
    androidNote: 'JobSQUAD.apk ཕབ་ལེན་འབད་དེ་ Downloads ནང་ལས་གཞི་བཙུགས་འབད།',
    closeLabel: 'ཁ་བསྡམས།',
  },
  gsw: {
    heading: 'Mobile App',
    apkButton: 'Android APK abelade (7.6 MB)',
    apkDownloading: 'APK wird abeglade…',
    apkSavedHint:
      'JobSQUAD.apk abeglade. Öffne uf dim Handy de Ordner «Dateien / Downloads» zum installiere.',
    apkFailedHint:
      'APK-Datei het nöd chönne prüeft werde. Siite neu lade und nomal probiere.',
    installAppButton: 'App installiere (iOS & Android)',
    installedLabel: 'App installiert',
    platformHint: 'Diräkts APK für Android; App-Installation für iOS (Safari) & Android.',
    modalTitle: 'JobSQUAD uf iOS & Android installiere',
    modalSubtitle:
      '.apk-Dateie laufed nume uf Android; uf iOS chasch JobSQUAD über Safari als eigenständigi App installiere.',
    iosTitle: 'iPhone / iPad (iOS Safari)',
    iosStep1: '1. Mach die Siite im Safari uf dim iPhone oder iPad uf.',
    iosStep2: '2. Tipp uf Teile und wähl «Zum Home-Bildschirm».',
    iosStep3: '3. Tipp uf «Hinzufügen», zum JobSQUAD im Vollbild z nutze.',
    androidTitle: 'Android Grät',
    androidNote:
      'Lad JobSQUAD.apk abe und öffne d Datei im Downloads-Ordner, oder wähl «App installiere» im Chrome.',
    closeLabel: 'Zuemache',
  },
  bo: {
    heading: 'ཁ་པར་མཉེན་ཆས།',
    apkButton: 'Android APK ཕབ་ལེན། (7.6 MB)',
    apkDownloading: 'APK ཕབ་ལེན་བྱེད་བཞིན་པ…',
    apkSavedHint: 'JobSQUAD.apk ཕབ་ལེན་ཟིན། ཁ་པར་གྱི་ Downloads ནང་ནས་ཁ་ཕྱེ་སྟེ་སྒྲིག་འཇུག་བྱོས།',
    apkFailedHint: 'APK ཡིག་ཆ་བརྟག་དཔྱད་བྱེད་མ་ཐུབ། དྲ་ངོས་གསར་འདོན་བྱས་ཏེ་བསྐྱར་དུ་ཚོད་ལྟ་བྱོས།',
    installAppButton: 'མཉེན་ཆས་སྒྲིག་འཇུག (iOS & Android)',
    installedLabel: 'སྒྲིག་འཇུག་ཟིན།',
    platformHint: 'Android ཆེད་དུ་ APK དང་ iOS ཆེད་དུ་ Safari བརྒྱུད་སྒྲིག་འཇུག་བྱེད་ཐུབ།',
    modalTitle: 'iOS དང་ Android ཐོག་ JobSQUAD སྒྲིག་འཇུག',
    modalSubtitle: 'APK ཡིག་ཆ་ Android ཁོ་ནར་སྤྱོད་ཐུབ། iOS ཐོག་ Safari བརྒྱུད་རང་དབང་མཉེན་ཆས་སུ་སྒྲིག་འཇུག་བྱོས།',
    iosTitle: 'iPhone / iPad (iOS Safari)',
    iosStep1: '1. iPhone ནང་ Safari བརྒྱུད་དྲ་ངོས་འདི་ཁ་ཕྱེས།',
    iosStep2: '2. Share མནན་ནས་ "Add to Home Screen" འདེམས།',
    iosStep3: '3. "Add" མནན་ནས་ཁ་པར་མཉེན་ཆས་བཞིན་བེད་སྤྱོད་བྱོས།',
    androidTitle: 'Android ཁ་པར།',
    androidNote: 'JobSQUAD.apk ཕབ་ལེན་བྱས་རྗེས་ Downloads ནང་ནས་སྒྲིག་འཇུག་བྱོས།',
    closeLabel: 'སྒོ་རྒྱག',
  },
};

interface MobileAppControlsProps {
  lang: SupportedLang;
  compact?: boolean;
}

export function MobileAppControls({ lang, compact = false }: MobileAppControlsProps) {
  const t = APP_COPY[lang] || APP_COPY.en;
  const { canNativePrompt, isInstalled, promptInstall } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  const [downloadingApk, setDownloadingApk] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const handleInstallClick = async () => {
    if (canNativePrompt) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') return;
    }
    setGuideOpen(true);
  };

  const handleApkDownload = async (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (downloadingApk) return;
    setDownloadingApk(true);
    setDownloadStatus(null);

    try {
      const res = await fetch(`/downloads/JobSQUAD.apk?v=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!res.ok || contentType.includes('text/html')) {
        throw new Error('Server returned HTML instead of APK package.');
      }

      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Verify genuine ZIP/APK PK header (0x50 0x4B 0x03 0x04) and valid binary size
      if (
        bytes.byteLength < 500_000 ||
        bytes[0] !== 0x50 ||
        bytes[1] !== 0x4b ||
        bytes[2] !== 0x03 ||
        bytes[3] !== 0x04
      ) {
        throw new Error('Downloaded file did not pass APK header validation.');
      }

      const apkBlob = new Blob([buffer], {
        type: 'application/vnd.android.package-archive',
      });
      const blobUrl = URL.createObjectURL(apkBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'JobSQUAD.apk';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);

      setDownloadStatus({ type: 'ok', text: t.apkSavedHint });
    } catch {
      setDownloadStatus({ type: 'err', text: t.apkFailedHint });
    } finally {
      setDownloadingApk(false);
    }
  };

  return (
    <>
      <div className={compact ? 'space-y-2' : 'space-y-2.5 pt-2'}>
        <p className="text-xs font-semibold text-slate-200">{t.heading}</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/downloads/JobSQUAD.apk"
            download="JobSQUAD.apk"
            onClick={handleApkDownload}
            aria-busy={downloadingApk}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#D9A438] text-[#071121] text-xs font-semibold hover:bg-[#E5B34B] transition-colors"
          >
            {downloadingApk ? (
              <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{downloadingApk ? t.apkDownloading : t.apkButton}</span>
          </a>

          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 bg-[#0B1628] text-xs font-medium text-slate-200 hover:border-[#D9A438] hover:text-[#D9A438] transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#D9A438] shrink-0" />
            <span>{isInstalled ? t.installedLabel : t.installAppButton}</span>
          </button>
        </div>

        {downloadStatus && (
          <p
            className={`text-[11px] leading-relaxed ${
              downloadStatus.type === 'ok' ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {downloadStatus.text}
          </p>
        )}

        {!compact && !downloadStatus && (
          <p className="text-[11px] text-slate-400 leading-relaxed">{t.platformHint}</p>
        )}
      </div>

      {guideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.modalTitle}
        >
          <div className="jobsquad-surface max-w-md w-full rounded-xl p-6 space-y-5 border border-slate-700/80 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">{t.modalTitle}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.modalSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                aria-label={t.closeLabel}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-lg border border-slate-700/80 bg-[#081325] p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#D9A438]">
                <Share className="w-4 h-4 shrink-0" />
                <span>{t.iosTitle}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                <li>{t.iosStep1}</li>
                <li className="flex items-start gap-1.5">
                  <span>{t.iosStep2}</span>
                  <PlusSquare className="w-3.5 h-3.5 text-[#D9A438] shrink-0 mt-0.5" />
                </li>
                <li>{t.iosStep3}</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-700/80 bg-[#081325] p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#D9A438]">
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>{t.androidTitle}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{t.androidNote}</p>
              <div>
                <a
                  href="/downloads/JobSQUAD.apk"
                  download="JobSQUAD.apk"
                  onClick={handleApkDownload}
                  aria-busy={downloadingApk}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#D9A438] text-[#071121] text-xs font-semibold hover:bg-[#E5B34B] transition-colors"
                >
                  {downloadingApk ? (
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{downloadingApk ? t.apkDownloading : t.apkButton}</span>
                </a>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
              >
                {t.closeLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
