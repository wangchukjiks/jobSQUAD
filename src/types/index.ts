export type SupportedLang = 'zh' | 'en' | 'fr' | 'es' | 'dz' | 'gsw';

export type ListingType = 'job' | 'house' | 'car' | 'sale';

export type AccountType = 'seeker' | 'employer' | 'lister';

export interface TranslatedListingContent {
  title: string;
  description: string;
  location: string;
  specsSummary?: string;
}

export type TranslationBundle = Record<SupportedLang, TranslatedListingContent>;

export interface ListingSpecs {
  employmentType?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  furnished?: boolean;
  year?: number;
  transmission?: string;
  fuel?: string;
  seats?: number;
  condition?: string;
  brand?: string;
  pricePeriod?: 'month' | 'day' | 'hour' | 'once';
}

export interface Listing {
  id: string;
  ownerId: string;
  ownerName: string;
  type: ListingType;
  category: string;
  title: string;
  description: string;
  location: string;
  priceEur: number;
  contactEmail: string;
  contactPhone: string;
  images: string[];
  specs: ListingSpecs;
  translations: TranslationBundle;
  status: 'active' | 'closed';
  createdAt?: number;
  updatedAt?: number;
  isSeeded?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  accountType: AccountType;
  isAdmin?: boolean;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rateFromEur: number;
  locale: string;
}
