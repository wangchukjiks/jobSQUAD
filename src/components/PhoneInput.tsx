import { useEffect, useRef, useState } from 'react';
import {
  COUNTRY_DIAL_OPTIONS,
  detectVisitorCountry,
  getCountryForDialCode,
  getDialCodeForCountry,
  getInitialCountryGuess,
  groupDigitsInTwos,
  splitPhoneNumber,
} from '../lib/phone.ts';

interface PhoneInputProps {
  value: string;
  onChange: (formattedPhone: string) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  className?: string;
  id?: string;
}

export function PhoneInput({
  value,
  onChange,
  required = false,
  minLength = 6,
  maxLength = 40,
  className = '',
  id,
}: PhoneInputProps) {
  const [detectedCountry, setDetectedCountry] = useState<string>(() =>
    getInitialCountryGuess()
  );
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    const trimmed = (value || '').trim();
    if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
      const parsedInit = splitPhoneNumber(trimmed, getDialCodeForCountry(getInitialCountryGuess()));
      return COUNTRY_DIAL_OPTIONS.some((o) => o.dialCode === parsedInit.dialCode)
        ? getCountryForDialCode(parsedInit.dialCode)
        : `CUSTOM:${parsedInit.dialCode}`;
    }
    return getInitialCountryGuess();
  });

  const hasManualSelectionRef = useRef(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    let active = true;
    void detectVisitorCountry().then(({ countryCode }) => {
      if (!active) return;
      setDetectedCountry(countryCode);
      if (!hasManualSelectionRef.current && !(value || '').trim()) {
        setSelectedCountry(countryCode);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const trimmed = (value || '').trim();
    const prevTrimmed = (prevValueRef.current || '').trim();
    prevValueRef.current = value;

    if (!trimmed) {
      if (prevTrimmed) {
        // Parent reset the field back to empty -> revert to visitor's default country
        hasManualSelectionRef.current = false;
        setSelectedCountry(detectedCountry);
      }
      return;
    }

    if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
      const parsedVal = splitPhoneNumber(trimmed, getDialCodeForCountry(detectedCountry));
      const matchedOpt = COUNTRY_DIAL_OPTIONS.find((opt) => opt.dialCode === parsedVal.dialCode);
      setSelectedCountry((current) => {
        const currentOpt = COUNTRY_DIAL_OPTIONS.find((opt) => opt.country === current);
        if (currentOpt && currentOpt.dialCode === parsedVal.dialCode) {
          return current;
        }
        return matchedOpt ? matchedOpt.country : `CUSTOM:${parsedVal.dialCode}`;
      });
    }
  }, [value, detectedCountry]);

  const activeDialCode = selectedCountry.startsWith('CUSTOM:')
    ? selectedCountry.slice(7)
    : getDialCodeForCountry(selectedCountry);

  const parsed = splitPhoneNumber(value, activeDialCode);
  const groupedSubscriber = groupDigitsInTwos(parsed.subscriberDigits);

  const handleCountrySelect = (nextCountry: string) => {
    hasManualSelectionRef.current = true;
    setSelectedCountry(nextCountry);

    const nextDial = nextCountry.startsWith('CUSTOM:')
      ? nextCountry.slice(7)
      : getDialCodeForCountry(nextCountry);
    const cleanDigits = parsed.subscriberDigits;
    if (cleanDigits) {
      onChange(`${nextDial} ${groupDigitsInTwos(cleanDigits)}`);
    }
  };

  const handleSubscriberChange = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
      const full = splitPhoneNumber(trimmed, activeDialCode);
      const grouped = groupDigitsInTwos(full.subscriberDigits);
      const matchedOpt = COUNTRY_DIAL_OPTIONS.find((opt) => opt.dialCode === full.dialCode);
      setSelectedCountry(matchedOpt ? matchedOpt.country : `CUSTOM:${full.dialCode}`);
      hasManualSelectionRef.current = true;
      onChange(grouped ? `${full.dialCode} ${grouped}` : '');
      return;
    }

    const digitsOnly = rawInput.replace(/\D/g, '').slice(0, 15);
    const grouped = groupDigitsInTwos(digitsOnly);
    onChange(grouped ? `${activeDialCode} ${grouped}` : '');
  };

  return (
    <div className="flex items-stretch gap-2">
      <select
        aria-label="Country code"
        value={selectedCountry}
        onChange={(e) => handleCountrySelect(e.target.value)}
        className="px-2.5 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-xs sm:text-sm text-slate-100 font-mono-num focus:outline-none focus:border-[#D9A438] shrink-0 max-w-[132px] cursor-pointer"
      >
        {selectedCountry.startsWith('CUSTOM:') && (
          <option value={selectedCountry} className="bg-[#0A1527] text-slate-100">
            {selectedCountry.slice(7)}
          </option>
        )}
        {COUNTRY_DIAL_OPTIONS.map((opt) => (
          <option
            key={opt.country}
            value={opt.country}
            className="bg-[#0A1527] text-slate-100"
          >
            {opt.country} ({opt.dialCode})
          </option>
        ))}
      </select>

      <input
        id={id}
        type="tel"
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        value={groupedSubscriber}
        onChange={(e) => handleSubscriberChange(e.target.value)}
        placeholder="7 59 16 31 33"
        className={`flex-1 min-w-0 px-3.5 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 font-mono-num focus:outline-none focus:border-[#D9A438] ${className}`}
      />
    </div>
  );
}
