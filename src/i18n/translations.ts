import type { CurrencyConfig, SupportedLang } from '../types/index.ts';

export const LANGUAGE_OPTIONS: {
  code: SupportedLang;
  label: string;
  nativeLabel: string;
  currency: CurrencyConfig;
}[] = [
  {
    code: 'zh',
    label: 'Chinese',
    nativeLabel: '中文 (CNY ¥)',
    currency: { code: 'CNY', symbol: '¥', rateFromEur: 7.85, locale: 'zh-CN' },
  },
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English (USD $)',
    currency: { code: 'USD', symbol: '$', rateFromEur: 1.09, locale: 'en-US' },
  },
  {
    code: 'fr',
    label: 'French',
    nativeLabel: 'Français (EUR €)',
    currency: { code: 'EUR', symbol: '€', rateFromEur: 1.0, locale: 'fr-FR' },
  },
  {
    code: 'es',
    label: 'Spanish',
    nativeLabel: 'Español (EUR €)',
    currency: { code: 'EUR', symbol: '€', rateFromEur: 1.0, locale: 'es-ES' },
  },
  {
    code: 'dz',
    label: 'Dzongkha',
    nativeLabel: 'རྫོང་ཁ (BTN Nu.)',
    currency: { code: 'BTN', symbol: 'Nu.', rateFromEur: 91.5, locale: 'en-IN' },
  },
  {
    code: 'gsw',
    label: 'Swiss German',
    nativeLabel: 'Schwiizerdütsch (CHF)',
    currency: { code: 'CHF', symbol: 'CHF ', rateFromEur: 0.95, locale: 'de-CH' },
  },
];

export function formatLocalizedPrice(
  priceEur: number,
  lang: SupportedLang,
  period?: 'month' | 'day' | 'hour' | 'once'
): string {
  const opt = LANGUAGE_OPTIONS.find((l) => l.code === lang) || LANGUAGE_OPTIONS[0];
  const converted = Math.round(priceEur * opt.currency.rateFromEur);
  const formatted = new Intl.NumberFormat(opt.currency.locale).format(converted);
  const suffixMap = UI_TEXT[lang].periodSuffix;
  const suffix = period ? suffixMap[period] : '';
  return `${opt.currency.symbol}${formatted}${suffix}`;
}

export function formatPostDateTime(
  timestamp: number | undefined,
  lang: SupportedLang
): string {
  if (!timestamp || !Number.isFinite(timestamp)) return '—';
  const opt = LANGUAGE_OPTIONS.find((l) => l.code === lang) || LANGUAGE_OPTIONS[1];
  const locale = opt.code === 'dz' ? 'en-US' : opt.currency.locale;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export interface UIStrings {
  contactUs: string;
  navAbout: string;
  navRecruitment: string;
  navRentals: string;
  navHouse: string;
  navCar: string;
  navSales: string;
  registerLogin: string;
  postListing: string;
  myPosts: string;
  adminPanel: string;
  signOut: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  statJobs: string;
  statHouses: string;
  statCars: string;
  statSales: string;
  aboutHeading: string;
  aboutLead: string;
  aboutCards: { title: string; body: string }[];
  recruitmentHeading: string;
  recruitmentLead: string;
  allCategories: string;
  categories: Record<string, string>;
  rentalsHeading: string;
  rentalsLead: string;
  houseTab: string;
  carTab: string;
  salesHeading: string;
  salesLead: string;
  sendEmail: string;
  emailOwner: string;
  emailSeller: string;
  sharePost: string;
  linkCopied: string;
  viewDetails: string;
  ownerMobile: string;
  sellerMobile: string;
  recruiterMobile: string;
  editPost: string;
  deletePost: string;
  confirmDelete: string;
  noListings: string;
  periodSuffix: Record<'month' | 'day' | 'hour' | 'once', string>;
  specsLabels: {
    bedrooms: string;
    bathrooms: string;
    area: string;
    furnished: string;
    yes: string;
    no: string;
    year: string;
    transmission: string;
    fuel: string;
    seats: string;
    condition: string;
    brand: string;
    location: string;
    postedBy: string;
    postedAt: string;
    restaurantName: string;
  };
  contactModal: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    submit: string;
    sending: string;
    success: string;
  };
  authModal: {
    title: string;
    subtitle: string;
    registerTab: string;
    loginTab: string;
    email: string;
    password: string;
    createAccountBtn: string;
    loginBtn: string;
    orGoogle: string;
    googleBtn: string;
    completeProfile: string;
    displayName: string;
    phone: string;
    accountType: string;
    seeker: string;
    employer: string;
    lister: string;
    saveProfile: string;
    signedInAs: string;
  };
  listingModal: {
    createTitle: string;
    editTitle: string;
    type: string;
    typeJob: string;
    typeHouse: string;
    typeCar: string;
    typeSale: string;
    category: string;
    titleLabel: string;
    locationLabel: string;
    priceEurLabel: string;
    emailLabel: string;
    phoneLabel: string;
    phoneRequiredNote: string;
    imagesLabel: string;
    imagesRequiredNote: string;
    uploadHint: string;
    descriptionLabel: string;
    submitCreate: string;
    submitSave: string;
    translating: string;
  };
  captchaLabel: string;
  captchaPlaceholder: string;
  chatbotTitle: string;
  chatbotPlaceholder: string;
  chatbotSend: string;
  upToTop: string;
  footerTagline: string;
  footerContactHeading: string;
  footerSocialHeading: string;
  footerRights: string;
}

