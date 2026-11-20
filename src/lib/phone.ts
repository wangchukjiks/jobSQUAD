export interface CountryDialOption {
  country: string;
  name: string;
  dialCode: string;
}

export const COUNTRY_DIAL_OPTIONS: CountryDialOption[] = [
  { country: 'FR', name: 'France', dialCode: '+33' },
  { country: 'CH', name: 'Switzerland', dialCode: '+41' },
  { country: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { country: 'US', name: 'United States', dialCode: '+1' },
  { country: 'CA', name: 'Canada', dialCode: '+1' },
  { country: 'ES', name: 'Spain', dialCode: '+34' },
  { country: 'DE', name: 'Germany', dialCode: '+49' },
  { country: 'IT', name: 'Italy', dialCode: '+39' },
  { country: 'BE', name: 'Belgium', dialCode: '+32' },
  { country: 'NL', name: 'Netherlands', dialCode: '+31' },
  { country: 'PT', name: 'Portugal', dialCode: '+351' },
  { country: 'AT', name: 'Austria', dialCode: '+43' },
  { country: 'LU', name: 'Luxembourg', dialCode: '+352' },
  { country: 'IE', name: 'Ireland', dialCode: '+353' },
  { country: 'BT', name: 'Bhutan', dialCode: '+975' },
  { country: 'IN', name: 'India', dialCode: '+91' },
  { country: 'NP', name: 'Nepal', dialCode: '+977' },
  { country: 'CN', name: 'China', dialCode: '+86' },
  { country: 'HK', name: 'Hong Kong', dialCode: '+852' },
  { country: 'TW', name: 'Taiwan', dialCode: '+886' },
  { country: 'JP', name: 'Japan', dialCode: '+81' },
  { country: 'KR', name: 'South Korea', dialCode: '+82' },
  { country: 'SG', name: 'Singapore', dialCode: '+65' },
  { country: 'AU', name: 'Australia', dialCode: '+61' },
  { country: 'NZ', name: 'New Zealand', dialCode: '+64' },
  { country: 'AE', name: 'UAE', dialCode: '+971' },
  // Worldwide alphabetical directory
  { country: 'AF', name: 'Afghanistan', dialCode: '+93' },
  { country: 'AL', name: 'Albania', dialCode: '+355' },
  { country: 'DZ', name: 'Algeria', dialCode: '+213' },
  { country: 'AD', name: 'Andorra', dialCode: '+376' },
  { country: 'AO', name: 'Angola', dialCode: '+244' },
  { country: 'AR', name: 'Argentina', dialCode: '+54' },
  { country: 'AM', name: 'Armenia', dialCode: '+374' },
  { country: 'AZ', name: 'Azerbaijan', dialCode: '+994' },
  { country: 'BH', name: 'Bahrain', dialCode: '+973' },
  { country: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { country: 'BY', name: 'Belarus', dialCode: '+375' },
  { country: 'BO', name: 'Bolivia', dialCode: '+591' },
  { country: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387' },
  { country: 'BR', name: 'Brazil', dialCode: '+55' },
  { country: 'BN', name: 'Brunei', dialCode: '+673' },
  { country: 'BG', name: 'Bulgaria', dialCode: '+359' },
  { country: 'KH', name: 'Cambodia', dialCode: '+855' },
  { country: 'CM', name: 'Cameroon', dialCode: '+237' },
  { country: 'CL', name: 'Chile', dialCode: '+56' },
  { country: 'CO', name: 'Colombia', dialCode: '+57' },
  { country: 'CR', name: 'Costa Rica', dialCode: '+506' },
  { country: 'HR', name: 'Croatia', dialCode: '+385' },
  { country: 'CY', name: 'Cyprus', dialCode: '+357' },
  { country: 'CZ', name: 'Czechia', dialCode: '+420' },
  { country: 'DK', name: 'Denmark', dialCode: '+45' },
  { country: 'DO', name: 'Dominican Republic', dialCode: '+1' },
  { country: 'EC', name: 'Ecuador', dialCode: '+593' },
  { country: 'EG', name: 'Egypt', dialCode: '+20' },
  { country: 'EE', name: 'Estonia', dialCode: '+372' },
  { country: 'ET', name: 'Ethiopia', dialCode: '+251' },
  { country: 'FI', name: 'Finland', dialCode: '+358' },
  { country: 'GE', name: 'Georgia', dialCode: '+995' },
  { country: 'GH', name: 'Ghana', dialCode: '+233' },
  { country: 'GR', name: 'Greece', dialCode: '+30' },
  { country: 'GT', name: 'Guatemala', dialCode: '+502' },
  { country: 'HU', name: 'Hungary', dialCode: '+36' },
  { country: 'IS', name: 'Iceland', dialCode: '+354' },
  { country: 'ID', name: 'Indonesia', dialCode: '+62' },
  { country: 'IR', name: 'Iran', dialCode: '+98' },
  { country: 'IQ', name: 'Iraq', dialCode: '+964' },
  { country: 'IL', name: 'Israel', dialCode: '+972' },
  { country: 'CI', name: 'Ivory Coast', dialCode: '+225' },
  { country: 'JM', name: 'Jamaica', dialCode: '+1' },
  { country: 'JO', name: 'Jordan', dialCode: '+962' },
  { country: 'KZ', name: 'Kazakhstan', dialCode: '+7' },
  { country: 'KE', name: 'Kenya', dialCode: '+254' },
  { country: 'KW', name: 'Kuwait', dialCode: '+965' },
  { country: 'KG', name: 'Kyrgyzstan', dialCode: '+996' },
  { country: 'LA', name: 'Laos', dialCode: '+856' },
  { country: 'LV', name: 'Latvia', dialCode: '+371' },
  { country: 'LB', name: 'Lebanon', dialCode: '+961' },
  { country: 'LI', name: 'Liechtenstein', dialCode: '+423' },
  { country: 'LT', name: 'Lithuania', dialCode: '+370' },
  { country: 'MO', name: 'Macau', dialCode: '+853' },
  { country: 'MY', name: 'Malaysia', dialCode: '+60' },
  { country: 'MV', name: 'Maldives', dialCode: '+960' },
  { country: 'MT', name: 'Malta', dialCode: '+356' },
  { country: 'MX', name: 'Mexico', dialCode: '+52' },
  { country: 'MD', name: 'Moldova', dialCode: '+373' },
  { country: 'MC', name: 'Monaco', dialCode: '+377' },
  { country: 'MN', name: 'Mongolia', dialCode: '+976' },
  { country: 'ME', name: 'Montenegro', dialCode: '+382' },
  { country: 'MA', name: 'Morocco', dialCode: '+212' },
  { country: 'MM', name: 'Myanmar', dialCode: '+95' },
  { country: 'NG', name: 'Nigeria', dialCode: '+234' },
  { country: 'MK', name: 'North Macedonia', dialCode: '+389' },
  { country: 'NO', name: 'Norway', dialCode: '+47' },
  { country: 'OM', name: 'Oman', dialCode: '+968' },
  { country: 'PK', name: 'Pakistan', dialCode: '+92' },
  { country: 'PA', name: 'Panama', dialCode: '+507' },
  { country: 'PY', name: 'Paraguay', dialCode: '+595' },
  { country: 'PE', name: 'Peru', dialCode: '+51' },
  { country: 'PH', name: 'Philippines', dialCode: '+63' },
  { country: 'PL', name: 'Poland', dialCode: '+48' },
  { country: 'PR', name: 'Puerto Rico', dialCode: '+1' },
  { country: 'QA', name: 'Qatar', dialCode: '+974' },
  { country: 'RO', name: 'Romania', dialCode: '+40' },
  { country: 'RU', name: 'Russia', dialCode: '+7' },
  { country: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { country: 'SN', name: 'Senegal', dialCode: '+221' },
  { country: 'RS', name: 'Serbia', dialCode: '+381' },
  { country: 'SK', name: 'Slovakia', dialCode: '+421' },
  { country: 'SI', name: 'Slovenia', dialCode: '+386' },
  { country: 'ZA', name: 'South Africa', dialCode: '+27' },
  { country: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { country: 'SE', name: 'Sweden', dialCode: '+46' },
  { country: 'TZ', name: 'Tanzania', dialCode: '+255' },
  { country: 'TH', name: 'Thailand', dialCode: '+66' },
  { country: 'TN', name: 'Tunisia', dialCode: '+216' },
  { country: 'TR', name: 'Turkey', dialCode: '+90' },
  { country: 'UA', name: 'Ukraine', dialCode: '+380' },
  { country: 'UY', name: 'Uruguay', dialCode: '+598' },
  { country: 'UZ', name: 'Uzbekistan', dialCode: '+998' },
  { country: 'VE', name: 'Venezuela', dialCode: '+58' },
  { country: 'VN', name: 'Vietnam', dialCode: '+84' },
];

const SORTED_BY_DIAL_LENGTH = [...COUNTRY_DIAL_OPTIONS].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
);

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // Europe
  'Europe/Paris': 'FR',
  'Europe/Zurich': 'CH',
  'Europe/London': 'GB',
  'Europe/Madrid': 'ES',
  'Atlantic/Canary': 'ES',
  'Europe/Berlin': 'DE',
  'Europe/Busingen': 'DE',
  'Europe/Rome': 'IT',
  'Europe/Brussels': 'BE',
  'Europe/Amsterdam': 'NL',
  'Europe/Lisbon': 'PT',
  'Atlantic/Madeira': 'PT',
  'Atlantic/Azores': 'PT',
  'Europe/Vienna': 'AT',
  'Europe/Luxembourg': 'LU',
  'Europe/Dublin': 'IE',
  'Europe/Warsaw': 'PL',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Athens': 'GR',
  'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU',
  'Europe/Bucharest': 'RO',
  'Europe/Sofia': 'BG',
  'Europe/Zagreb': 'HR',
  'Europe/Belgrade': 'RS',
  'Europe/Bratislava': 'SK',
  'Europe/Ljubljana': 'SI',
  'Europe/Tallinn': 'EE',
  'Europe/Riga': 'LV',
  'Europe/Vilnius': 'LT',
  'Europe/Kyiv': 'UA',
  'Europe/Kiev': 'UA',
  'Europe/Moscow': 'RU',
  'Europe/Istanbul': 'TR',
  'Asia/Istanbul': 'TR',
  'Europe/Monaco': 'MC',
  'Europe/Andorra': 'AD',
  'Europe/Vaduz': 'LI',
  'Europe/Malta': 'MT',
  'Atlantic/Reykjavik': 'IS',
  'Europe/Minsk': 'BY',
  'Europe/Chisinau': 'MD',
  'Europe/Tirane': 'AL',
  'Europe/Sarajevo': 'BA',
  'Europe/Podgorica': 'ME',
  'Europe/Skopje': 'MK',
  // Asia & Middle East
  'Asia/Thimphu': 'BT',
  'Asia/Thimbu': 'BT',
  'Asia/Shanghai': 'CN',
  'Asia/Chongqing': 'CN',
  'Asia/Harbin': 'CN',
  'Asia/Urumqi': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Macau': 'MO',
  'Asia/Taipei': 'TW',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Kathmandu': 'NP',
  'Asia/Katmandu': 'NP',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Singapore': 'SG',
  'Asia/Dubai': 'AE',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Saigon': 'VN',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Jakarta': 'ID',
  'Asia/Makassar': 'ID',
  'Asia/Jayapura': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Dhaka': 'BD',
  'Asia/Karachi': 'PK',
  'Asia/Colombo': 'LK',
  'Asia/Yangon': 'MM',
  'Asia/Rangoon': 'MM',
  'Asia/Phnom_Penh': 'KH',
  'Asia/Vientiane': 'LA',
  'Asia/Brunei': 'BN',
  'Asia/Ulaanbaatar': 'MN',
  'Asia/Riyadh': 'SA',
  'Asia/Qatar': 'QA',
  'Asia/Kuwait': 'KW',
  'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM',
  'Asia/Jerusalem': 'IL',
  'Asia/Amman': 'JO',
  'Asia/Beirut': 'LB',
  'Asia/Tehran': 'IR',
  'Asia/Baghdad': 'IQ',
  'Asia/Kabul': 'AF',
  'Asia/Tbilisi': 'GE',
  'Asia/Yerevan': 'AM',
  'Asia/Baku': 'AZ',
  'Asia/Almaty': 'KZ',
  'Asia/Tashkent': 'UZ',
  'Asia/Bishkek': 'KG',
  'Asia/Nicosia': 'CY',
  // Oceania
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Australia/Hobart': 'AU',
  'Australia/Darwin': 'AU',
  'Pacific/Auckland': 'NZ',
  // Americas
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Detroit': 'US',
  'America/Indiana/Indianapolis': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/Mexico_City': 'MX',
  'America/Cancun': 'MX',
  'America/Monterrey': 'MX',
  'America/Tijuana': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Rio_Branco': 'BR',
  'America/Manaus': 'BR',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Buenos_Aires': 'AR',
  'America/Santiago': 'CL',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Caracas': 'VE',
  'America/La_Paz': 'BO',
  'America/Asuncion': 'PY',
  'America/Montevideo': 'UY',
  'America/Guayaquil': 'EC',
  'America/Panama': 'PA',
  'America/Costa_Rica': 'CR',
  'America/Guatemala': 'GT',
  'America/Santo_Domingo': 'DO',
  'America/Jamaica': 'JM',
  'America/Puerto_Rico': 'PR',
  // Africa
  'Africa/Casablanca': 'MA',
  'Africa/Algiers': 'DZ',
  'Africa/Tunis': 'TN',
  'Africa/Cairo': 'EG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Accra': 'GH',
  'Africa/Dakar': 'SN',
  'Africa/Abidjan': 'CI',
  'Africa/Douala': 'CM',
  'Africa/Luanda': 'AO',
  'Africa/Dar_es_Salaam': 'TZ',
};

let cachedDetectedCountry: { countryCode: string; dialCode: string } | null = null;
let pendingGeoPromise: Promise<{ countryCode: string; dialCode: string }> | null = null;

export function getDialCodeForCountry(countryCode: string | undefined | null): string {
  if (!countryCode) return '+33';
  const upper = countryCode.trim().toUpperCase();
  const match = COUNTRY_DIAL_OPTIONS.find((c) => c.country === upper);
  return match ? match.dialCode : '+33';
}

export function getCountryForDialCode(dialCode: string | undefined | null): string {
  if (!dialCode) return 'FR';
  const match = COUNTRY_DIAL_OPTIONS.find((c) => c.dialCode === dialCode.trim());
  return match ? match.country : 'FR';
}

export function getInitialCountryGuess(): string {
  if (cachedDetectedCountry) return cachedDetectedCountry.countryCode;
  if (typeof window === 'undefined') return 'FR';

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return TIMEZONE_TO_COUNTRY[tz];
    }
  } catch {
    // Ignore Intl errors
  }

  try {
    const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const loc of locales) {
      if (!loc) continue;
      const parts = loc.split(/[-_]/);
      if (parts.length >= 2) {
        const region = parts[parts.length - 1].toUpperCase();
        const found = COUNTRY_DIAL_OPTIONS.find((c) => c.country === region);
        if (found) return found.country;
      }
    }
  } catch {
    // Ignore navigator errors
  }

  return 'FR';
}

