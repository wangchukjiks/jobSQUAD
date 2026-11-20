import React, { useEffect, useState } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations.ts';
import {
  compressImageToDataUrl,
  fetchCaptchaChallenge,
  saveServerListing,
  translateListingViaServer,
  updateServerListing,
  verifyCaptchaAnswer,
} from '../lib/api.ts';
import {
  adminUpsertListingDoc,
  auth,
  createListingDoc,
  updateListingDoc,
} from '../lib/firebase.ts';
import { formatPhoneNumber } from '../lib/phone.ts';
import type {
  Listing,
  ListingSpecs,
  ListingType,
  SupportedLang,
  TranslationBundle,
  UserProfile,
} from '../types/index.ts';
import { CaptchaField } from './CaptchaField.tsx';
import { PhoneInput } from './PhoneInput.tsx';

interface ListingFormModalProps {
  open: boolean;
  lang: SupportedLang;
  user: UserProfile | null;
  editingListing: Listing | null;
  initialMode?: 'job' | 'looking_for_job' | null;
  onSaved: (listing: Listing) => void;
  onClose: () => void;
}

const CATEGORIES_BY_TYPE: Record<ListingType, string[]> = {
  job: [
    'babysitting',
    'restaurant',
    'construction',
    'cleaning',
    'elderly_care',
    'companion',
    'looking_for_job',
  ],
  house: ['apartment', 'villa'],
  car: ['sedan', 'suv'],
  sale: ['electronics', 'furniture', 'appliances'],
};

function buildImmediateTranslations(
  input: { title: string; description: string; location: string; specsSummary: string },
  existing?: Listing | null
): TranslationBundle {
  const unchangedText =
    existing &&
    existing.title === input.title &&
    existing.description === input.description &&
    existing.location === input.location;

  if (unchangedText && existing.translations) {
    return existing.translations;
  }

  const base = {
    title: input.title,
    description: input.description,
    location: input.location,
    specsSummary: input.specsSummary,
  };
  return {
    zh: { ...base },
    en: { ...base },
    fr: { ...base },
    es: { ...base },
    dz: { ...base },
    gsw: { ...base },
    bo: { ...base },
  };
}

