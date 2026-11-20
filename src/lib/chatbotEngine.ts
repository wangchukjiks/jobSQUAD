import { formatLocalizedPrice, UI_TEXT } from '../i18n/translations.ts';
import { formatPhoneNumber } from './phone.ts';
import type { Listing, SupportedLang } from '../types/index.ts';

export interface ChatbotStats {
  jobs: number;
  houses: number;
  cars: number;
  sales: number;
  total: number;
  categories: Record<string, number>;
}

export interface ChatbotHistoryItem {
  role: 'user' | 'assistant';
  text: string;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'can', 'could',
  'i', 'me', 'my', 'we', 'you', 'your', 'it', 'this', 'that', 'any', 'some', 'all',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'about', 'from', 'and', 'or', 'please',
  'have', 'has', 'want', 'need', 'looking', 'find', 'search', 'show', 'list', 'give',
  'what', 'where', 'when', 'how', 'which', 'who', 'there', 'here', 'help', 'hi', 'hello',
  'bonjour', 'salut', 'merci', 'hola', 'gracias', 'quiero', 'busco', 'hay', 'como',
  '请问', '你好', '您好', '有什么', '有没有', '我想', '可以', '怎么', '如何', '吗', '的', '了', '在',
]);

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  babysitting: ['babysit', 'babysitter', 'babysitting', 'nanny', 'child', 'children', 'kid', 'kids', '保姆', '育儿', '照看', '儿童', 'nounou', 'enfant', 'garde', 'niñera', 'niños', 'kinderbetreuung', 'chinder', 'ཨ་ལུ', 'བྱིས་པ'],
  restaurant: ['restaurant', 'chef', 'cook', 'kitchen', 'bistro', 'waiter', 'waitress', 'server', 'dining', '餐饮', '厨师', '餐厅', '服务员', 'cuisinier', 'serveur', 'cocina', 'cocinero', 'camarero', 'koch', 'gastronomie', 'ཟ་ཁང'],
  construction: ['construction', 'builder', 'carpenter', 'mason', 'renovation', 'plumbing', 'electrician', '建筑', '装修', '施工', '木工', 'bâtiment', 'chantier', 'maçon', 'albañil', 'obra', 'bau', 'ཨར་ལས'],
  cleaning: ['cleaning', 'cleaner', 'housekeeping', 'janitor', 'maid', '保洁', '清洁', '打扫', 'ménage', 'nettoyage', 'limpieza', 'reinigung', 'putz', 'གཙང་སྦྲ'],
  elderly_care: ['elderly', 'senior', 'caregiver', 'nurse', 'care', '长者', '老人', '护理', '照护', 'personnes âgées', 'auxiliaire', 'mayores', 'ancianos', 'pflege', 'རྒན་གསོ'],
  companion: ['companion', 'escort', 'travel', 'assistant', '陪护', '陪同', '陪伴', 'accompagnateur', 'acompañante', 'begleitung', 'རོགས་ཟླ'],
  looking_for_job: ['looking for job', 'job seeker', 'seek job', 'seeking work', 'available for work', 'candidate', 'cv', 'resume', '求职', '找工作', '找活', 'cherche emploi', 'demande emploi', 'busco trabajo', 'arbeitssuchend', 'stelle gsuecht', 'ལས་ཀ་འཚོལ'],
  apartment: ['apartment', 'flat', 'studio', '2br', '3br', '公寓', '套房', 'appartement', 'piso', 'apartamento', 'wohnung'],
  villa: ['villa', 'detached', 'garden house', '别墅', '独栋', 'maison', 'chalet', 'villa', 'haus'],
  sedan: ['sedan', 'saloon', 'berline', 'hatchback', '轿车', 'compact'],
  suv: ['suv', '4x4', 'crossover', 'van', '越野', 'suv'],
  electronics: ['electronic', 'laptop', 'phone', 'macbook', 'camera', 'tv', '电脑', '手机', '数码', '电子', 'électronique', 'electrónica', 'elektronik'],
  furniture: ['furniture', 'sofa', 'table', 'chair', 'desk', 'bed', '家具', '沙发', '桌子', 'meuble', 'mueble', 'möbel'],
  appliances: ['appliance', 'fridge', 'washer', 'coffee', 'espresso', 'microwave', '家电', '咖啡机', '冰箱', 'électroménager', 'electrodoméstico'],
};