export function getInitialDialCodeGuess(): string {
  if (cachedDetectedCountry) return cachedDetectedCountry.dialCode;
  return getDialCodeForCountry(getInitialCountryGuess());
}

async function fetchClientGeoIpCountry(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1800);
    const res = await fetch('https://ipwho.is/?fields=success,country_code', {
      signal: controller.signal,
      cache: 'no-store',
    });
    window.clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { success?: boolean; country_code?: string };
    if (
      data.success &&
      typeof data.country_code === 'string' &&
      /^[A-Za-z]{2}$/.test(data.country_code.trim())
    ) {
      return data.country_code.trim().toUpperCase();
    }
  } catch {
    // Ignore external lookup timeout or offline mode
  }
  return null;
}

export async function detectVisitorCountry(): Promise<{ countryCode: string; dialCode: string }> {
  if (cachedDetectedCountry) return cachedDetectedCountry;
  if (pendingGeoPromise) return pendingGeoPromise;

  pendingGeoPromise = (async () => {
    const browserCountry = getInitialCountryGuess();
    let serverAcceptLangCountry: string | null = null;

    try {
      const res = await fetch('/api/geo', { cache: 'no-store' });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = (await res.json()) as {
            countryCode?: string;
            dialCode?: string;
            fromProxyHeader?: boolean;
            detectedBy?: 'proxy' | 'geoip' | 'accept-language' | 'default';
          };

          const cleanCountry = data.countryCode?.trim().toUpperCase();
          if (
            cleanCountry &&
            (data.fromProxyHeader || data.detectedBy === 'proxy' || data.detectedBy === 'geoip')
          ) {
            cachedDetectedCountry = {
              countryCode: COUNTRY_DIAL_OPTIONS.some((c) => c.country === cleanCountry)
                ? cleanCountry
                : 'FR',
              dialCode: data.dialCode || getDialCodeForCountry(cleanCountry),
            };
            return cachedDetectedCountry;
          }

          if (data.detectedBy === 'accept-language' && cleanCountry) {
            serverAcceptLangCountry = cleanCountry;
          }
        }
      }
    } catch {
      // Ignore network/static errors
    }

    // Fallback to client public IP lookup so VPNs/proxies/direct Cloud Run access detect true access country
    const clientIpCountry = await fetchClientGeoIpCountry();
    if (clientIpCountry && COUNTRY_DIAL_OPTIONS.some((c) => c.country === clientIpCountry)) {
      cachedDetectedCountry = {
        countryCode: clientIpCountry,
        dialCode: getDialCodeForCountry(clientIpCountry),
      };
      return cachedDetectedCountry;
    }

    // Fallback to browser timezone/locale, then server accept-language, then FR
    const resolvedCountry =
      browserCountry !== 'FR'
        ? browserCountry
        : serverAcceptLangCountry &&
            COUNTRY_DIAL_OPTIONS.some((c) => c.country === serverAcceptLangCountry)
          ? serverAcceptLangCountry
          : browserCountry;

    cachedDetectedCountry = {
      countryCode: resolvedCountry,
      dialCode: getDialCodeForCountry(resolvedCountry),
    };
    return cachedDetectedCountry;
  })();

  return pendingGeoPromise;
}