export function ListingFormModal({
  open,
  lang,
  user,
  editingListing,
  initialMode = null,
  onSaved,
  onClose,
}: ListingFormModalProps) {
  const t = UI_TEXT[lang];

  const [type, setType] = useState<ListingType>('job');
  const [category, setCategory] = useState('babysitting');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [priceEur, setPriceEur] = useState('0');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [restaurantName, setRestaurantName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Type-specific specs
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('1');
  const [areaSqm, setAreaSqm] = useState('65');
  const [furnished, setFurnished] = useState(true);
  const [year, setYear] = useState('2024');
  const [transmission, setTransmission] = useState('Automatic');
  const [fuel, setFuel] = useState('Hybrid');
  const [seats, setSeats] = useState('5');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('Like New');

  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setCaptchaQuestion('');
    setCaptchaToken('');
    setCaptchaAnswer('');

    if (editingListing) {
      setType(editingListing.type);
      setCategory(editingListing.category);
      setTitle(editingListing.title);
      setLocation(editingListing.location);
      setPriceEur(editingListing.type === 'job' ? '0' : String(editingListing.priceEur ?? 0));
      setEmploymentType(editingListing.specs?.employmentType || 'Full-Time');
      setRestaurantName(
        editingListing.type === 'job' && editingListing.category === 'restaurant'
          ? editingListing.specs?.restaurantName ||
              (editingListing.isSeeded ? editingListing.ownerName : '')
          : ''
      );
      setContactEmail(editingListing.contactEmail);
      setContactPhone(formatPhoneNumber(editingListing.contactPhone));
      setDescription(editingListing.description);
      setImages(editingListing.type === 'job' ? [] : editingListing.images || []);
      setBedrooms(String(editingListing.specs?.bedrooms ?? 2));
      setBathrooms(String(editingListing.specs?.bathrooms ?? 1));
      setAreaSqm(String(editingListing.specs?.areaSqm ?? 65));
      setFurnished(Boolean(editingListing.specs?.furnished));
      setYear(String(editingListing.specs?.year ?? 2024));
      setTransmission(editingListing.specs?.transmission || 'Automatic');
      setFuel(editingListing.specs?.fuel || 'Hybrid');
      setSeats(String(editingListing.specs?.seats ?? 5));
      setBrand(editingListing.specs?.brand || '');
      setCondition(editingListing.specs?.condition || 'Like New');
    } else {
      setType('job');
      setCategory(initialMode === 'looking_for_job' ? 'looking_for_job' : 'babysitting');
      setTitle('');
      setLocation('');
      setPriceEur('0');
      setEmploymentType('Full-Time');
      setRestaurantName('');
      setContactEmail(user?.email || '');
      setContactPhone(user?.phone ? formatPhoneNumber(user.phone) : '');
      setDescription('');
      setImages([]);
      setBedrooms('2');
      setBathrooms('1');
      setAreaSqm('65');
      setFurnished(true);
      setYear('2024');
      setTransmission('Automatic');
      setFuel('Hybrid');
      setSeats('5');
      setBrand('');
      setCondition('Like New');
    }
  }, [open, editingListing, initialMode, user]);

  if (!open || !user) return null;

  const isJob = type === 'job';
  const isLookingForJob = isJob && category === 'looking_for_job';
  const requiresMedia = type === 'house' || type === 'car' || type === 'sale';

  const handleListingCategoryChange = (selected: string) => {
    if (selected === 'looking_for_job') {
      setType('job');
      setCategory('looking_for_job');
      setPriceEur('0');
      setImages([]);
      setRestaurantName('');
      setTitle('');
      return;
    }
    const nextType = selected as ListingType;
    setType(nextType);
    if (nextType === 'job') {
      setCategory((prev) =>
        prev === 'looking_for_job' || !CATEGORIES_BY_TYPE.job.includes(prev) ? 'babysitting' : prev
      );
      setPriceEur('0');
      setImages([]);
    } else {
      setCategory(CATEGORIES_BY_TYPE[nextType][0]);
      if (priceEur === '0') {
        setPriceEur(nextType === 'house' ? '1200' : nextType === 'car' ? '65' : '250');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError('');

    try {
      const remaining = 3 - images.length;
      const toProcess = Array.from(files).slice(0, remaining);
      const compressed = await Promise.all(toProcess.map((f) => compressImageToDataUrl(f)));
      setImages((prev) => [...prev, ...compressed].slice(0, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      e.target.value = '';
    }
  };

  const buildSpecs = (): { specs: ListingSpecs; summary: string } => {
    if (type === 'house') {
      const specs: ListingSpecs = {
        bedrooms: Number(bedrooms) || 1,
        bathrooms: Number(bathrooms) || 1,
        areaSqm: Number(areaSqm) || 40,
        furnished,
        pricePeriod: 'month',
      };
      return {
        specs,
        summary: `${specs.bedrooms} Beds · ${specs.bathrooms} Baths · ${specs.areaSqm} m²`,
      };
    }
    if (type === 'car') {
      const specs: ListingSpecs = {
        year: Number(year) || 2024,
        transmission,
        fuel,
        seats: Number(seats) || 5,
        pricePeriod: 'day',
      };
      return {
        specs,
        summary: `${specs.year} · ${transmission} · ${fuel} · ${specs.seats} Seats`,
      };
    }
    if (type === 'sale') {
      const specs: ListingSpecs = {
        brand: brand.trim() || 'Standard',
        condition,
        pricePeriod: 'once',
      };
      return {
        specs,
        summary: `${condition}${brand.trim() ? ` · ${brand.trim()}` : ''}`,
      };
    }
    const specs: ListingSpecs = {
      employmentType,
      ...(isJob && category === 'restaurant' && restaurantName.trim()
        ? { restaurantName: restaurantName.trim() }
        : {}),
    };
    return {
      specs,
      summary: employmentType,
    };
  };

  const refreshCaptcha = async () => {
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

    if (type === 'job' && category === 'restaurant' && restaurantName.trim().length < 2) {
      setError(`${t.specsLabels.restaurantName} is required.`);
      return;
    }
    if (contactPhone.trim().length < 6) {
      setError(t.listingModal.phoneRequiredNote);
      return;
    }
    if (requiresMedia && images.length < 1) {
      setError(t.listingModal.imagesRequiredNote);
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (!editingListing) {
        const captchaOk = await verifyCaptchaAnswer(captchaToken, captchaAnswer);
        if (!captchaOk) {
          setError('CAPTCHA answer is incorrect.');
          await refreshCaptcha();
          setSubmitting(false);
          return;
        }
      }

      const { specs, summary } = buildSpecs();
      const resolvedOwnerName =
        user.displayName?.trim() || user.email.split('@')[0] || 'Member';
      const cleanTitle = isLookingForJob
        ? `${t.categories.looking_for_job} - ${resolvedOwnerName}`.slice(0, 160)
        : title.trim();
      const cleanDescription = description.trim();
      const cleanLocation = location.trim();
      const cleanEmail = contactEmail.trim();
      const cleanPhone = formatPhoneNumber(contactPhone.trim());
      const cleanImages = isJob ? [] : images;
      const cleanPrice = isJob ? 0 : Number(priceEur) || 0;

      const immediateTranslations = buildImmediateTranslations(
        {
          title: cleanTitle,
          description: cleanDescription,
          location: cleanLocation,
          specsSummary: summary,
        },
        editingListing
      );

      const isFirebaseAuthenticated = Boolean(auth.currentUser && auth.currentUser.uid === user.uid);
      let savedListing: Listing;

      if (editingListing) {
        const updates = {
          category,
          title: cleanTitle,
          description: cleanDescription,
          location: cleanLocation,
          priceEur: cleanPrice,
          contactEmail: cleanEmail,
          contactPhone: cleanPhone,
          images: cleanImages,
          specs,
          translations: immediateTranslations,
          status: editingListing.status || ('active' as const),
        };

        const canUpdateExistingInFirestore =
          isFirebaseAuthenticated &&
          !editingListing.isSeeded &&
          (editingListing.ownerId === user.uid || Boolean(user.isAdmin));
        const canUpsertSeedInFirestore =
          isFirebaseAuthenticated && Boolean(user.isAdmin) && Boolean(editingListing.isSeeded);

        if (canUpdateExistingInFirestore) {
          try {
            await updateListingDoc(editingListing.id, updates);
            savedListing = {
              ...editingListing,
              ...updates,
              updatedAt: Date.now(),
              firestoreSynced: true,
            };
            void updateServerListing(editingListing.id, {
              ...savedListing,
              firestoreSynced: true,
            }).catch(() => {});
          } catch {
            savedListing = await updateServerListing(editingListing.id, {
              ...editingListing,
              ...updates,
            });
          }
        } else if (canUpsertSeedInFirestore) {
          const nextSeedSnapshot: Listing = {
            ...editingListing,
            ...updates,
            updatedAt: Date.now(),
            isSeeded: false,
            firestoreSynced: true,
          };
          await adminUpsertListingDoc(editingListing.id, nextSeedSnapshot);
          savedListing = nextSeedSnapshot;
          void updateServerListing(editingListing.id, {
            ...nextSeedSnapshot,
            firestoreSynced: true,
          }).catch(() => {});
        } else {
          savedListing = await updateServerListing(editingListing.id, {
            ...editingListing,
            ...updates,
          });
        }
      } else {
        const newId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const payload: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'isSeeded'> = {
          ownerId: user.uid,
          ownerName: resolvedOwnerName,
          type,
          category,
          title: cleanTitle,
          description: cleanDescription,
          location: cleanLocation,
          priceEur: cleanPrice,
          contactEmail: cleanEmail,
          contactPhone: cleanPhone,
          images: cleanImages,
          specs,
          translations: immediateTranslations,
          status: 'active',
        };

        if (isFirebaseAuthenticated) {
          await createListingDoc(newId, payload);
          savedListing = {
            ...payload,
            id: newId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isSeeded: false,
            firestoreSynced: true,
          };
          void saveServerListing({
            ...payload,
            id: newId,
            firestoreSynced: true,
          }).catch(() => {});
        } else {
          savedListing = await saveServerListing({
            ...payload,
            id: newId,
            firestoreSynced: false,
          });
        }
      }

      onSaved(savedListing);
      onClose();

      // Background asynchronous translation enrichment (never blocks Save button)
      const needsTranslation =
        !editingListing ||
        editingListing.title !== cleanTitle ||
        editingListing.description !== cleanDescription ||
        editingListing.location !== cleanLocation;

      if (needsTranslation) {
        void translateListingViaServer({
          title: cleanTitle,
          description: cleanDescription,
          location: cleanLocation,
          specsSummary: summary,
        })
          .then(async ({ translations, aiTranslated }) => {
            if (!aiTranslated) return;
            const enriched: Listing = {
              ...savedListing,
              translations,
              updatedAt: Date.now(),
            };
            onSaved(enriched);
            if (
              isFirebaseAuthenticated &&
              (savedListing.ownerId === user.uid || Boolean(user.isAdmin))
            ) {
              await updateListingDoc(savedListing.id, { translations }).catch(() => {});
            }
            await updateServerListing(savedListing.id, { ...enriched }).catch(() => {});
          })
          .catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="jobsquad-surface w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-50">
            {editingListing ? t.listingModal.editTitle : t.listingModal.createTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80dvh] overflow-y-auto">
          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t.listingModal.type}</label>
              <select
                value={isLookingForJob ? 'looking_for_job' : type}
                disabled={Boolean(editingListing)}
                onChange={(e) => handleListingCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
              >
                <option value="job">{t.listingModal.typeJob}</option>
                <option value="looking_for_job">{t.listingModal.typeLookingForJob}</option>
                <option value="house">{t.listingModal.typeHouse}</option>
                <option value="car">{t.listingModal.typeCar}</option>
                <option value="sale">{t.listingModal.typeSale}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t.listingModal.category}</label>
              <select
                value={category}
                disabled={isLookingForJob}
                onChange={(e) => {
                  const nextCat = e.target.value;
                  setCategory(nextCat);
                  if (nextCat !== 'restaurant') {
                    setRestaurantName('');
                  }
                  if (nextCat === 'looking_for_job') {
                    setTitle('');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438] disabled:opacity-75"
              >
                {CATEGORIES_BY_TYPE[type].map((cat) => (
                  <option key={cat} value={cat}>
                    {t.categories[cat] || cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isJob && category === 'restaurant' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {t.specsLabels.restaurantName} <span className="text-[#D9A438]">*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Bistro Lumière"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
              />
            </div>
          )}

          {!isLookingForJob && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {isJob ? t.listingModal.jobTitleLabel : t.listingModal.titleLabel}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={160}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t.listingModal.locationLabel}</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={160}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
              />
            </div>

            {isJob ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {t.listingModal.scheduleLabel}
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
                >
                  <option value="Full-Time">{t.listingModal.scheduleOptions['Full-Time']}</option>
                  <option value="Part-Time">{t.listingModal.scheduleOptions['Part-Time']}</option>
                  <option value="Flexible">{t.listingModal.scheduleOptions.Flexible}</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">{t.listingModal.priceEurLabel}</label>
                <input
                  type="number"
                  required
                  min={0}
                  step="1"
                  value={priceEur}
                  onChange={(e) => setPriceEur(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 font-mono-num focus:outline-none focus:border-[#D9A438]"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t.listingModal.emailLabel}</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {t.listingModal.phoneLabel} <span className="text-[#D9A438]">*</span>
              </label>
              <PhoneInput value={contactPhone} onChange={setContactPhone} required />
            </div>
          </div>

          {/* Dynamic Specs */}
          {type === 'house' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.specsLabels.bedrooms}</label>
                <input
                  type="number"
                  min={1}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 font-mono-num"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.specsLabels.bathrooms}</label>
                <input
                  type="number"
                  min={1}
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 font-mono-num"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.specsLabels.area} (m²)</label>
                <input
                  type="number"
                  min={10}
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 font-mono-num"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.specsLabels.furnished}</label>
                <select
                  value={furnished ? 'yes' : 'no'}
                  onChange={(e) => setFurnished(e.target.value === 'yes')}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100"
                >
                  <option value="yes">{t.specsLabels.yes}</option>
                  <option value="no">{t.specsLabels.no}</option>
                </select>
              </div>
            </div>
          )}

          {type === 'car' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.specsLabels.year}</label>
                <input
                  type="number"
                  min={2000}
                  max={2027}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 font-mono-num"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.specsLabels.transmission}</label>
                <input
                  type="text"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.specsLabels.fuel}</label>
                <input
                  type="text"
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.specsLabels.seats}</label>
                <input
                  type="number"
                  min={2}
                  max={9}
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 font-mono-num"
                />
              </div>
            </div>
          )}

          {type === 'sale' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.specsLabels.brand}</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.specsLabels.condition}</label>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Photo Upload (Only for House, Car, Sales — removed from Recruitment posts) */}
          {requiresMedia && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">
                {t.listingModal.imagesLabel} <span className="text-[#D9A438]">*</span>
              </label>
              <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-[#0A1527] px-4 py-4 text-xs text-slate-300 hover:border-[#D9A438] cursor-pointer transition-colors">
                <ImagePlus className="w-4 h-4 text-[#D9A438]" />
                <span>{t.listingModal.uploadHint}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400">{t.listingModal.imagesRequiredNote}</p>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {images.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-700"
                    >
                      <img
                        src={src}
                        alt={`Upload ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label="Remove image"
                        className="absolute top-1.5 right-1.5 p-1 rounded bg-black/70 text-rose-300 hover:text-rose-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">{t.listingModal.descriptionLabel}</label>
            <textarea
              required
              minLength={10}
              maxLength={3000}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1527] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#D9A438]"
            />
          </div>

          {!editingListing && (
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
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-sm hover:bg-[#E5B34B] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {submitting
              ? t.listingModal.submitSave
              : editingListing
                ? t.listingModal.submitSave
                : t.listingModal.submitCreate}
          </button>
        </form>
      </div>
    </div>
  );
}