const TYPE_SYNONYMS: Record<'job' | 'house' | 'car' | 'sale', string[]> = {
  job: ['job', 'jobs', 'work', 'vacancy', 'vacancies', 'recruit', 'recruitment', 'hire', 'hiring', 'salary', 'employment', '工作', '招聘', '职位', '打工', 'emploi', 'travail', 'recrutement', 'poste', 'empleo', 'trabajo', 'vacante', 'stelle', 'arbeit', 'job', 'གཡོག', 'ལས་ཀ'],
  house: ['house', 'houses', 'home', 'rent', 'rental', 'rentals', 'room', 'bedroom', 'apartment', 'flat', 'villa', '房', '租房', '房屋', '公寓', 'maison', 'appartement', 'logement', 'loyer', 'casa', 'piso', 'alquiler', 'haus', 'wohnung', 'miete', 'ཁྱིམ', 'ཁང་པ'],
  car: ['car', 'cars', 'vehicle', 'auto', 'drive', 'driving', 'sedan', 'suv', '车', '租车', '汽车', 'voiture', 'auto', 'location voiture', 'coche', 'vehículo', 'auto', 'mietwagen', 'སྣུམ་འཁོར', 'རླངས་འཁོར'],
  sale: ['sale', 'sales', 'buy', 'sell', 'shop', 'market', 'marketplace', 'item', 'items', 'price', 'secondhand', 'used', '买', '卖', '集市', '商品', '二手', 'vente', 'acheter', 'vendre', 'marché', 'venta', 'comprar', 'vender', 'mercado', 'verkauf', 'kaufen', 'flohmarkt', 'ཉོ་ཚོང'],
};

function getLocalizedListingText(item: Listing, lang: SupportedLang) {
  const tr = item.translations?.[lang];
  return {
    title: tr?.title || item.title,
    description: tr?.description || item.description,
    location: tr?.location || item.location,
    specsSummary: tr?.specsSummary || '',
  };
}