export const UI_TEXT: Record<SupportedLang, UIStrings> = {
  zh: {
    contactUs: '联系我们',
    navAbout: '关于我们',
    navRecruitment: '招聘求职',
    navRentals: '房屋与租车',
    navHouse: '房屋出租',
    navCar: '汽车租赁',
    navSales: '本地集市',
    registerLogin: '注册 / 登录',
    postListing: '发布信息',
    myPosts: '我的发布',
    adminPanel: '管理员控制台',
    signOut: '退出登录',
    heroTitle: '连接理想职业、优质居所与可信赖社区交易',
    heroSubtitle:
      'JobSQUAD 致力于为求职者、雇主、房东与本地卖家打造安全、透明、多语言互通的一站式招聘与生活服务平台。',
    heroCtaPrimary: '浏览在招职位',
    heroCtaSecondary: '发布信息',
    statJobs: '在招职位',
    statHouses: '房源出租',
    statCars: '车辆可租',
    statSales: '在售物品',
    aboutHeading: '关于 JobSQUAD',
    aboutLead:
      '专为求职者高效寻觅良机而打造。我们消除信息壁垒，让雇主快速发布空缺岗位，让家庭与个人轻松完成租房、租车及本地闲置交易。',
    aboutCards: [
      {
        title: '01. 精准招聘匹配',
        body: '覆盖育儿保姆、餐饮服务、建筑工程、家庭保洁、长者照护与陪护等核心岗位，求职者可直接发邮件联系雇主，沟通零阻碍。',
      },
      {
        title: '02. 实名认证发布',
        body: '所有发帖用户均须完成账户注册与安全校验；房屋、汽车及商品发布强制要求上传实拍图片并公开有效联系电话。',
      },
      {
        title: '03. 多语言与多币种同步',
        body: '支持中文、英语、法语、西班牙语、宗喀语及瑞士德语一键切换，全站内容与价格货币实时自动转换。',
      },
    ],
    recruitmentHeading: '招聘职位',
    recruitmentLead: '按行业分类浏览雇主发布的实时岗位，直接发送邮件与雇主取得联系或分享职位。',
    allCategories: '全部职位',
    categories: {
      babysitting: '育儿保姆',
      restaurant: '餐饮服务',
      construction: '建筑施工',
      cleaning: '专业保洁',
      elderly_care: '长者照护',
      companion: '陪护服务',
      apartment: '精品公寓',
      villa: '家庭别墅',
      sedan: '豪华轿车',
      suv: 'SUV 越野',
      electronics: '数码电子',
      furniture: '家居家具',
      appliances: '生活家电',
    },
    rentalsHeading: '房屋与汽车租赁',
    rentalsLead: '点击查看详情即可获取房东或车主的直接联系电话与联系邮箱。',
    houseTab: '房屋出租',
    carTab: '汽车租赁',
    salesHeading: '本地集市交易',
    salesLead: '浏览认证会员发布的精选二手与新品好物，点击查看卖家电话与邮箱。',
    sendEmail: '发送邮件',
    emailOwner: '邮件联系业主',
    emailSeller: '邮件联系卖家',
    sharePost: '分享信息',
    linkCopied: '链接已复制',
    viewDetails: '查看详情',
    ownerMobile: '业主手机号码',
    sellerMobile: '卖家手机号码',
    recruiterMobile: '招聘方手机',
    editPost: '编辑',
    deletePost: '删除',
    confirmDelete: '确定删除此信息吗？',
    noListings: '当前分类暂无信息，欢迎注册后发布第一条内容。',
    periodSuffix: { month: '/月', day: '/天', hour: '/小时', once: '' },
    specsLabels: {
      bedrooms: '卧室',
      bathrooms: '卫浴',
      area: '面积',
      furnished: '精装家具',
      yes: '有',
      no: '无',
      year: '年份',
      transmission: '变速箱',
      fuel: '动力',
      seats: '座位数',
      condition: '成色',
      brand: '品牌',
      location: '地点',
      postedBy: '发布者',
      postedAt: '发布时间',
      restaurantName: '餐厅名称',
    },
    contactModal: {
      title: '联系管理员',
      subtitle: '有合作、审核或平台咨询？请填写以下表单，我们将尽快通过邮件回复您。',
      name: '您的姓名',
      email: '电子邮箱',
      phone: '手机号码（选填）',
      subject: '主题',
      message: '留言内容',
      submit: '发送留言',
      sending: '正在发送...',
      success: '您的留言已安全提交，管理员将尽快联系您！',
    },
    authModal: {
      title: '会员注册与登录',
      subtitle: '请填写信息完成注册，或直接使用 Google 账号登录发布职位、房屋、车辆及商品。',
      registerTab: '注册账号',
      loginTab: '账号登录',
      email: '电子邮箱',
      password: '登录密码（至少8位）',
      createAccountBtn: '立即注册并登录',
      loginBtn: '安全登录',
      orGoogle: '或直接使用 Google 账号',
      googleBtn: '使用 Google 账号安全登录',
      completeProfile: '完善注册资料',
      displayName: '显示名称 / 公司名称',
      phone: '手机号码',
      accountType: '账户类型',
      seeker: '求职者',
      employer: '招聘雇主',
      lister: '房东 / 车主 / 卖家',
      saveProfile: '完成注册并保存',
      signedInAs: '当前登录',
    },
    listingModal: {
      createTitle: '发布新信息',
      editTitle: '编辑信息',
      type: '信息类型',
      typeJob: '招聘职位',
      typeHouse: '房屋出租',
      typeCar: '汽车租赁',
      typeSale: '物品出售',
      category: '所属分类',
      titleLabel: '信息标题',
      locationLabel: '所在城市 / 地址',
      priceEurLabel: '金额基准（欧元 EUR，前台自动换算当地货币）',
      emailLabel: '联系邮箱',
      phoneLabel: '手机号码',
      phoneRequiredNote: '房屋、租车及出售信息必须填写有效手机号码。',
      imagesLabel: '上传图片（最多 3 张）',
      imagesRequiredNote: '房屋、租车及出售信息必须上传至少 1 张实拍图片。',
      uploadHint: '点击选择图片文件（自动压缩以保证极速加载）',
      descriptionLabel: '详细描述',
      submitCreate: '验证并发布（自动生成 6 国语言）',
      submitSave: '保存修改',
      translating: '正在智能生成 6 国语言并保存...',
    },
    captchaLabel: '安全人机验证',
    captchaPlaceholder: '输入计算结果',
    chatbotTitle: 'JobSQUAD 在线客服助手',
    chatbotPlaceholder: '询问职位、租房、租车或集市信息...',
    chatbotSend: '发送',
    upToTop: '返回顶部',
    footerTagline: '安全、透明的多语言招聘与社区生活服务平台。',
    footerContactHeading: '联系方式',
    footerSocialHeading: '关注社交媒体',
    footerRights: '版权所有',
  },
  en: {
    contactUs: 'Contact Us',
    navAbout: 'About Us',
    navRecruitment: 'Recruitment',
    navRentals: 'Rentals',
    navHouse: 'House',
    navCar: 'Car',
    navSales: 'Sales',
    registerLogin: 'Register / Log In',
    postListing: 'Post Listing',
    myPosts: 'My Posts',
    adminPanel: 'Admin Console',
    signOut: 'Sign Out',
    heroTitle: 'Connecting Talent, Trusted Homes & Local Commerce',
    heroSubtitle:
      'JobSQUAD empowers job seekers to discover verified vacancies easily while enabling registered members to publish house rentals, car hire, and local marketplace sales.',
    heroCtaPrimary: 'Explore Vacancies',
    heroCtaSecondary: 'Post a Listing',
    statJobs: 'Open Vacancies',
    statHouses: 'Houses for Rent',
    statCars: 'Cars for Hire',
    statSales: 'Items for Sale',
    aboutHeading: 'About JobSQUAD',
    aboutLead:
      'Built to provide effortless solutions for job seekers and trusted community listings. Employers publish roles according to availability, and verified members manage rentals and sales in one secure hub.',
    aboutCards: [
      {
        title: '01. Direct Employer Connections',
        body: 'Browse curated categories including Babysitting, Restaurant, Construction, Cleaning, Elderly Care, and Companion roles. Reach employers directly via your email client.',
      },
      {
        title: '02. Verified Member Publishing',
        body: 'All contributors register and pass security verification. House, car, and sales listings mandate real photo uploads and direct owner mobile numbers.',
      },
      {
        title: '03. Six-Language Localization',
        body: 'Switch seamlessly between Chinese, English, French, Spanish, Dzongkha, and Swiss German with automatic live currency conversion across every listing.',
      },
    ],
    recruitmentHeading: 'Recruitment Vacancies',
    recruitmentLead: 'Select a category below to browse active openings, email employers directly, or share posts.',
    allCategories: 'All Roles',
    categories: {
      babysitting: 'Babysitting',
      restaurant: 'Restaurant',
      construction: 'Construction',
      cleaning: 'Cleaning',
      elderly_care: 'Elderly Care',
      companion: 'Hire Companion',
      apartment: 'Apartment',
      villa: 'Family House',
      sedan: 'Sedan',
      suv: 'SUV',
      electronics: 'Electronics',
      furniture: 'Furniture',
      appliances: 'Appliances',
    },
    rentalsHeading: 'House & Car Rentals',
    rentalsLead: 'Open any listing to inspect full specifications and view the owner mobile number before emailing.',
    houseTab: 'House Rentals',
    carTab: 'Car Rentals',
    salesHeading: 'Local Sales Marketplace',
    salesLead: 'Explore items posted by registered sellers. View details to access seller phone and email contact.',
    sendEmail: 'Send Email',
    emailOwner: 'Email Owner',
    emailSeller: 'Email Seller',
    sharePost: 'Share Post',
    linkCopied: 'Link Copied',
    viewDetails: 'View Details',
    ownerMobile: 'Owner Mobile Number',
    sellerMobile: 'Seller Mobile Number',
    recruiterMobile: 'Recruiter Mobile',
    editPost: 'Edit',
    deletePost: 'Delete',
    confirmDelete: 'Are you sure you want to delete this listing?',
    noListings: 'No active listings in this category yet.',
    periodSuffix: { month: '/mo', day: '/day', hour: '/hr', once: '' },
    specsLabels: {
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms',
      area: 'Area',
      furnished: 'Furnished',
      yes: 'Yes',
      no: 'No',
      year: 'Year',
      transmission: 'Transmission',
      fuel: 'Fuel',
      seats: 'Seats',
      condition: 'Condition',
      brand: 'Brand',
      location: 'Location',
      postedBy: 'Posted by',
      postedAt: 'Posted on',
      restaurantName: 'Restaurant Name',
    },
    contactModal: {
      title: 'Contact Administrator',
      subtitle: 'Questions, moderation requests, or partnership inquiries? Send us a direct message below.',
      name: 'Your Name',
      email: 'Email Address',
      phone: 'Mobile Number (Optional)',
      subject: 'Subject',
      message: 'Message',
      submit: 'Send Message',
      sending: 'Sending...',
      success: 'Your inquiry has been delivered to our administrator!',
    },
    authModal: {
      title: 'Register / Log In',
      subtitle: 'Create an account with your details below, log in with existing credentials, or sign in directly with Google.',
      registerTab: 'Register',
      loginTab: 'Log In',
      email: 'Email Address',
      password: 'Password (min 8 characters)',
      createAccountBtn: 'Create Account',
      loginBtn: 'Log In',
      orGoogle: 'Or sign in directly with Google',
      googleBtn: 'Continue with Google',
      completeProfile: 'Complete Member Profile',
      displayName: 'Full Name / Company Name',
      phone: 'Mobile Number',
      accountType: 'Account Role',
      seeker: 'Job Seeker',
      employer: 'Employer',
      lister: 'Owner / Seller',
      saveProfile: 'Complete Registration',
      signedInAs: 'Signed in as',
    },
    listingModal: {
      createTitle: 'Create New Listing',
      editTitle: 'Edit Listing',
      type: 'Listing Category',
      typeJob: 'Job Vacancy',
      typeHouse: 'House Rental',
      typeCar: 'Car Rental',
      typeSale: 'Sale Item',
      category: 'Subcategory',
      titleLabel: 'Title',
      locationLabel: 'Location',
      priceEurLabel: 'Base Amount (EUR — converted automatically per language)',
      emailLabel: 'Contact Email',
      phoneLabel: 'Mobile Number',
      phoneRequiredNote: 'Mobile number is mandatory for House, Car, and Sales listings.',
      imagesLabel: 'Upload Photos (up to 3)',
      imagesRequiredNote: 'At least 1 uploaded photo is required for House, Car, and Sales listings.',
      uploadHint: 'Choose image files (automatically optimized)',
      descriptionLabel: 'Detailed Description',
      submitCreate: 'Translate to 6 Languages & Publish',
      submitSave: 'Save Changes',
      translating: 'Translating & publishing...',
    },
    captchaLabel: 'Security CAPTCHA',
    captchaPlaceholder: 'Answer',
    chatbotTitle: 'JobSQUAD Online Help',
    chatbotPlaceholder: 'Ask about jobs, rentals, or sales...',
    chatbotSend: 'Send',
    upToTop: 'Up to Top',
    footerTagline: 'Trusted multilingual recruitment, rentals, and local commerce platform.',
    footerContactHeading: 'Direct Contact',
    footerSocialHeading: 'Social Channels',
    footerRights: 'All rights reserved.',
  },
  fr: {
    contactUs: 'Contactez-nous',
    navAbout: 'À propos',
    navRecruitment: 'Recrutement',
    navRentals: 'Locations',
    navHouse: 'Maison',
    navCar: 'Voiture',
    navSales: 'Ventes',
    registerLogin: 'Inscription / Connexion',
    postListing: 'Publier une annonce',
    myPosts: 'Mes annonces',
    adminPanel: 'Administration',
    signOut: 'Déconnexion',
    heroTitle: 'Connecter les talents, les logements et le commerce local',
    heroSubtitle:
      'JobSQUAD aide les chercheurs d’emploi à trouver des offres vérifiées tout en permettant aux membres inscrits de publier locations et ventes.',
    heroCtaPrimary: 'Voir les offres',
    heroCtaSecondary: 'Publier une annonce',
    statJobs: 'Offres actives',
    statHouses: 'Maisons à louer',
    statCars: 'Voitures à louer',
    statSales: 'Articles en vente',
    aboutHeading: 'À propos de JobSQUAD',
    aboutLead:
      'Conçu pour simplifier la recherche d’emploi et sécuriser les annonces locales : emploi, immobilier, véhicules et ventes entre particuliers.',
    aboutCards: [
      {
        title: '01. Recrutement direct',
        body: 'Baby-sitting, restauration, bâtiment, nettoyage, aide aux personnes âgées et accompagnement. Contactez les employeurs directement par e-mail.',
      },
      {
        title: '02. Publications vérifiées',
        body: 'Tous les annonceurs sont inscrits et vérifiés. Les annonces immobilières, automobiles et ventes exigent photos et numéro de mobile.',
      },
      {
        title: '03. Six langues & devises',
        body: 'Basculez entre chinois, français, anglais, espagnol, dzongkha et suisse allemand avec conversion automatique des prix.',
      },
    ],
    recruitmentHeading: 'Offres d’emploi',
    recruitmentLead: 'Filtrez par catégorie, envoyez un e-mail direct à l’employeur ou partagez une annonce.',
    allCategories: 'Toutes les catégories',
    categories: {
      babysitting: 'Baby-sitting',
      restaurant: 'Restauration',
      construction: 'Bâtiment',
      cleaning: 'Nettoyage',
      elderly_care: 'Aide aux aînés',
      companion: 'Compagnonnage',
      apartment: 'Appartement',
      villa: 'Maison',
      sedan: 'Berline',
      suv: 'SUV',
      electronics: 'Électronique',
      furniture: 'Mobilier',
      appliances: 'Électroménager',
    },
    rentalsHeading: 'Locations Maisons & Voitures',
    rentalsLead: 'Cliquez sur « Voir les détails » pour afficher le mobile du propriétaire avant d’envoyer un e-mail.',
    houseTab: 'Maisons',
    carTab: 'Voitures',
    salesHeading: 'Marché des ventes locales',
    salesLead: 'Découvrez les articles publiés par les vendeurs inscrits avec numéro de mobile et e-mail.',
    sendEmail: 'Envoyer un e-mail',
    emailOwner: 'Contacter le propriétaire',
    emailSeller: 'Contacter le vendeur',
    sharePost: 'Partager',
    linkCopied: 'Lien copié',
    viewDetails: 'Voir les détails',
    ownerMobile: 'Mobile du propriétaire',
    sellerMobile: 'Mobile du vendeur',
    recruiterMobile: 'Mobile du recruteur',
    editPost: 'Modifier',
    deletePost: 'Supprimer',
    confirmDelete: 'Voulez-vous vraiment supprimer cette annonce ?',
    noListings: 'Aucune annonce dans cette catégorie pour le moment.',
    periodSuffix: { month: '/mois', day: '/jour', hour: '/h', once: '' },
    specsLabels: {
      bedrooms: 'Chambres',
      bathrooms: 'Salles de bain',
      area: 'Surface',
      furnished: 'Meublé',
      yes: 'Oui',
      no: 'Non',
      year: 'Année',
      transmission: 'Boîte',
      fuel: 'Carburant',
      seats: 'Places',
      condition: 'État',
      brand: 'Marque',
      location: 'Lieu',
      postedBy: 'Publié par',
      postedAt: 'Publié le',
      restaurantName: 'Nom du restaurant',
    },
    contactModal: {
      title: 'Contacter l’administrateur',
      subtitle: 'Une question ou demande ? Envoyez un message sécurisé ci-dessous.',
      name: 'Nom complet',
      email: 'Adresse e-mail',
      phone: 'Mobile (Optionnel)',
      subject: 'Objet',
      message: 'Message',
      submit: 'Envoyer le message',
      sending: 'Envoi...',
      success: 'Votre message a bien été transmis à l’administrateur !',
    },
    authModal: {
      title: 'Inscription / Connexion',
      subtitle: 'Créez un compte avec vos informations ou connectez-vous directement avec Google.',
      registerTab: 'Inscription',
      loginTab: 'Connexion',
      email: 'Adresse e-mail',
      password: 'Mot de passe (8 car. min)',
      createAccountBtn: 'Créer mon compte',
      loginBtn: 'Se connecter',
      orGoogle: 'Ou continuer avec Google',
      googleBtn: 'Continuer avec Google',
      completeProfile: 'Compléter le profil',
      displayName: 'Nom / Société',
      phone: 'Numéro de mobile',
      accountType: 'Profil',
      seeker: 'Chercheur d’emploi',
      employer: 'Employeur',
      lister: 'Propriétaire / Vendeur',
      saveProfile: 'Valider l’inscription',
      signedInAs: 'Connecté :',
    },
    listingModal: {
      createTitle: 'Publier une annonce',
      editTitle: 'Modifier l’annonce',
      type: 'Type d’annonce',
      typeJob: 'Offre d’emploi',
      typeHouse: 'Location Maison',
      typeCar: 'Location Voiture',
      typeSale: 'Vente',
      category: 'Catégorie',
      titleLabel: 'Titre',
      locationLabel: 'Ville / Quartier',
      priceEurLabel: 'Montant de base (EUR)',
      emailLabel: 'E-mail de contact',
      phoneLabel: 'Numéro de mobile',
      phoneRequiredNote: 'Le numéro de mobile est obligatoire pour Maisons, Voitures et Ventes.',
      imagesLabel: 'Photos (max 3)',
      imagesRequiredNote: 'Au moins 1 photo est requise pour Maisons, Voitures et Ventes.',
      uploadHint: 'Sélectionner des images',
      descriptionLabel: 'Description détaillée',
      submitCreate: 'Traduire en 6 langues et publier',
      submitSave: 'Enregistrer',
      translating: 'Traduction et publication...',
    },
    captchaLabel: 'Vérification CAPTCHA',
    captchaPlaceholder: 'Réponse',
    chatbotTitle: 'Aide en ligne JobSQUAD',
    chatbotPlaceholder: 'Posez une question...',
    chatbotSend: 'Envoyer',
    upToTop: 'Haut de page',
    footerTagline: 'Plateforme multilingue de recrutement, locations et ventes locales.',
    footerContactHeading: 'Coordonnées',
    footerSocialHeading: 'Réseaux sociaux',
    footerRights: 'Tous droits réservés.',
  },
  es: {
    contactUs: 'Contáctanos',
    navAbout: 'Nosotros',
    navRecruitment: 'Empleo',
    navRentals: 'Alquileres',
    navHouse: 'Casas',
    navCar: 'Coches',
    navSales: 'Ventas',
    registerLogin: 'Registro / Acceso',
    postListing: 'Publicar anuncio',
    myPosts: 'Mis anuncios',
    adminPanel: 'Panel Admin',
    signOut: 'Salir',
    heroTitle: 'Conectando talento, hogares y comercio local confiable',
    heroSubtitle:
      'JobSQUAD facilita la búsqueda de empleo y permite a usuarios registrados publicar alquileres de casas, coches y ventas locales.',
    heroCtaPrimary: 'Ver vacantes',
    heroCtaSecondary: 'Publicar anuncio',
    statJobs: 'Vacantes activas',
    statHouses: 'Casas en alquiler',
    statCars: 'Coches en alquiler',
    statSales: 'Artículos en venta',
    aboutHeading: 'Sobre JobSQUAD',
    aboutLead:
      'Diseñado para ofrecer soluciones reales a quienes buscan empleo y una comunidad segura para alquileres y ventas locales.',
    aboutCards: [
      {
        title: '01. Contacto directo con empleadores',
        body: 'Categorías de Niñera, Restaurante, Construcción, Limpieza, Cuidado de mayores y Acompañamiento con contacto directo por correo.',
      },
      {
        title: '02. Publicación verificada',
        body: 'Todo usuario debe registrarse. Casas, coches y ventas requieren subir fotos reales y número móvil obligatorio.',
      },
      {
        title: '03. Seis idiomas y divisas',
        body: 'Cambia entre chino, inglés, francés, español, dzongkha y alemán suizo con conversión automática de moneda.',
      },
    ],
    recruitmentHeading: 'Vacantes de empleo',
    recruitmentLead: 'Filtra por sector, envía un correo directo al empleador o comparte la oferta.',
    allCategories: 'Todas',
    categories: {
      babysitting: 'Niñera / Cuidado',
      restaurant: 'Restauración',
      construction: 'Construcción',
      cleaning: 'Limpieza',
      elderly_care: 'Cuidado mayores',
      companion: 'Acompañante',
      apartment: 'Apartamento',
      villa: 'Casa familiar',
      sedan: 'Sedán',
      suv: 'SUV',
      electronics: 'Electrónica',
      furniture: 'Muebles',
      appliances: 'Electrodomésticos',
    },
    rentalsHeading: 'Alquiler de Casas y Coches',
    rentalsLead: 'Abre los detalles para ver el número móvil del propietario antes de enviar correo.',
    houseTab: 'Casas',
    carTab: 'Coches',
    salesHeading: 'Mercado local de ventas',
    salesLead: 'Explora artículos publicados por vendedores verificados con móvil y correo electrónico.',
    sendEmail: 'Enviar correo',
    emailOwner: 'Escribir al propietario',
    emailSeller: 'Escribir al vendedor',
    sharePost: 'Compartir',
    linkCopied: 'Enlace copiado',
    viewDetails: 'Ver detalles',
    ownerMobile: 'Móvil del propietario',
    sellerMobile: 'Móvil del vendedor',
    recruiterMobile: 'Móvil del reclutador',
    editPost: 'Editar',
    deletePost: 'Eliminar',
    confirmDelete: '¿Seguro que deseas eliminar este anuncio?',
    noListings: 'No hay anuncios en esta categoría todavía.',
    periodSuffix: { month: '/mes', day: '/día', hour: '/h', once: '' },
    specsLabels: {
      bedrooms: 'Habitaciones',
      bathrooms: 'Baños',
      area: 'Área',
      furnished: 'Amueblado',
      yes: 'Sí',
      no: 'No',
      year: 'Año',
      transmission: 'Transmisión',
      fuel: 'Combustible',
      seats: 'Plazas',
      condition: 'Estado',
      brand: 'Marca',
      location: 'Ubicación',
      postedBy: 'Publicado por',
      postedAt: 'Publicado el',
      restaurantName: 'Nombre del restaurante',
    },
    contactModal: {
      title: 'Contactar al administrador',
      subtitle: '¿Tienes dudas o consultas? Envía tu mensaje mediante el formulario seguro.',
      name: 'Nombre completo',
      email: 'Correo electrónico',
      phone: 'Móvil (Opcional)',
      subject: 'Asunto',
      message: 'Mensaje',
      submit: 'Enviar mensaje',
      sending: 'Enviando...',
      success: '¡Tu mensaje ha sido enviado al administrador!',
    },
    authModal: {
      title: 'Registro / Iniciar sesión',
      subtitle: 'Regístrate con tus datos o inicia sesión directamente con tu cuenta de Google.',
      registerTab: 'Registrarse',
      loginTab: 'Iniciar sesión',
      email: 'Correo electrónico',
      password: 'Contraseña (mín. 8 caracteres)',
      createAccountBtn: 'Crear cuenta',
      loginBtn: 'Iniciar sesión',
      orGoogle: 'O entra directamente con Google',
      googleBtn: 'Continuar con Google',
      completeProfile: 'Completar perfil',
      displayName: 'Nombre o empresa',
      phone: 'Número móvil',
      accountType: 'Tipo de cuenta',
      seeker: 'Buscador de empleo',
      employer: 'Empleador',
      lister: 'Propietario / Vendedor',
      saveProfile: 'Guardar registro',
      signedInAs: 'Conectado como',
    },
    listingModal: {
      createTitle: 'Publicar anuncio',
      editTitle: 'Editar anuncio',
      type: 'Tipo',
      typeJob: 'Vacante de empleo',
      typeHouse: 'Alquiler de casa',
      typeCar: 'Alquiler de coche',
      typeSale: 'Artículo en venta',
      category: 'Categoría',
      titleLabel: 'Título',
      locationLabel: 'Ubicación',
      priceEurLabel: 'Importe base (EUR)',
      emailLabel: 'Correo de contacto',
      phoneLabel: 'Número móvil',
      phoneRequiredNote: 'El número móvil es obligatorio para Casas, Coches y Ventas.',
      imagesLabel: 'Subir fotos (máx. 3)',
      imagesRequiredNote: 'Se requiere al menos 1 foto para Casas, Coches y Ventas.',
      uploadHint: 'Seleccionar imágenes',
      descriptionLabel: 'Descripción detallada',
      submitCreate: 'Traducir a 6 idiomas y publicar',
      submitSave: 'Guardar cambios',
      translating: 'Traduciendo y publicando...',
    },
    captchaLabel: 'Verificación CAPTCHA',
    captchaPlaceholder: 'Respuesta',
    chatbotTitle: 'Asistente en línea JobSQUAD',
    chatbotPlaceholder: 'Pregunta sobre empleos, alquileres o ventas...',
    chatbotSend: 'Enviar',
    upToTop: 'Subir arriba',
    footerTagline: 'Plataforma multilingüe de empleo, alquileres y comercio local.',
    footerContactHeading: 'Contacto directo',
    footerSocialHeading: 'Redes sociales',
    footerRights: 'Todos los derechos reservados.',
  },
  dz: {
    contactUs: 'འབྲེལ་བ་འཐབ།',
    navAbout: 'ངེད་ཀྱི་སྐོར།',
    navRecruitment: 'གཡོག་བསྡུ།',
    navRentals: 'གླ་ཁྱིམ་དང་སྣུམ་འཁོར།',
    navHouse: 'ཁྱིམ་གླ།',
    navCar: 'སྣུམ་འཁོར་གླ།',
    navSales: 'ཉོ་ཚོང་ཁྲོམ།',
    registerLogin: 'ཐོ་བཀོད་ / ནང་བསྐྱོད།',
    postListing: 'གསལ་བསྒྲགས་སྤེལ།',
    myPosts: 'ངེད་ཀྱི་གསལ་བསྒྲགས།',
    adminPanel: 'བདག་སྐྱོང་པ།',
    signOut: 'ཕྱིར་ཐོན།',
    heroTitle: 'གཡོག་གི་གོ་སྐབས་དང་ ཁྱིམ་གླ་ ཉོ་ཚོང་བཅས་གཅིག་ཏུ་མཐུད་པ།',
    heroSubtitle:
      'JobSQUAD གིས་ གཡོག་འཚོལ་མི་ཚུ་ལུ་ གཡོག་འཚོལ་ནི་འཇམ་ཏོང་ཏོ་བཟོ་ནི་དང་ འཐུས་མི་ཚུ་གིས་ ཁྱིམ་གླ་དང་སྣུམ་འཁོར་ ཅ་ལག་ཚོང་སྒྱུར་ཚུ་ཉེན་སྲུང་ཅན་སྦེ་སྤེལ་ཚུགས།',
    heroCtaPrimary: 'གཡོག་གསལ་བསྒྲགས་བལྟ།',
    heroCtaSecondary: 'གསལ་བསྒྲགས་སྤེལ།',
    statJobs: 'གཡོག་གོ་སྐབས།',
    statHouses: 'ཁྱིམ་གླ།',
    statCars: 'སྣུམ་འཁོར་གླ།',
    statSales: 'ཉོ་ཚོང་ཅ་ལག',
    aboutHeading: 'JobSQUAD གི་སྐོར།',
    aboutLead:
      'གཡོག་འཚོལ་མི་ཚུ་ལུ་ གཡོག་གོ་སྐབས་འཇམ་སམ་སྦེ་འཐོབ་ཚུགས་ནི་དང་ ཁྱིམ་གླ་དང་སྣུམ་འཁོར་ ཉོ་ཚོང་ཚུ་ཉེན་སྲུང་ཅན་སྦེ་བཀོད་སྒྲིག་འབད་བའི་སྟེགས་བུ་ཨིན།',
    aboutCards: [
      {
        title: '01. གཡོག་བདག་དང་ཐད་ཀར་འབྲེལ་བ།',
        body: 'ཨ་ལུ་ལྟ་རྟོག་ ཟ་ཁང་ བཟོ་སྐྲུན་ གཙང་སྦྲ་ རྒན་ཤོས་ལྟ་རྟོག་ དང་ རོགས་པ་བཅས་ཀྱི་གཡོག་ལུ་ ཐད་ཀར་ཡིག་འཕྲིན་གཏང་ཚུགས།',
      },
      {
        title: '02. འཐུས་མི་ངོ་མའི་གསལ་བསྒྲགས།',
        body: 'ཁྱིམ་གླ་དང་སྣུམ་འཁོར་ ཉོ་ཚོང་ཅ་ལག་ཚུ་ལུ་ དཔར་དང་འགྲུལ་འཕྲིན་ཨང་གྲངས་ངེས་པར་དུ་བཙུགས་དགོ།',
      },
      {
        title: '03. སྐད་ཡིག་དྲུག་དང་དངུལ་ཀྲམ།',
        body: 'རྒྱ་ནག་ ཨིང་ལིཤ་ ཕེ་རེནཆ་ ཨིསི་པེ་ནིཤ་ རྫོང་ཁ་ དང་ སུ་ཝིསི་ཇར་མཱན་བཅས་ཀྱི་སྐད་ཡིག་དང་དངུལ་ཀྲམ་རང་བཞིན་གྱིས་བསྒྱུརཝ་ཨིན།',
      },
    ],
    recruitmentHeading: 'གཡོག་བསྡུའི་གསལ་བསྒྲགས།',
    recruitmentLead: 'གཡོག་གི་དབྱེ་བ་གདམ་ཁ་རྐྱབས་ཏེ་ གཡོག་བདག་ལུ་ཡིག་འཕྲིན་གཏང་གནང་།',
    allCategories: 'ཆ་མཉམ།',
    categories: {
      babysitting: 'ཨ་ལུ་ལྟ་རྟོག',
      restaurant: 'ཟ་ཁང་ལས་གཡོག',
      construction: 'བཟོ་སྐྲུན།',
      cleaning: 'གཙང་སྦྲ།',
      elderly_care: 'རྒན་ཤོས་ལྟ་རྟོག',
      companion: 'རོགས་པ།',
      apartment: 'སྡོད་ཁྱིམ།',
      villa: 'ཁྱིམ་གཞིས།',
      sedan: 'སེ་ཌཱན་སྣུམ་འཁོར།',
      suv: 'ཨེསི་ཡུ་ཝི་སྣུམ་འཁོར།',
      electronics: 'གློག་ཆས།',
      furniture: 'ཁྱིམ་ཆས།',
      appliances: 'ནང་ཆས།',
    },
    rentalsHeading: 'ཁྱིམ་དང་སྣུམ་འཁོར་གླ་ཁ།',
    rentalsLead: 'ཁ་གསལ་བལྟ་བའི་སྐབས་ ཇོ་བདག་གི་འགྲུལ་འཕྲིན་ཨང་གྲངས་དང་ཡིག་འཕྲིན་མཐོང་ཚུགས།',
    houseTab: 'ཁྱིམ་གླ།',
    carTab: 'སྣུམ་འཁོར་གླ།',
    salesHeading: 'ས་གནས་ཉོ་ཚོང་ཁྲོམ།',
    salesLead: 'ཚོང་པ་ཚུ་གིས་བཀལ་བའི་ཅ་ལག་ཚུ་བལྟ་ཞིན་ན་ ཁ་པར་དང་ཡིག་འཕྲིན་ཐོག་འབྲེལ་བ་འཐབ།',
    sendEmail: 'ཡིག་འཕྲིན་གཏང་།',
    emailOwner: 'ཇོ་བདག་ལུ་ཡིག་འཕྲིན་གཏང་།',
    emailSeller: 'ཚོང་པ་ལུ་ཡིག་འཕྲིན་གཏང་།',
    sharePost: 'བགོ་བཤའ་རྐྱབས།',
    linkCopied: 'འབྲེལ་མཐུད་འདྲ་བཤུས་བརྐྱབས་ཡོད།',
    viewDetails: 'ཁ་གསལ་བལྟ།',
    ownerMobile: 'ཇོ་བདག་གི་འགྲུལ་འཕྲིན་ཨང་།',
    sellerMobile: 'ཚོང་པའི་འགྲུལ་འཕྲིན་ཨང་།',
    recruiterMobile: 'གཡོག་བདག་འགྲུལ་འཕྲིན་ཨང་།',
    editPost: 'ཞུན་དག',
    deletePost: 'བཏོན་གཏང་།',
    confirmDelete: 'གསལ་བསྒྲགས་འདི་བཏོན་གཏང་ནི་ཨིན་ན?',
    noListings: 'ད་ལྟོ་དབྱེ་བ་འདི་ནང་གསལ་བསྒྲགས་མེད།',
    periodSuffix: { month: '/ཟླ་རེ།', day: '/ཉིན་རེ།', hour: '/ཆུ་ཚོད།', once: '' },
    specsLabels: {
      bedrooms: 'ཉལ་ཁང་།',
      bathrooms: 'ཁྲུས་ཁང་།',
      area: 'རྒྱ་ཁྱོན།',
      furnished: 'ཁྱིམ་ཆས་ཡོད།',
      yes: 'ཡོད།',
      no: 'མེད།',
      year: 'ལོ།',
      transmission: 'གེར།',
      fuel: 'སྣུམ།',
      seats: 'སྡོད་ཁྲི།',
      condition: 'གནས་སྟངས།',
      brand: 'ཚོང་རྟགས།',
      location: 'ས་གནས།',
      postedBy: 'སྤེལ་མི།',
      postedAt: 'སྤེལ་བའི་དུས་ཚོད།',
      restaurantName: 'ཟ་ཁང་གི་མིང་།',
    },
    contactModal: {
      title: 'བདག་སྐྱོང་པ་ལུ་འབྲེལ་བ་འཐབ།',
      subtitle: 'དྲི་བ་དང་གྲོས་འདེབས་ཡོད་ན་འོག་གི་འབྲི་ཤོག་བཀང་གནང་།',
      name: 'མིང་།',
      email: 'གློག་འཕྲིན་ཁ་བྱང་།',
      phone: 'འགྲུལ་འཕྲིན་ཨང་། (གདམ་ཁ)',
      subject: 'དོན་ཚན།',
      message: 'འཕྲིན་དོན།',
      submit: 'འཕྲིན་དོན་གཏང་།',
      sending: 'གཏང་དོ...',
      success: 'ཁྱོད་ཀྱི་འཕྲིན་དོན་བདག་སྐྱོང་པ་ལུ་ལེགས་ཤོམ་སྦེ་བཏང་ཡོད།',
    },
    authModal: {
      title: 'ཐོ་བཀོད་ / ནང་བསྐྱོད།',
      subtitle: 'ཁྱོད་ཀྱི་ཁ་གསལ་བཀང་སྟེ་ཐོ་བཀོད་འབད་བའམ་ Google ཐོག་ཐད་ཀར་ནང་བསྐྱོད་འབད།',
      registerTab: 'ཐོ་བཀོད།',
      loginTab: 'ནང་བསྐྱོད།',
      email: 'གློག་འཕྲིན་ཁ་བྱང་།',
      password: 'གསང་ཚིག (ཡིག་འབྲུ་ ༨+)',
      createAccountBtn: 'རྩིས་ཐོ་གསར་བཟོ།',
      loginBtn: 'ནང་བསྐྱོད།',
      orGoogle: 'ཡང་ན་ Google ཐོག་ནང་བསྐྱོད།',
      googleBtn: 'Google ཐོག་ནང་བསྐྱོད་འབད།',
      completeProfile: 'ཐོ་བཀོད་ཁ་སྐོང་།',
      displayName: 'མིང་ / ལས་ཁུངས།',
      phone: 'འགྲུལ་འཕྲིན་ཨང་།',
      accountType: 'ཐོབ་དབང་།',
      seeker: 'གཡོག་འཚོལ་མི།',
      employer: 'གཡོག་བདག',
      lister: 'ཇོ་བདག་ / ཚོང་པ།',
      saveProfile: 'ཐོ་བཀོད་སྲུང་།',
      signedInAs: 'ནང་བསྐྱོད་མིང་།',
    },
    listingModal: {
      createTitle: 'གསལ་བསྒྲགས་གསརཔ་སྤེལ།',
      editTitle: 'གསལ་བསྒྲགས་ཞུན་དག',
      type: 'དབྱེ་བ།',
      typeJob: 'གཡོག་གོ་སྐབས།',
      typeHouse: 'ཁྱིམ་གླ།',
      typeCar: 'སྣུམ་འཁོར་གླ།',
      typeSale: 'ཉོ་ཚོང་ཅ་ལག',
      category: 'ནང་གསེས་དབྱེ་བ།',
      titleLabel: 'མགོ་བརྗོད།',
      locationLabel: 'ས་གནས།',
      priceEurLabel: 'གོང་ཚད་ (EUR)',
      emailLabel: 'གློག་འཕྲིན་ཁ་བྱང་།',
      phoneLabel: 'འགྲུལ་འཕྲིན་ཨང་།',
      phoneRequiredNote: 'ཁྱིམ་གླ་དང་སྣུམ་འཁོར་ ཉོ་ཚོང་ལུ་འགྲུལ་འཕྲིན་ཨང་ངེས་པར་དགོ།',
      imagesLabel: 'དཔར་བཙུགས་ (མང་ཤོས་ ༣)',
      imagesRequiredNote: 'ཁྱིམ་གླ་དང་སྣུམ་འཁོར་ ཉོ་ཚོང་ལུ་དཔར་ཉུང་ཤོས་ ༡ ངེས་པར་དགོ།',
      uploadHint: 'དཔར་གདམ་ཁ་རྐྱབས།',
      descriptionLabel: 'ཁ་གསལ་འགྲེལ་བཤད།',
      submitCreate: 'སྐད་ཡིག་ ༦ ནང་བསྒྱུར་ཏེ་སྤེལ།',
      submitSave: 'བསྒྱུར་བཅོས་སྲུང་།',
      translating: 'བསྒྱུར་བཞིན་པ...',
    },
    captchaLabel: 'ཉེན་སྲུང་རྩིས་བཤེར།',
    captchaPlaceholder: 'ལན།',
    chatbotTitle: 'JobSQUAD གྲོགས་རམ་པ།',
    chatbotPlaceholder: 'དྲི་བ་འདྲི་གནང་...',
    chatbotSend: 'གཏང་།',
    upToTop: 'མགོ་ལུ་ལོག',
    footerTagline: 'སྐད་ཡིག་སྣ་མང་གཡོག་བསྡུ་དང་ཉོ་ཚོང་སྟེགས་བུ།',
    footerContactHeading: 'འབྲེལ་གཏུགས།',
    footerSocialHeading: 'མི་སྡེ་བརྡ་བརྒྱུད།',
    footerRights: 'དབང་ཆ་ཆ་མཉམ་བསྲུངས།',
  },
  gsw: {
    contactUs: 'Kontakt',
    navAbout: 'Über üs',
    navRecruitment: 'Stellemärt',
    navRentals: 'Mieti',
    navHouse: 'Hüser & Wohnige',
    navCar: 'Mietautos',
    navSales: 'Verchauf',
    registerLogin: 'Registriere / Login',
    postListing: 'Inserat ufschalte',
    myPosts: 'Mini Inserat',
    adminPanel: 'Admin-Bereich',
    signOut: 'Abmelde',
    heroTitle: 'Talent, Wohnruum und lokale Handel sicher verbinde',
    heroSubtitle:
      'JobSQUAD hilft Stellensuechende schnäll zum richtige Job und ermöglicht registrierte Mitgliider Hüser, Autos und Artikel sicher aazbiete.',
    heroCtaPrimary: 'Stelle entdecke',
    heroCtaSecondary: 'Inserat erstelle',
    statJobs: 'Offeni Stelle',
    statHouses: 'Mietobjekt',
    statCars: 'Mietautos',
    statSales: 'Verchaufsartikel',
    aboutHeading: 'Über JobSQUAD',
    aboutLead:
      'Für Stellensuechendi entwicklet, damit me unkompliziert passendi Jobs findet und i de Region sicher cha miete, vermiete und verchaufe.',
    aboutCards: [
      {
        title: '01. Direkte Kontakt zu Arbetgäber',
        body: 'Kategorie wie Chinderbetreuuig, Gastronomie, Bau, Reinigung, Seniorebetreuuig und Gsellschaft. E-Mail direkt a Arbetgäber schicke.',
      },
      {
        title: '02. Geprüefti Mitgliider-Inserat',
        body: 'Für Hus-, Auto- und Verchaufsinserat sind Fotis und e gültigi Handynummere zwingend erforderlich.',
      },
      {
        title: '03. Sächs Sprache & Währige',
        body: 'Jederzyt zwüsche Chinesisch, Änglisch, Französisch, Spanisch, Dzongkha und Schwiizerdütsch inkl. Währig wächsle.',
      },
    ],
    recruitmentHeading: 'Stelleaagebot',
    recruitmentLead: 'Wähled Si e Kategorie, schicked Si direkt es E-Mail oder teiled Si d Stell.',
    allCategories: 'Alli Branche',
    categories: {
      babysitting: 'Chinderbetreuuig',
      restaurant: 'Gastronomie',
      construction: 'Bauwäse',
      cleaning: 'Reinigung',
      elderly_care: 'Seniorepfläg',
      companion: 'Begleitperson',
      apartment: 'Wohnig',
      villa: 'Einfamiliehus',
      sedan: 'Limousine',
      suv: 'SUV',
      electronics: 'Elektronik',
      furniture: 'Möbel',
      appliances: 'Huushaltsgrät',
    },
    rentalsHeading: 'Hüser & Autos zur Mieti',
    rentalsLead: 'Bi «Details aaluege» erschint zerscht d Handynummere vom Bsitzer vor em E-Mail-Button.',
    houseTab: 'Wohnige / Hüser',
    carTab: 'Autos',
    salesHeading: 'Lokale Verchaufsmärt',
    salesLead: 'Entdecked Si Artikel vo lokale Verchäufer mit diräktem Telefon- und E-Mail-Kontakt.',
    sendEmail: 'E-Mail schicke',
    emailOwner: 'E-Mail a Bsitzer',
    emailSeller: 'E-Mail a Verchäufer',
    sharePost: 'Teile',
    linkCopied: 'Link kopiert',
    viewDetails: 'Details aaluege',
    ownerMobile: 'Handynummere Bsitzer',
    sellerMobile: 'Handynummere Verchäufer',
    recruiterMobile: 'Handynummere Arbetgäber',
    editPost: 'Bearbeite',
    deletePost: 'Lösche',
    confirmDelete: 'Söll das Inserat würkli glöscht werde?',
    noListings: 'Momentan kei Inserat i dere Kategorie.',
    periodSuffix: { month: '/Mt.', day: '/Tag', hour: '/Std.', once: '' },
    specsLabels: {
      bedrooms: 'Zimmer',
      bathrooms: 'Bäder',
      area: 'Flächi',
      furnished: 'Möbliert',
      yes: 'Ja',
      no: 'Nei',
      year: 'Jahrgang',
      transmission: 'Getriebe',
      fuel: 'Aatrieb',
      seats: 'Plätz',
      condition: 'Zuestand',
      brand: 'Marke',
      location: 'Ort',
      postedBy: 'Inseriert vo',
      postedAt: 'Veröffentlicht',
      restaurantName: 'Name vom Restaurant',
    },
    contactModal: {
      title: 'Administrator kontaktiere',
      subtitle: 'Frage oder Aaliege? Schriibed Si üs über s gschützte Formular.',
      name: 'Name',
      email: 'E-Mail-Adresse',
      phone: 'Handynummere (Optional)',
      subject: 'Beträff',
      message: 'Nachricht',
      submit: 'Nachricht schicke',
      sending: 'Wird gschickt...',
      success: 'Ihri Nachricht isch erfolgrich a Administrator übermittlet worde!',
    },
    authModal: {
      title: 'Registriere / Aamelde',
      subtitle: 'Mit Ihre Date registriere oder direkt mit Google aamelde.',
      registerTab: 'Registriere',
      loginTab: 'Aamelde',
      email: 'E-Mail-Adresse',
      password: 'Passwort (mind. 8 Zeiche)',
      createAccountBtn: 'Konto erstelle',
      loginBtn: 'Aamelde',
      orGoogle: 'Oder direkt mit Google aamelde',
      googleBtn: 'Mit Google wyterfahre',
      completeProfile: 'Profil vervollständige',
      displayName: 'Name / Firma',
      phone: 'Handynummere',
      accountType: 'Kontoart',
      seeker: 'Stellesuechend',
      employer: 'Arbetgäber',
      lister: 'Vermieter / Verchäufer',
      saveProfile: 'Registrierig abschliisse',
      signedInAs: 'Aagmolde als',
    },
    listingModal: {
      createTitle: 'Neus Inserat erstelle',
      editTitle: 'Inserat bearbeite',
      type: 'Inserat-Typ',
      typeJob: 'Stelleaagebot',
      typeHouse: 'Hus / Wohnig miete',
      typeCar: 'Auto miete',
      typeSale: 'Artikel verchaufe',
      category: 'Kategorie',
      titleLabel: 'Titel',
      locationLabel: 'Standort',
      priceEurLabel: 'Basisbetrag (EUR — wird automatisch umgrächnet)',
      emailLabel: 'Kontakt-E-Mail',
      phoneLabel: 'Handynummere',
      phoneRequiredNote: 'Für Hüser, Autos und Verchauf isch d Handynummere zwingend.',
      imagesLabel: 'Bilder ufelade (max. 3)',
      imagesRequiredNote: 'Mindestens 1 Bild isch für Hüser, Autos und Verchauf nötig.',
      uploadHint: 'Bilddateie uswähle',
      descriptionLabel: 'Beschriibig',
      submitCreate: 'I 6 Sprache übersetze & publiziere',
      submitSave: 'Änderige spichere',
      translating: 'Wird übersetzt und publiziert...',
    },
    captchaLabel: 'Sicherheits-CAPTCHA',
    captchaPlaceholder: 'Ergebnis',
    chatbotTitle: 'JobSQUAD Online-Hilf',
    chatbotPlaceholder: 'Frag über Jobs, Mieti oder Verchauf...',
    chatbotSend: 'Sände',
    upToTop: 'Nach obe',
    footerTagline: 'Sicheri mehrsprachigi Plattform für Jobs, Mietobjekt und lokale Handel.',
    footerContactHeading: 'Kontakt',
    footerSocialHeading: 'Social Media',
    footerRights: 'Alli Rächt vorbehalte.',
  },
};
