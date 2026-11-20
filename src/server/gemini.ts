import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import {
  buildSmartCatalogReply,
  type ChatbotHistoryItem,
  type ChatbotStats,
} from '../lib/chatbotEngine.ts';
import { formatPhoneNumber } from '../lib/phone.ts';
import type { Listing, SupportedLang, TranslationBundle, TranslatedListingContent } from '../types/index.ts';

export type { SupportedLang };

const SUPPORTED_LANGS: SupportedLang[] = ['zh', 'en', 'fr', 'es', 'dz', 'gsw', 'bo'];

// Bounded in-memory translation cache (max 400 items)
const translationCache = new Map<string, TranslationBundle>();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function makeCacheKey(input: {
  title: string;
  description: string;
  location: string;
  specsSummary?: string;
}): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex');
}

function buildFallbackBundle(input: {
  title: string;
  description: string;
  location: string;
  specsSummary?: string;
}): TranslationBundle {
  const base: TranslatedListingContent = {
    title: input.title,
    description: input.description,
    location: input.location,
    specsSummary: input.specsSummary || '',
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

export async function translateListingContent(input: {
  title: string;
  description: string;
  location: string;
  specsSummary?: string;
}): Promise<{ translations: TranslationBundle; cached: boolean; aiTranslated: boolean }> {
  const key = makeCacheKey(input);
  const existing = translationCache.get(key);
  if (existing) {
    return { translations: existing, cached: true, aiTranslated: true };
  }

  const ai = getGeminiClient();
  if (!ai) {
    const fallback = buildFallbackBundle(input);
    return { translations: fallback, cached: false, aiTranslated: false };
  }

  try {
    const langSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        location: { type: Type.STRING },
        specsSummary: { type: Type.STRING },
      },
      required: ['title', 'description', 'location', 'specsSummary'],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Translate this marketplace listing into all 7 languages:
- zh: Simplified Chinese
- en: English
- fr: French
- es: Spanish
- dz: Dzongkha (Bhutanese script)
- gsw: Swiss German (Alemannic / Schwiizerdütsch)
- bo: Tibetan (Standard Tibetan / བོད་ཡིག)

Input listing:
Title: ${input.title}
Location: ${input.location}
Specs: ${input.specsSummary || 'N/A'}
Description: ${input.description}

Keep numbers, emails, and proper brand/street names accurate. Return strictly valid JSON.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            zh: langSchema,
            en: langSchema,
            fr: langSchema,
            es: langSchema,
            dz: langSchema,
            gsw: langSchema,
            bo: langSchema,
          },
          required: SUPPORTED_LANGS,
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim()) as TranslationBundle;
    const valid = SUPPORTED_LANGS.every(
      (lang) => parsed[lang] && typeof parsed[lang].title === 'string' && typeof parsed[lang].description === 'string'
    );

    if (!valid) {
      return { translations: buildFallbackBundle(input), cached: false, aiTranslated: false };
    }

    if (translationCache.size >= 400) {
      const oldestKey = translationCache.keys().next().value;
      if (oldestKey) translationCache.delete(oldestKey);
    }
    translationCache.set(key, parsed);

    return { translations: parsed, cached: false, aiTranslated: true };
  } catch (err) {
    console.error('Translation error:', err);
    return { translations: buildFallbackBundle(input), cached: false, aiTranslated: false };
  }
}

export type PlatformStats = ChatbotStats;

function formatCatalogDigest(listings: Listing[], lang: SupportedLang): string {
  return listings
    .slice(0, 30)
    .map((item) => {
      const tr = item.translations?.[lang];
      const title = tr?.title || item.title;
      const loc = tr?.location || item.location;
      const rest = item.category === 'restaurant' && item.specs?.restaurantName ? ` (${item.specs.restaurantName})` : '';
      const price =
        item.type === 'job'
          ? item.specs?.employmentType || 'Job'
          : `${item.priceEur} EUR`;
      const phone = formatPhoneNumber(item.contactPhone || '+33 7 59 16 31 33');
      return `- [${item.type}/${item.category}${rest}] ${title} | ${loc} | ${price} | ${phone}`;
    })
    .join('\n');
}

export async function generateAssistantReply(input: {
  message: string;
  language: SupportedLang;
  stats: PlatformStats;
  listings?: Listing[];
  history?: ChatbotHistoryItem[];
}): Promise<{ reply: string; mode: 'gemini' | 'catalog-assistant' }> {
  const ai = getGeminiClient();
  const catalog = Array.isArray(input.listings) ? input.listings : [];
  const langNames: Record<SupportedLang, string> = {
    zh: 'Simplified Chinese (中文)',
    en: 'English',
    fr: 'French (Français)',
    es: 'Spanish (Español)',
    dz: 'Dzongkha (རྫོང་ཁ)',
    gsw: 'Swiss German (Schwiizerdütsch)',
    bo: 'Tibetan (བོད་སྐད)',
  };

  if (!ai) {
    return {
      reply: buildSmartCatalogReply({
        message: input.message,
        language: input.language,
        stats: input.stats,
        listings: catalog,
        history: input.history,
      }),
      mode: 'catalog-assistant',
    };
  }

  try {
    const catalogDigest = formatCatalogDigest(catalog, input.language);
    const historyTurns = (input.history || [])
      .slice(-6)
      .filter((h) => h && typeof h.text === 'string' && h.text.trim())
      .map((h) => ({
        role: h.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: h.text.trim().slice(0, 800) }],
      }));

    const contents = [
      ...historyTurns,
      { role: 'user' as const, parts: [{ text: input.message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction: `You are the official multilingual help assistant for JobSQUAD (10 Voie Falguiere, Vitry Sur Seine, 94400, France; Phone: +33 7 59 16 31 33; Email: contact.jobsquad@gmail.com).
ALWAYS respond strictly in ${langNames[input.language]}.
Be concise, friendly, and answer directly using the LIVE platform inventory and listings below:
- Total active listings: ${input.stats.total}
- Recruitment & Looking for Job posts: ${input.stats.jobs} (Categories: Babysitting, Restaurant, Construction, Cleaning, Elderly Care, Companion, Looking for Job)
- House rentals: ${input.stats.houses}
- Car rentals: ${input.stats.cars}
- Sales marketplace items: ${input.stats.sales}

Live listings catalog:
${catalogDigest || '(No live listings)'}

Platform rules:
- Registered members (via Email/Password or Google Sign-In, after accepting European GDPR Terms of Service & Privacy Policy) can post jobs, looking-for-job requests, house rentals, car rentals, and marketplace items.
- House, Car, and Sales posts require uploading 1-3 photos and a mobile number.
- Members can edit/delete their own posts, and can delete their own account anytime from their Account panel (click their name in the header).
- All 7 languages (Chinese, English, French, Spanish, Dzongkha, Tibetan, Swiss German) feature live currency conversion.`,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return {
        reply: buildSmartCatalogReply({
          message: input.message,
          language: input.language,
          stats: input.stats,
          listings: catalog,
          history: input.history,
        }),
        mode: 'catalog-assistant',
      };
    }
    return { reply: text, mode: 'gemini' };
  } catch (err) {
    console.error('Assistant Gemini error:', err);
    return {
      reply: buildSmartCatalogReply({
        message: input.message,
        language: input.language,
        stats: input.stats,
        listings: catalog,
        history: input.history,
      }),
      mode: 'catalog-assistant',
    };
  }
}