function formatListingBullet(item: Listing, lang: SupportedLang): string {
  const t = UI_TEXT[lang];
  const loc = getLocalizedListingText(item, lang);
  const catLabel = t.categories[item.category] || item.category;
  const restaurantPrefix =
    item.category === 'restaurant' && item.specs?.restaurantName
      ? ` (${item.specs.restaurantName})`
      : '';
  const priceOrSchedule =
    item.type === 'job'
      ? item.specs?.employmentType || loc.specsSummary || catLabel
      : formatLocalizedPrice(
          item.priceEur,
          lang,
          item.type === 'house' ? 'month' : item.type === 'car' ? 'day' : 'once'
        );

  const contactNote =
    item.type === 'job'
      ? `${formatPhoneNumber(item.contactPhone || '+33 7 59 16 31 33')}`
      : `${t.viewDetails} / ${formatPhoneNumber(item.contactPhone || '+33 7 59 16 31 33')}`;

  return `• [${catLabel}${restaurantPrefix}] ${loc.title} — ${loc.location} (${priceOrSchedule}) · ${contactNote}`;
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[?!.,;:'"()\[\]{}，。！？、]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

export function buildSmartCatalogReply(input: {
  message: string;
  language: SupportedLang;
  stats: ChatbotStats;
  listings: Listing[];
  history?: ChatbotHistoryItem[];
}): string {
  const { message, language, stats, listings } = input;
  const t = UI_TEXT[language];
  const qLower = message.trim().toLowerCase();
  const supportPhone = formatPhoneNumber('+33 7 59 16 31 33');

  // 1. Check account / posting / how-to / legal / contact questions
  const asksAccountDelete =
    /(delete|remove|close).*(account|profile)|注销|删除账户|删除账号|supprimer.*compte|eliminar.*cuenta|konto.*lösche|རྩིས་ཐོ.*བཏོན|ཐོ་ཁོངས.*བསུབ/i.test(
      qLower
    );
  if (asksAccountDelete) {
    const replies: Record<SupportedLang, string> = {
      zh: `您可以随时删除自己的账户：登录后点击顶部导航栏右上角的个人姓名按钮，在账户窗口底部点击“删除我的账户”并确认即可永久移除账户数据。`,
      en: `You can delete your own account anytime: while logged in, click your name in the top header bar, scroll to "Delete My Account" inside the account window, and confirm.`,
      fr: `Vous pouvez supprimer votre compte à tout moment : une fois connecté, cliquez sur votre nom en haut à droite, puis cliquez sur « Supprimer mon compte » et confirmez.`,
      es: `Puedes eliminar tu cuenta en cualquier momento: tras iniciar sesión, pulsa tu nombre en la barra superior, selecciona "Eliminar mi cuenta" y confirma.`,
      dz: `ཁྱོད་ཀྱིས་རང་གི་རྩིས་ཐོ་དུས་ནམ་ཡང་བཏོན་གཏང་ཚུགས། ནང་འཛུལ་འབད་ཚར་བའི་ཤུལ་ གོང་གི་མིང་ཐོག་ཨེབ་སྟེ་「ངེད་ཀྱི་རྩིས་ཐོ་བཏོན་གཏང་」ཟེར་བར་ངེས་གཏན་འབད་གནང་།`,
      gsw: `Si chönd Ihr Konto jederzeit sälber lösche: Klicked Si im Header uf Ihre Name und denn une uf „Mis Konto lösche“ und bestätiged Si das.`,
      bo: `ཁྱེད་ཀྱིས་དུས་ནམ་ཡང་རང་གི་ཐོ་ཁོངས་བསུབ་ཐུབ། ནང་འཛུལ་བྱས་རྗེས་སྟེང་གི་མིང་ལ་མནན་ནས་「ངའི་ཐོ་ཁོངས་བསུབ་」ཟེར་བར་གཏན་འཁེལ་བྱེད་དགོས།`,
    };
    return replies[language];
  }

  const asksHowToPost =
    /(how to post|post a|publish|create listing|add job|add house|add car|register|sign up|google|login|log in|如何发布|怎么发帖|怎么注册|登录|publier|poster|inscrire|connexion|publicar|registro|iniciar sesión|inseriere|registriere|འགོད་སྤེལ|ཐོ་བཀོད|གསལ་བསྒྲགས་སྤེལ)/i.test(
      qLower
    );
  if (asksHowToPost) {
    const replies: Record<SupportedLang, string> = {
      zh: `发布信息只需两步：1）点击右上角“注册 / 登录”（支持邮箱注册或 Google 一键登录，并勾选服务条款与隐私政策）；2）点击“发布信息”，选择招聘、求职、房屋出租、汽车租赁或本地出售，填写信息并完成验证码即可自动翻译成 7 种语言发布！`,
      en: `Publishing on JobSQUAD takes 2 easy steps: 1) Click "Register / Log In" (register with email/mobile or Continue with Google, and accept the Terms & Privacy Policy); 2) Click "Post Listing", pick Job Vacancy, Looking for Job, House, Car, or Sale Item (rentals/sales require 1–3 photos and a mobile number). Your post is automatically translated into all 7 languages!`,
      fr: `Publier sur JobSQUAD est simple : 1) Cliquez sur « Inscription / Connexion » (e-mail ou Google, en acceptant les CGU et la Politique de confidentialité) ; 2) Cliquez sur « Publier une annonce », choisissez Emploi, Demande d'emploi, Maison, Voiture ou Vente (photos obligatoires pour locations/ventes).`,
      es: `Publicar en JobSQUAD es muy fácil: 1) Pulsa "Registrarse / Iniciar sesión" (correo o Google, aceptando los Términos y Privacidad); 2) Pulsa "Publicar anuncio" y elige Empleo, Busco trabajo, Casa, Coche o Venta.`,
      dz: `JobSQUAD ནང་གསལ་བསྒྲགས་སྤེལ་ནིར་ ༡)「ཐོ་བཀོད་ / ནང་འཛུལ་」ཨེབ་སྟེ་ Google ཡང་ན་གློག་འཕྲིན་ཐོག་ནང་འཛུལ་འབད། ༢)「གསལ་བསྒྲགས་སྤེལ་」ཨེབ་སྟེ་ཁ་གསལ་བཙུགས།`,
      gsw: `So chönd Si inseriere: 1) Uf „Registriere / Aamälde“ klicke (E-Mail oder Google, AGB akzeptiere); 2) Uf „Inserat ufgeh“ klicke und Stell, Stellesuechi, Huus, Auto oder Verchauf uswähle.`,
      bo: `JobSQUAD ནང་གསལ་བསྒྲགས་སྤེལ་སྟངས། ༡)「ཐོ་འགོད་ / ནང་འཛུལ་」མནན་ནས་གློག་འཕྲིན་ནམ་ Google བརྒྱུད་ནང་འཛུལ་བྱེད། ༢)「གསལ་བསྒྲགས་སྤེལ་」མནན་ནས་ལས་ཀའམ་ཁང་གླ། རླངས་འཁོར། ཉོ་ཚོང་བཅས་བཀོད་དགོས།`,
    };
    return replies[language];
  }

  const asksContact =
    /(contact|support|admin|email|phone|number|address|where are you|office|联系|客服|邮箱|电话|地址|contacter|adresse|téléphone|contacto|teléfono|dirección|kontakt|telefon|འབྲེལ་བ|ཁ་པར)/i.test(
      qLower
    );
  if (asksContact) {
    const replies: Record<SupportedLang, string> = {
      zh: `JobSQUAD 管理员联系方式：电子邮箱 contact.jobsquad@gmail.com，电话 ${supportPhone}，地址：10 Voie Falguiere, Vitry Sur Seine, 94400, France。您也可以点击顶部“联系我们”直接发送站内消息。`,
      en: `You can reach the JobSQUAD administrator at contact.jobsquad@gmail.com or ${supportPhone} (10 Voie Falguiere, Vitry Sur Seine, 94400, France), or use the "Contact Us" button in the top bar.`,
      fr: `Vous pouvez joindre l’administrateur JobSQUAD à contact.jobsquad@gmail.com ou au ${supportPhone} (10 Voie Falguiere, Vitry Sur Seine, 94400, France), ou via « Contactez-nous » en haut de la page.`,
      es: `Puedes contactar con el administrador de JobSQUAD en contact.jobsquad@gmail.com o al ${supportPhone} (10 Voie Falguiere, Vitry Sur Seine, 94400, France), o mediante el botón "Contáctanos".`,
      dz: `JobSQUAD བདག་སྐྱོང་པ་འབྲེལ་བ་འཐབ་ས། གློག་འཕྲིན་ contact.jobsquad@gmail.com ། བརྒྱུད་འཕྲིན་ ${supportPhone} ། ཁ་བྱང་ 10 Voie Falguiere, Vitry Sur Seine, 94400, France།`,
      gsw: `Sie erreichid d JobSQUAD-Adminischtration under contact.jobsquad@gmail.com oder ${supportPhone} (10 Voie Falguiere, Vitry Sur Seine, 94400, France).`,
      bo: `JobSQUAD དོ་དམ་པར་འབྲེལ་བ་བྱེད་ས། གློག་འཕྲིན་ contact.jobsquad@gmail.com དང་། ཁ་པར་ ${supportPhone} ། ཁ་བྱང་ 10 Voie Falguiere, Vitry Sur Seine, 94400, France ཡིན།`,
    };
    return replies[language];
  }

  const asksLegal =
    /(privacy|gdpr|terms|policy|flag|report|dsa|隐私|条款|举报|标记|confidentialité|conditions|privacidad|términos|datenschutz|སྒེར་དོན|ཆ་རྐྱེན)/i.test(
      qLower
    );
  if (asksLegal) {
    const replies: Record<SupportedLang, string> = {
      zh: `JobSQUAD 遵守欧洲 GDPR 与欧盟《数字服务法》(DSA) 规范：所有用户注册均须同意《服务条款》与《隐私政策》，您可随时查看页脚链接，或直接删除您的个人账户与数据；管理员也会标记或清理不实或违规信息。`,
      en: `JobSQUAD complies with European GDPR and EU Digital Services Act (DSA) rules. You can review our full Terms of Service and Privacy Policy from the footer links, delete your own account anytime from your account panel, or report questionable listings to the administrator.`,
      fr: `JobSQUAD respecte le RGPD européen et le règlement DSA : consultez les Conditions d’utilisation et la Politique de confidentialité en pied de page, ou supprimez votre compte à tout moment depuis votre espace membre.`,
      es: `JobSQUAD cumple con el RGPD europeo y la Ley de Servicios Digitales (DSA). Puedes revisar los Términos y la Política de Privacidad en el pie de página o eliminar tu cuenta en cualquier momento.`,
      dz: `JobSQUAD གིས་ཡུ་རོབ་ GDPR དང་ DSA ཁྲིམས་ལུགས་བསྟར་སྤྱོད་འབདཝ་ཨིན། གཤམ་གྱི་ཞབས་ཏོག་ཆ་རྐྱེན་དང་སྒེར་དོན་སྲིད་བྱུས་བལྟ་ཚུགས།`,
      gsw: `JobSQUAD haltet sich a d europäische GDPR- und DSA-Richtlinie. Nutzigsbedingige und Dateschutzerklärig finded Si im Footer.`,
      bo: `JobSQUAD ནི་ཡོ་རོབ་ཀྱི་ GDPR དང་ DSA ཁྲིམས་ལུགས་དང་མཐུན་པར་སྒེར་དོན་སྲུང་སྐྱོབ་བྱེད་ཀྱི་ཡོད། ཞབས་ཞུའི་ཆ་རྐྱེན་དང་སྒེར་དོན་སྲིད་བྱུས་དྲ་ངོས་འོག་ཏུ་གཟིགས་ཐུབ།`,
    };
    return replies[language];
  }

  const asksLanguageOrCurrency =
    /(language|translate|tibetan|dzongkha|currency|euro|chf|usd|cny|语言|翻译|藏语|藏文|宗喀|货币|汇率|langue|traduire|devise|idioma|moneda|sprache|währung|སྐད་ཡིག|བོད་སྐད|དངུལ)/i.test(
      qLower
    );
  if (asksLanguageOrCurrency) {
    const replies: Record<SupportedLang, string> = {
      zh: `JobSQUAD 支持 7 种语言与自动货币换算：中文 (CNY ¥)、English (USD $)、Français (EUR €)、Español (EUR €)、རྫོང་ཁ Dzongkha (BTN Nu.)、བོད་སྐད 藏语 Tibetan (EUR €) 与 Schwiizerdütsch (CHF)。在页面顶部右上角即可一键切换。`,
      en: `JobSQUAD supports 7 languages with live currency conversion: Chinese (CNY ¥), English (USD $), French (EUR €), Spanish (EUR €), Dzongkha (BTN Nu.), Tibetan (EUR €), and Swiss German (CHF). Switch languages anytime using the dropdown at the top-right.`,
      fr: `JobSQUAD prend en charge 7 langues avec conversion automatique des devises (Chinois, Anglais, Français, Espagnol, Dzongkha, Tibétain, Suisse allemand) via le menu en haut à droite.`,
      es: `JobSQUAD admite 7 idiomas con conversión automática de divisas (Chino, Inglés, Francés, Español, Dzongkha, Tibetano y Alemán suizo) desde el selector superior derecho.`,
      dz: `JobSQUAD ནང་སྐད་ཡིག་ ༧ (རྒྱ་ནག་ ཨིང་ལིཤ་ ཕ་རེནཆ་ ཨིསི་པེ་ནིཤ་ རྫོང་ཁ་ བོད་སྐད་ སུ་ཝིསི་ཇར་མཱན་) དང་དངུལ་ལོར་སོར་བསྒྱུར་ཡོད།`,
      gsw: `JobSQUAD understützt 7 Sprache mit automatischer Währigsumrächnig (Chinesisch, Änglisch, Französisch, Spanisch, Dzongkha, Tibetisch, Schwiizerdütsch).`,
      bo: `JobSQUAD ནང་སྐད་ཡིག་ ༧ (རྒྱ་སྐད། དབྱིན་སྐད། ཧྥ་རན་སི། སི་པེན། རྫོང་ཁ། བོད་སྐད། སུ་ཝེ་སིའི་འཇར་མན་སྐད) དང་དངུལ་ལོར་རང་འགུལ་བརྗེ་སྒྱུར་ཡོད།`,
    };
    return replies[language];
  }

  // 2. Live Catalog Search across actual listings
  const detectedCategories = Object.entries(CATEGORY_SYNONYMS)
    .filter(([, words]) => words.some((w) => qLower.includes(w)))
    .map(([cat]) => cat);

  const detectedTypes = (Object.entries(TYPE_SYNONYMS) as ['job' | 'house' | 'car' | 'sale', string[]][])
    .filter(([, words]) => words.some((w) => qLower.includes(w)))
    .map(([tp]) => tp);

  const tokens = tokenize(message);

  const scored = listings
    .map((item) => {
      const loc = getLocalizedListingText(item, language);
      const enLoc = getLocalizedListingText(item, 'en');
      const searchable = [
        item.title,
        item.description,
        item.location,
        item.category,
        item.type,
        item.ownerName,
        item.specs?.restaurantName || '',
        item.specs?.brand || '',
        item.specs?.fuel || '',
        item.specs?.transmission || '',
        loc.title,
        loc.description,
        loc.location,
        enLoc.title,
        enLoc.location,
      ]
        .join(' ')
        .toLowerCase();

      let score = 0;
      if (detectedCategories.includes(item.category)) score += 6;
      if (detectedTypes.includes(item.type)) score += 3;
      for (const tok of tokens) {
        if (searchable.includes(tok)) score += 4;
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    const topMatches = scored.slice(0, 4).map((e) => formatListingBullet(e.item, language));
    const count = scored.length;
    const headerByLang: Record<SupportedLang, string> = {
      zh: `为您找到 ${count} 条相关实时信息（以下为精选匹配）：`,
      en: `I found ${count} matching live listing(s) on JobSQUAD:`,
      fr: `J’ai trouvé ${count} annonce(s) correspondante(s) sur JobSQUAD :`,
      es: `Encontré ${count} anuncio(s) coincidente(s) en JobSQUAD:`,
      dz: `JobSQUAD ནང་མཐུན་པའི་གསལ་བསྒྲགས་ ${count} ཐོབ་ཅི།`,
      gsw: `Ich ha ${count} passendi Inserat uf JobSQUAD gfunde:`,
      bo: `JobSQUAD ནང་ཁྱེད་ཀྱི་དགོས་མཁོ་དང་མཐུན་པའི་གསལ་བསྒྲགས་ ${count} རྙེད་བྱུང་།`,
    };
    const tipByLang: Record<SupportedLang, string> = {
      zh: `您也可以在顶部搜索栏输入关键词或城市名称快速定位；如需咨询招聘或租赁细节，请直接使用卡片中的联系方式。`,
      en: `You can also use the header search bar for instant filtering, or open any card to email/view the owner's mobile number.`,
      fr: `Vous pouvez aussi utiliser la barre de recherche en haut ou ouvrir chaque annonce pour contacter l’annonceur.`,
      es: `También puedes usar la barra de búsqueda superior o abrir cada tarjeta para contactar al anunciante.`,
      dz: `ཁྱོད་ཀྱིས་གོང་གི་འཚོལ་ཞིབ་ནང་ཡང་འཚོལ་ཚུགས།`,
      gsw: `Si chönd au d Suechleistene obe bruuche oder direkt uf es Inserat klicke.`,
      bo: `ཁྱེད་ཀྱིས་སྟེང་གི་འཚོལ་བཤེར་སྒྲོམ་ནང་འཚོལ་ཞིབ་བྱེད་པའམ་གསལ་བསྒྲགས་ཁ་ཕྱེ་ནས་འབྲེལ་བ་བྱེད་ཐུབ།`,
    };
    return `${headerByLang[language]}\n${topMatches.join('\n')}\n\n${tipByLang[language]}`;
  }

  // 3. Direct helpful summary with actionable suggestions when query didn't match a specific item
  const fallbackByLang: Record<SupportedLang, string> = {
    zh: `目前平台共有 ${stats.total} 条实时信息：${stats.jobs} 个招聘与求职信息（育儿保姆、餐饮、施工、保洁、长者照护、陪护、求职）、${stats.houses} 套房屋出租、${stats.cars} 辆汽车租赁和 ${stats.sales} 件本地在售商品。\n您可以向我询问具体岗位（如“育儿保姆”或“餐厅厨师”）、城市（如“Paris”或“Zurich”）、如何发布信息或删除账户。如需人工帮助：${supportPhone} / contact.jobsquad@gmail.com。`,
    en: `Here is what's live on JobSQUAD right now: ${stats.jobs} job & looking-for-job posts (Babysitting, Restaurant, Construction, Cleaning, Elderly Care, Companion), ${stats.houses} house rentals, ${stats.cars} car rentals, and ${stats.sales} marketplace sales items (${stats.total} total).\nAsk me about a specific category, city (e.g. Paris, Zurich, Vitry), how to post, or how to manage/delete your account. Direct support: ${supportPhone} · contact.jobsquad@gmail.com.`,
    fr: `Voici l’état en direct sur JobSQUAD : ${stats.jobs} offres et demandes d’emploi, ${stats.houses} locations de maisons, ${stats.cars} locations de voitures et ${stats.sales} articles à vendre (${stats.total} au total).\nDemandez-moi une catégorie (baby-sitting, restaurant, maison, voiture), une ville (Paris, Zurich), comment publier ou gérer votre compte.`,
    es: `Actualmente en JobSQUAD hay ${stats.jobs} empleos y demandas de trabajo, ${stats.houses} casas en alquiler, ${stats.cars} coches en alquiler y ${stats.sales} artículos en venta (${stats.total} en total).\nPregúntame por una categoría (niñera, restaurante, casa, coche), ciudad o cómo publicar y gestionar tu cuenta.`,
    dz: `ད་ལྟོ་ JobSQUAD ནང་བསྡོམས་གསལ་བསྒྲགས་ ${stats.total} ཡོད། གཡོག་ ${stats.jobs} ། ཁྱིམ་གླ་ ${stats.houses} ། སྣུམ་འཁོར་ ${stats.cars} ། ཉོ་ཚོང་ ${stats.sales} ཡོད། དབྱེ་ཁག་དང་ཁྲོམ་སྡེ་ ཡང་ན་གསལ་བསྒྲགས་སྤེལ་ཐངས་སྐོར་དྲི་བ་བཀོད་གནང་།`,
    gsw: `Aktuell sind ${stats.total} Inserat uf JobSQUAD online: ${stats.jobs} Stelle/Stellesuechi, ${stats.houses} Hüser/Wohnige, ${stats.cars} Autos und ${stats.sales} Verchaufsartikel. Fröged Si mi nach ere Kategorie, Stadt oder Kontohilf!`,
    bo: `ད་ལྟ་ JobSQUAD ཐོག་གསལ་བསྒྲགས་ཁྱོན་ ${stats.total} ཡོད། ལས་ཀ་དང་ལས་འཚོལ་ ${stats.jobs} ། ཁང་པ་གླ་གཏོང་ ${stats.houses} ། རླངས་འཁོར་ ${stats.cars} ། ཉོ་ཚོང་ ${stats.sales} བཅས་ཡོད། ལས་རིགས་སམ་གྲོང་ཁྱེར། གསལ་བསྒྲགས་སྤེལ་སྟངས་སྐོར་འདྲི་བ་གནང་ཆོག`,
  };
  return fallbackByLang[language];
}
