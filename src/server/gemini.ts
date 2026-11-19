import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';

export type SupportedLang = 'zh' | 'en' | 'fr' | 'es' | 'dz' | 'gsw' | 'bo';

export interface TranslatedListingContent {
  title: string;
  description: string;
  location: string;
  specsSummary?: string;
}

export type TranslationBundle = Record<SupportedLang, TranslatedListingContent>;

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

export interface PlatformStats {
  jobs: number;
  houses: number;
  cars: number;
  sales: number;
  total: number;
  categories: Record<string, number>;
}

const FALLBACK_REPLIES: Record<SupportedLang, (stats: PlatformStats, q: string) => string> = {
  zh: (s, q) => {
    const lower = q.toLowerCase();
    if (lower.includes('房') || lower.includes('house') || lower.includes('租') || lower.includes('车') || lower.includes('car')) {
      return `目前 JobSQUAD 上共有 ${s.houses} 套房屋出租和 ${s.cars} 辆汽车租赁。点击“房屋/车辆”详情即可查看房东或车主的联系电话与邮箱。`;
    }
    if (lower.includes('买') || lower.includes('卖') || lower.includes('sale') || lower.includes('商品')) {
      return `本地集市目前有 ${s.sales} 件精选在售商品。登录注册后您也可以发布带图与手机号的出售信息。`;
    }
    if (lower.includes('工作') || lower.includes('招') || lower.includes('job') || lower.includes('联系')) {
      return `平台当前共有 ${s.jobs} 个在招职位（涵盖育儿保姆、餐饮、建筑施工、保洁、长者照护、陪护等）。点击职位卡片即可直接发送邮件联系雇主，或拨打支持热线 +33 759163133（jigsonbusyness@gmail.com）。`;
    }
    return `您好！我是 JobSQUAD 在线助手。当前平台共有 ${s.total} 条实时信息：${s.jobs} 个招聘职位、${s.houses} 套房屋出租、${s.cars} 辆汽车租赁以及 ${s.sales} 件本地在售物品。如需人工支持，请致电 +33 759163133 或发送邮件至 jigsonbusyness@gmail.com。`;
  },
  en: (s, q) => {
    const lower = q.toLowerCase();
    if (lower.includes('house') || lower.includes('rent') || lower.includes('car') || lower.includes('vehicle')) {
      return `JobSQUAD currently lists ${s.houses} house rentals and ${s.cars} car rentals. Open "View Details" on any rental to see the owner's mobile number before emailing them.`;
    }
    if (lower.includes('sale') || lower.includes('buy') || lower.includes('sell') || lower.includes('market')) {
      return `There are currently ${s.sales} items in the Local Sales Marketplace. Registered users can post items with photos and a mobile contact number.`;
    }
    if (lower.includes('job') || lower.includes('work') || lower.includes('hire') || lower.includes('recruit')) {
      return `We currently have ${s.jobs} active job vacancies across Babysitting, Restaurant, Construction, Cleaning, Elderly Care, and Companion roles. Click "Send Email" on any post to contact the employer directly.`;
    }
    return `Welcome to JobSQUAD Support! Live platform inventory: ${s.jobs} job vacancies, ${s.houses} house rentals, ${s.cars} car rentals, and ${s.sales} sales items (${s.total} total). Contact us anytime at +33 759163133 or jigsonbusyness@gmail.com.`;
  },
  fr: (s, q) => {
    const lower = q.toLowerCase();
    if (lower.includes('maison') || lower.includes('voiture') || lower.includes('louer') || lower.includes('location')) {
      return `JobSQUAD propose actuellement ${s.houses} locations de maisons et ${s.cars} locations de voitures. Cliquez sur « Voir les détails » pour afficher le numéro de mobile du propriétaire avant l'e-mail.`;
    }
    if (lower.includes('vente') || lower.includes('acheter') || lower.includes('vendre')) {
      return `Le marché local compte actuellement ${s.sales} annonces de vente. Les membres inscrits peuvent publier avec photos et numéro de mobile.`;
    }
    return `Bonjour ! Voici les chiffres en direct sur JobSQUAD : ${s.jobs} offres d'emploi, ${s.houses} maisons à louer, ${s.cars} voitures à louer et ${s.sales} articles en vente (${s.total} annonces). Support : +33 759163133 ou jigsonbusyness@gmail.com.`;
  },
  es: (s, q) => {
    const lower = q.toLowerCase();
    if (lower.includes('casa') || lower.includes('coche') || lower.includes('alquil')) {
      return `JobSQUAD cuenta actualmente con ${s.houses} casas en alquiler y ${s.cars} coches en alquiler. Pulsa "Ver detalles" para ver el móvil del propietario antes del correo.`;
    }
    if (lower.includes('venta') || lower.includes('comprar') || lower.includes('vender')) {
      return `El mercado local tiene actualmente ${s.sales} artículos en venta. Los usuarios registrados pueden publicar con fotos y número móvil.`;
    }
    return `¡Hola! Inventario en vivo de JobSQUAD: ${s.jobs} vacantes de empleo, ${s.houses} casas en alquiler, ${s.cars} coches en alquiler y ${s.sales} artículos en venta (${s.total} en total). Soporte: +33 759163133 o jigsonbusyness@gmail.com.`;
  },
  dz: (s) =>
    `བཀྲ་ཤིས་བདེ་ལེགས། JobSQUAD གཡོག་དང་ཚོང་ལས་སྟེགས་བུའི་ནང་ ད་ལྟོ་ གཡོག་གི་གོ་སྐབས་ ${s.jobs} དང་། ཁྱིམ་གླ་ ${s.houses} ། སྣུམ་འཁོར་གླ་ ${s.cars} ། ཉོ་ཚོང་ཅ་ལག་ ${s.sales} བཅས་བསྡོམས་ ${s.total} ཡོད། འབྲེལ་བ་འཐབ་དགོ་ན་ +33 759163133 དང་ jigsonbusyness@gmail.com ལུ་གཏང་གནང་།`,
  gsw: (s) =>
    `Grüezi bi JobSQUAD! Aktuell händ mir ${s.jobs} offeni Stelle, ${s.houses} Wohnige/Hüser zur Mieti, ${s.cars} Mietautos und ${s.sales} Verchaufsinserat (total ${s.total} Iiträg). Bi Frage erreichid Si üs under +33 759163133 oder jigsonbusyness@gmail.com.`,
  bo: (s) =>
    `བཀྲ་ཤིས་བདེ་ལེགས། JobSQUAD དྲ་ཚིགས་སུ་ད་ལྟ་ལས་ཀའི་ས་མིག་ ${s.jobs} དང་། ཁང་པ་གླ་གཏོང་ ${s.houses} ། རླངས་འཁོར་གླ་གཏོང་ ${s.cars} ། ཉོ་ཚོང་དངོས་པོ་ ${s.sales} བཅས་ཁྱོན་བསྡོམས་ ${s.total} ཡོད། རོགས་རམ་དགོས་ན་ +33 759163133 དང་ jigsonbusyness@gmail.com ལ་འབྲེལ་བ་གནང་རོགས།`,
};