export async function detectVisitorCountryDialCode(): Promise<string> {
  const result = await detectVisitorCountry();
  return result.dialCode;
}

/**
 * Formats subscriber digits strictly in `(0 00 00 00 00)` spacing from right to left:
 * - "759163133" -> "7 59 16 31 33"
 * - "612458910" -> "6 12 45 89 10"
 * - "445802914" -> "4 45 80 29 14"
 */
export function groupDigitsInTwos(digitsOnly: string): string {
  const clean = digitsOnly.replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{2})+(?!\d))/g, ' ');
}

export function splitPhoneNumber(
  rawPhone: string,
  fallbackDialCode = getInitialDialCodeGuess()
): { dialCode: string; subscriberDigits: string } {
  const trimmed = (rawPhone || '').trim();
  if (!trimmed) {
    return { dialCode: fallbackDialCode, subscriberDigits: '' };
  }

  let normalized = trimmed;
  if (normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`;
  }

  if (normalized.startsWith('+')) {
    const compact = `+${normalized.slice(1).replace(/[^\d]/g, '')}`;
    for (const opt of SORTED_BY_DIAL_LENGTH) {
      if (compact.startsWith(opt.dialCode)) {
        return {
          dialCode: opt.dialCode,
          subscriberDigits: compact.slice(opt.dialCode.length),
        };
      }
    }
    const genericMatch = trimmed.match(/^(\+\d{1,3})\s*(.*)$/);
    if (genericMatch) {
      return {
        dialCode: genericMatch[1],
        subscriberDigits: genericMatch[2].replace(/\D/g, ''),
      };
    }
  }

  return {
    dialCode: fallbackDialCode,
    subscriberDigits: trimmed.replace(/\D/g, ''),
  };
}

/**
 * Formats any mobile number strictly as:
 * "<countryCode> <0 00 00 00 00>"
 * Example: "+33 759163133" -> "+33 7 59 16 31 33"
 */
export function formatPhoneNumber(
  rawPhone: string,
  fallbackDialCode = getInitialDialCodeGuess()
): string {
  const trimmed = (rawPhone || '').trim();
  if (!trimmed) return '';
  const { dialCode, subscriberDigits } = splitPhoneNumber(trimmed, fallbackDialCode);
  const grouped = groupDigitsInTwos(subscriberDigits);
  return grouped ? `${dialCode} ${grouped}` : dialCode;
}