export async function generateAssistantReply(input: {
  message: string;
  language: SupportedLang;
  stats: PlatformStats;
}): Promise<{ reply: string; mode: 'gemini' | 'live-fallback' }> {
  const ai = getGeminiClient();
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
      reply: FALLBACK_REPLIES[input.language](input.stats, input.message),
      mode: 'live-fallback',
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: input.message,
      config: {
        systemInstruction: `You are the official multilingual help assistant for JobSQUAD (10 Voie Falguiere, Vitry Sur Seine, 94400, France; Phone: +33 759163133; Email: jigsonbusyness@gmail.com).
ALWAYS respond strictly in ${langNames[input.language]}.
Be concise, helpful, and accurate using these LIVE platform listing counts:
- Total active listings: ${input.stats.total}
- Recruitment vacancies: ${input.stats.jobs} (Categories: Babysitting, Restaurant, Construction, Cleaning, Elderly Care, Hire Companion)
- House rentals: ${input.stats.houses}
- Car rentals: ${input.stats.cars}
- Sales marketplace items: ${input.stats.sales}
Note that registered users can post vacancies, houses, cars, and sales items (houses, cars, and sales require uploading images and a mobile number), and job seekers contact employers directly via email.`,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return {
        reply: FALLBACK_REPLIES[input.language](input.stats, input.message),
        mode: 'live-fallback',
      };
    }
    return { reply: text, mode: 'gemini' };
  } catch (err) {
    console.error('Assistant Gemini error:', err);
    return {
      reply: FALLBACK_REPLIES[input.language](input.stats, input.message),
      mode: 'live-fallback',
    };
  }
}
