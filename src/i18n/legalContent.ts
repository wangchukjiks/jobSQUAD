import type { SupportedLang } from '../types/index.ts';

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LocalizedLegalDocument {
  modalTitle: string;
  termsTab: string;
  privacyTab: string;
  effectiveLabel: string;
  controllerBadge: string;
  termsSections: LegalSection[];
  privacySections: LegalSection[];
}

export const LEGAL_CONTENT: Record<SupportedLang, LocalizedLegalDocument> = {
  en: {
    modalTitle: 'Legal Notice, Terms of Service & Privacy Policy (EU / GDPR)',
    termsTab: 'Terms of Service',
    privacyTab: 'Privacy Policy (GDPR)',
    effectiveLabel: 'Effective under European Union (GDPR & DSA) and French Law',
    controllerBadge:
      'Operator & Data Controller: JobSQUAD · 10 Voie Falguiere, Vitry Sur Seine, 94400, France · contact.jobsquad@gmail.com · +33 7 59 16 31 33',
    termsSections: [
      {
        title: '1. Scope & Role of JobSQUAD',
        paragraphs: [
          'JobSQUAD operates an online multilingual marketplace connecting job seekers, employers, property owners, vehicle lessors, and local sellers across recruitment, Looking for Job profiles, house rentals, car rentals, and local sales.',
          'JobSQUAD acts strictly as an intermediary hosting platform under the EU Digital Services Act (Regulation (EU) 2022/2065) and French Law No. 2004-575 (LCEN). JobSQUAD is not a party to employment contracts, lease agreements, or purchase transactions concluded directly between users.',
        ],
      },
      {
        title: '2. Account Registration & Mandatory Acceptance',
        paragraphs: [
          'Publishing listings requires creating a verified account by providing accurate information (full or business name, email address, mobile phone number, and account role) and explicitly checking the mandatory acceptance box for these Terms of Service and Privacy Policy.',
          'You confirm that you are at least 18 years old (or possess legal capacity under applicable European national law) and that all contact details, uploaded photographs (mandatory for House, Car, and Sales listings), and descriptions you submit are truthful and authorized.',
        ],
      },
      {
        title: '3. Acceptable Use & Prohibited Content',
        paragraphs: [
          'Users must not publish discriminatory, defamatory, harmful, fraudulent, misleading, irrelevant, or unlawful listings, nor offer prohibited goods or unlicensed regulated services. Harassment, spam, automated scraping, and posting third-party personal data without authorization are strictly forbidden.',
          'Because recruitment, rental, and sales posts display a contact telephone number and email inquiry route to facilitate direct communication, users must only submit contact details they are legally entitled to publish.',
        ],
      },
      {
        title: '4. Content Moderation, Flagging & Removal (EU DSA)',
        paragraphs: [
          'Platform administrators may review user-submitted content following community reports or moderation checks. If a post appears irrelevant, harmful, inaccurate, misleading, or contrary to these Terms, an administrator may either attach a visible moderation flag specifying the reason or permanently delete the post.',
          'Registered authors remain able to edit or delete their own listings at any time, and may contact contact.jobsquad@gmail.com to contest a moderation action or report illegal or harmful content.',
        ],
      },
      {
        title: '5. Multilingual AI Translation & Liability',
        paragraphs: [
          'To assist cross-border communities, JobSQUAD may automatically translate user listings into seven supported languages (Chinese, English, French, Spanish, Dzongkha, Tibetan, and Swiss German). Automated translations are provided for convenience; the original poster remains responsible for confirming exact terms directly with applicants, tenants, or buyers.',
          'To the maximum extent permitted by European consumer law, JobSQUAD is not liable for indirect damages or disputes arising from off-platform negotiations between members.',
        ],
      },
      {
        title: '6. Governing Law & Jurisdiction',
        paragraphs: [
          'These Terms are governed by French law and mandatory European Union consumer and digital service regulations. Any dispute may be submitted to competent courts in France or resolved via applicable EU consumer dispute mechanisms.',
        ],
      },
    ],
    privacySections: [
      {
        title: '1. Data Controller Identity (GDPR Art. 13)',
        paragraphs: [
          'The Data Controller responsible for processing personal data on JobSQUAD is JobSQUAD, 10 Voie Falguiere, Vitry Sur Seine, 94400, France (Email: contact.jobsquad@gmail.com, Phone: +33 7 59 16 31 33).',
        ],
      },
      {
        title: '2. Personal Data Collected & Platform Behavior',
        paragraphs: [
          'Account & Authentication Data: Full/company name, email address, mobile number, account role (job seeker, employer, owner/seller), scrypt-salted password hash or Google Sign-In UID, and the timestamp confirming mandatory acceptance of the Terms of Service and Privacy Policy.',
          'Listings & Inquiries: Title, job or item category, restaurant name (when applicable), city/location, description, pricing, up to three uploaded photographs, public contact mobile number, contact email, and messages sent through the Contact Us or Listing Inquiry forms.',
          'Security & Strictly Necessary Storage: HTTP-only session cookies, CSRF anti-forgery tokens, mathematical CAPTCHA verification tokens, and session storage strictly needed to protect accounts against abuse. No advertising, cross-site tracking, or behavioral profiling cookies are used.',
        ],
      },
      {
        title: '3. Purposes & Legal Bases (GDPR Art. 6)',
        paragraphs: [
          'Contract Performance (Art. 6(1)(b)): Registering your account, authenticating sessions, publishing/editing/deleting listings, and delivering user inquiries to listing owners.',
          'Legal Compliance (Art. 6(1)(c)): Complying with EU Digital Services Act (DSA) notice-and-action duties, French LCEN obligations, and lawful authority requests.',
          'Legitimate Interests (Art. 6(1)(f)): Preventing spam/fraud via CAPTCHA and CSRF protection, maintaining platform security, and enabling administrators to flag or remove irrelevant, harmful, or inaccurate posts.',
          'Consent (Art. 6(1)(a)): Explicit checkbox consent recorded at account creation and voluntary submission of photos or inquiry messages.',
        ],
      },
      {
        title: '4. Public Visibility & Third-Party Sub-Processors',
        paragraphs: [
          'Public Listing Visibility: When you publish a listing, your display name, listing details, and contact mobile number appear publicly on the marketplace so interested candidates, tenants, or buyers can reach you directly; inquiry emails relay messages to your registered contact email.',
          'Sub-Processors: JobSQUAD relies on Google Firebase (Authentication & Cloud Firestore) for identity and database storage, Resend for transactional inquiry emails, and Google Gemini API solely to translate listing text across the 7 supported languages and power the help assistant. International transfers are safeguarded under EU Standard Contractual Clauses (SCCs) and applicable adequacy frameworks.',
        ],
      },
      {
        title: '5. Data Retention',
        paragraphs: [
          'Active listings and account profiles are retained for as long as your account or post remains active. Deleted listings are removed immediately from public view, and moderation/deletion logs are kept only as strictly necessary for security, abuse prevention, and statutory obligations.',
        ],
      },
      {
        title: '6. Your European Privacy Rights (GDPR Art. 15–22 & 77)',
        paragraphs: [
          'Under the GDPR, you have the right to access your personal data, request rectification of inaccurate data, request erasure ("right to be forgotten"), restrict or object to processing, and request data portability.',
          'To exercise any of these rights or request permanent account deletion, contact contact.jobsquad@gmail.com. You also have the right to lodge a complaint with the French supervisory authority (CNIL — www.cnil.fr) or your local EU data protection authority.',
        ],
      },
    ],
  },
  fr: {
    modalTitle: 'Mentions légales, Conditions d’utilisation et Confidentialité (UE / RGPD)',
    termsTab: 'Conditions d’utilisation',
    privacyTab: 'Politique de confidentialité (RGPD)',
    effectiveLabel: 'Conforme au droit de l’Union européenne (RGPD & DSA) et au droit français',
    controllerBadge:
      'Éditeur & Responsable de traitement : JobSQUAD · 10 Voie Falguiere, Vitry Sur Seine, 94400, France · contact.jobsquad@gmail.com · +33 7 59 16 31 33',
    termsSections: [
      {
        title: '1. Objet et rôle d’intermédiaire de JobSQUAD',
        paragraphs: [
          'JobSQUAD exploite une plateforme multilingue mettant en relation chercheurs d’emploi, employeurs, propriétaires immobiliers, loueurs de véhicules et vendeurs locaux (Recrutement, LOOKING FOR JOB, Locations Maisons/Voitures et Ventes locales).',
          'Conformément au Règlement européen sur les services numériques (DSA) et à la loi française LCEN n° 2004-575, JobSQUAD agit en qualité d’hébergeur intermédiaire et n’est pas partie aux contrats conclus entre utilisateurs.',
        ],
      },
      {
        title: '2. Inscription et acceptation obligatoire',
        paragraphs: [
          'La publication d’annonces requiert la création d’un compte avec des informations exactes (nom ou société, e-mail, numéro de mobile, profil) ainsi que l’acceptation expresse et obligatoire des présentes Conditions d’utilisation et de la Politique de confidentialité.',
          'Vous certifiez être majeur (18 ans ou plus) et disposer de tous les droits sur les coordonnées et photographies téléversées (obligatoires pour les annonces Maison, Voiture et Vente).',
        ],
      },
      {
        title: '3. Règles de publication et contenus interdits',
        paragraphs: [
          'Il est strictement interdit de publier des annonces illicites, discriminatoires, nuisibles, trompeuses, inexactes, hors sujet ou frauduleuses, ainsi que des données personnelles de tiers sans leur accord.',
          'Les annonces affichant un numéro de mobile et permettant l’envoi d’e-mails directs, l’auteur s’engage à ne fournir que des coordonnées valides et autorisées.',
        ],
      },
      {
        title: '4. Modération, signalement administrateur et suppression (DSA)',
        paragraphs: [
          'Les administrateurs de JobSQUAD peuvent contrôler les annonces publiées. Si une annonce semble hors sujet, nuisible, inexacte ou contraire aux présentes Conditions, l’administrateur peut soit apposer un avertissement visible précisant le motif du signalement, soit supprimer définitivement l’annonce.',
          'Chaque auteur peut modifier ou supprimer ses propres annonces à tout moment et contacter contact.jobsquad@gmail.com pour toute réclamation ou signalement.',
        ],
      },
      {
        title: '5. Traduction automatique multilingue et responsabilité',
        paragraphs: [
          'JobSQUAD traduit automatiquement les annonces en 7 langues (chinois, anglais, français, espagnol, dzongkha, tibétain, suisse allemand) pour faciliter la mise en relation. L’utilisateur reste responsable de vérifier les conditions exactes lors des échanges directs.',
        ],
      },
      {
        title: '6. Droit applicable',
        paragraphs: [
          'Les présentes Conditions sont soumises au droit français et aux règlements européens applicables.',
        ],
      },
    ],
    privacySections: [
      {
        title: '1. Responsable du traitement (Art. 13 RGPD)',
        paragraphs: [
          'Responsable du traitement : JobSQUAD, 10 Voie Falguiere, Vitry Sur Seine, 94400, France (contact.jobsquad@gmail.com, +33 7 59 16 31 33).',
        ],
      },
      {
        title: '2. Données personnelles collectées',
        paragraphs: [
          'Données de compte : nom/société, adresse e-mail, numéro de téléphone mobile, rôle du compte, empreinte chiffrée du mot de passe (scrypt) ou identifiant Google Sign-In, et preuve horodatée d’acceptation des Conditions.',
          'Données d’annonces et messages : titre, catégorie, nom du restaurant le cas échéant, ville, description, tarif, photos (jusqu’à 3), téléphone et e-mail de contact, ainsi que les messages envoyés via les formulaires de contact.',
          'Cookies et stockage strictement nécessaires : jetons de session sécurisés HttpOnly, protection CSRF et vérification CAPTCHA anti-spam. Aucun traceur publicitaire n’est utilisé.',
        ],
      },
      {
        title: '3. Finalités et bases légales (Art. 6 RGPD)',
        paragraphs: [
          'Exécution du contrat (Art. 6.1.b) : création de compte, gestion des annonces et transmission des demandes de contact.',
          'Obligation légale (Art. 6.1.c) : respect du DSA et de la LCEN.',
          'Intérêt légitime (Art. 6.1.f) : sécurité de la plateforme, prévention des abus (CAPTCHA/CSRF) et modération/signalement des annonces hors sujet, nuisibles ou inexactes.',
          'Consentement (Art. 6.1.a) : acceptation explicite lors de l’inscription et dépôt volontaire de contenus.',
        ],
      },
      {
        title: '4. Visibilité publique et sous-traitants',
        paragraphs: [
          'Les numéros de mobile et informations des annonces publiées sont visibles publiquement afin de permettre aux candidats, locataires ou acheteurs de vous contacter directement.',
          'Sous-traitants techniques : Google Firebase (authentification et Firestore), Resend (acheminement des e-mails) et Google Gemini API (traduction en 7 langues et aide en ligne), encadrés par les Clauses Contractuelles Types (CCT) européennes.',
        ],
      },
      {
        title: '5. Durée de conservation',
        paragraphs: [
          'Les données sont conservées tant que votre compte ou votre annonce reste actif, et supprimées sur demande ou lors de la clôture du compte, sous réserve des obligations légales.',
        ],
      },
      {
        title: '6. Vos droits européens et réclamation auprès de la CNIL',
        paragraphs: [
          'Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données via contact.jobsquad@gmail.com. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).',
        ],
      },
    ],
  },
  es: {
    modalTitle: 'Aviso Legal, Términos de Servicio y Privacidad (UE / RGPD)',
    termsTab: 'Términos de Servicio',
    privacyTab: 'Política de Privacidad (RGPD)',
    effectiveLabel: 'Conforme al Derecho de la Unión Europea (RGPD y DSA) y legislación francesa',
    controllerBadge:
      'Operador y Responsable: JobSQUAD · 10 Voie Falguiere, Vitry Sur Seine, 94400, France · contact.jobsquad@gmail.com · +33 7 59 16 31 33',
    termsSections: [
      {
        title: '1. Alcance y función de JobSQUAD',
        paragraphs: [
          'JobSQUAD ofrece una plataforma multilingüe para conectar empleo, perfiles LOOKING FOR JOB, alquiler de casas y coches, y ventas locales.',
          'De acuerdo con el Reglamento europeo de Servicios Digitales (DSA), JobSQUAD actúa como intermediario de alojamiento y no es parte en los acuerdos laborales, de alquiler o compraventa entre usuarios.',
        ],
      },
      {
        title: '2. Registro y aceptación obligatoria',
        paragraphs: [
          'Para crear una cuenta y publicar anuncios es obligatorio proporcionar datos reales (nombre, correo, móvil y rol) y marcar la casilla de aceptación de estos Términos de Servicio y la Política de Privacidad.',
          'El usuario declara ser mayor de 18 años y contar con autorización sobre las fotografías (obligatorias en Casas, Coches y Ventas) y datos de contacto publicados.',
        ],
      },
      {
        title: '3. Uso permitido y contenido prohibido',
        paragraphs: [
          'Se prohíbe publicar anuncios ilícitos, discriminatorios, dañinos, engañosos, inexactos, irrelevantes o fraudulentos, así como datos personales de terceros sin consentimiento.',
        ],
      },
      {
        title: '4. Moderación, marcado y eliminación (DSA)',
        paragraphs: [
          'Los administradores pueden revisar anuncios y, si resultan irrelevantes, dañinos o inexactos, marcarlos con un aviso visible o eliminarlos permanentemente. Los usuarios pueden editar o eliminar sus propios anuncios en cualquier momento.',
        ],
      },
      {
        title: '5. Traducción automática y legislación aplicable',
        paragraphs: [
          'Las traducciones automáticas en 7 idiomas son orientativas. Estos Términos se rigen por la normativa de la Unión Europea y de Francia.',
        ],
      },
    ],
    privacySections: [
      {
        title: '1. Responsable del tratamiento (Art. 13 RGPD)',
        paragraphs: [
          'JobSQUAD, 10 Voie Falguiere, Vitry Sur Seine, 94400, France · contact.jobsquad@gmail.com · +33 7 59 16 31 33.',
        ],
      },
      {
        title: '2. Datos recopilados',
        paragraphs: [
          'Datos de registro (nombre, correo, teléfono móvil, tipo de cuenta, contraseña cifrada o UID de Google y fecha de aceptación de Términos), datos de anuncios publicados (incluidas fotos y teléfono visible) y mensajes enviados mediante formularios de contacto.',
          'Utilizamos únicamente almacenamiento y cookies técnicas esenciales de sesión, CSRF y CAPTCHA; no empleamos cookies publicitarias.',
        ],
      },
      {
        title: '3. Bases legales (Art. 6 RGPD)',
        paragraphs: [
          'Ejecución contractual (gestión de cuentas y anuncios), cumplimiento legal (DSA), interés legítimo (seguridad anti-spam y moderación/marcado) y consentimiento expreso al registrarse.',
        ],
      },
      {
        title: '4. Encargados del tratamiento y derechos europeos',
        paragraphs: [
          'Los servicios técnicos incluyen Google Firebase (autenticación y Firestore), Resend (envío de correos) y Google Gemini API (traducción y asistencia), bajo garantías europeas (CCT).',
          'Puede ejercer sus derechos de acceso, rectificación, supresión, limitación y portabilidad escribiendo a contact.jobsquad@gmail.com, o reclamar ante la autoridad de control competente (CNIL — www.cnil.fr o AEPD).',
        ],
      },
    ],
  },
  zh: {
    modalTitle: '欧洲法律服务条款与隐私政策（GDPR / EU DSA）',
    termsTab: '服务条款 (Terms)',
    privacyTab: '隐私政策 (GDPR)',
    effectiveLabel: '依据欧盟通用数据保护条例 (GDPR)、欧盟数字服务法 (DSA) 及法国法律制定',
    controllerBadge:
      '运营方与数据控制者：JobSQUAD · 10 Voie Falguiere, Vitry Sur Seine, 94400, France · contact.jobsquad@gmail.com · +33 7 59 16 31 33',
    termsSections: [
      {
        title: '1. 平台定位与适用范围',
        paragraphs: [
          'JobSQUAD 为求职者、招聘雇主、房东、车主与本地卖家提供多语言信息发布服务，涵盖招聘求职（含 LOOKING FOR JOB）、房屋出租、汽车租赁及本地集市交易。',
          '依据欧盟《数字服务法》(DSA, Regulation (EU) 2022/2065) 及法国《数字经济信任法》(LCEN)，JobSQUAD 仅作为信息托管中介平台，不直接参与用户之间达成的雇佣、租赁或买卖合同。',
        ],
      },
      {
        title: '2. 用户注册与强制同意义务',
        paragraphs: [
          '注册账户必须提供真实有效的姓名或公司名称、电子邮箱、手机号码及账户类型，并必须勾选同意本《服务条款》及《隐私政策》后方可创建账户。',
          '您确认已年满 18 周岁并具有完全民事行为能力；发布房屋、租车及商品信息时必须上传真实图片并填写有效联系电话。',
        ],
      },
      {
        title: '3. 内容规范与禁止行为',
        paragraphs: [
          '禁止发布虚假、误导、歧视、有害、违法、垃圾广告或无关内容，亦不得未经授权发布他人隐私或联系方式。由于平台会在招聘与详情页面展示联系电话及邮件咨询入口，请确保您有权公开所填联系方式。',
        ],
      },
      {
        title: '4. 管理员审核、标记与删除机制 (EU DSA)',
        paragraphs: [
          '如管理员发现帖子存在“无关内容”、“有害/不安全”、“信息不实/误导”或“垃圾广告”等违规情况，有权对该帖子进行标记（在前台展示醒目的管理员警示原因）或直接永久删除。',
          '发布者可随时编辑或删除自己发布的帖子，亦可发送邮件至 contact.jobsquad@gmail.com 申诉或举报违规信息。',
        ],
      },
      {
        title: '5. 七国语言智能翻译与适用法律',
        paragraphs: [
          '平台提供中文、英语、法语、西班牙语、宗喀语、藏语及瑞士德语自动翻译以便利沟通，具体交易与工作条款请双方直接确认。本条款受法国法律及欧盟强制性消费者与数字法规管辖。',
        ],
      },
    ],
    privacySections: [
      {
        title: '1. 数据控制者信息 (GDPR 第 13 条)',
        paragraphs: [
          '数据控制者：JobSQUAD，地址：10 Voie Falguiere, Vitry Sur Seine, 94400, France；邮箱：contact.jobsquad@gmail.com；电话：+33 7 59 16 31 33。',
        ],
      },
      {
        title: '2. 收集的个人数据与网站实际行为',
        paragraphs: [
          '账户注册数据：姓名/公司名、电子邮箱、手机号码、账户类型、高强度加盐加密密码哈希（或 Google 登录 UID）以及您勾选同意条款的时间戳。',
          '发布内容与咨询邮件：信息标题、分类、餐厅名称（如适用）、城市地点、详情描述、价格、最多 3 张图片、公开联系电话、联系邮箱及您通过“联系我们”或详情页发送的邮件内容。',
          '必要安全存储：仅使用保障登录会话与防攻击所需的 HttpOnly 会话 Cookie、CSRF 安全令牌及人机算术验证码令牌，绝不使用任何第三方广告追踪或画像 Cookie。',
        ],
      },
      {
        title: '3. 处理目的与法律依据 (GDPR 第 6 条)',
        paragraphs: [
          '履行合同 (第 6(1)(b) 条)：创建管理账户、发布/编辑/删除信息以及代发职位与租售咨询邮件。',
          '履行法定义务 (第 6(1)(c) 条)：遵守欧盟 DSA 通知与处置义务及法国法律合规要求。',
          '合法权益 (第 6(1)(f) 条)：防刷验证码与安全防护，以及管理员对违规帖子进行标记警示或删除以保障社区安全。',
          '明确同意 (第 6(1)(a) 条)：注册时强制勾选确认条款及自愿提交咨询与图片内容。',
        ],
      },
      {
        title: '4. 公开展示说明与第三方处理方',
        paragraphs: [
          '发布帖子即意味着您的展示名称及所填联系电话会在平台公开展示，以便招聘方、求职者、租客或买家直接联系。',
          '技术合作方包括 Google Firebase（身份认证与 Firestore 数据存储）、Resend（邮件安全投递）以及 Google Gemini API（用于 7 种语言自动翻译与客服助手），并受欧盟标准合同条款 (SCCs) 保护。',
        ],
      },
      {
        title: '5. 数据保留与您的欧盟 GDPR 权利',
        paragraphs: [
          '您在账户或帖子有效期间的数据将被安全保留，您可随时删除自己的帖子或发邮件至 contact.jobsquad@gmail.com 行使访问权、更正权、删除权（被遗忘权）、限制处理权、数据可携权及反对权；您亦有权向法国数据保护监管机构 CNIL (www.cnil.fr) 提出申诉。',
        ],
      },
    ],
  },
  dz: {
    modalTitle: 'ཡུ་རོབ་ཁྲིམས་ལུགས་ཀྱི་ཞབས་ཏོག་ཆ་རྐྱེན་དང་སྒེར་དོན་སྲིད་བྱུས། (EU / GDPR)',
    termsTab: 'ཞབས་ཏོག་ཆ་རྐྱེན།',
    privacyTab: 'སྒེར་དོན་སྲིད་བྱུས། (GDPR)',
    effectiveLabel: 'ཡུ་རོབ་མཉམ་འབྲེལ་ (GDPR & DSA) དང་ཕ་རན་སིའི་ཁྲིམས་དང་མཐུན་པ།',
    controllerBadge:
      'འཛིན་སྐྱོང་པ།: JobSQUAD · 10 Voie Falguiere, Vitry Sur Seine, 94400, France · contact.jobsquad@gmail.com · +33 7 59 16 31 33',
    termsSections: [
      {
        title: '༡. སྟེགས་བུའི་དམིགས་ཡུལ་དང་འགན་ཁུར།',
        paragraphs: [
          'JobSQUAD གིས་ གཡོག་བསྡུ་དང་ LOOKING FOR JOB ཁྱིམ་གླ་ སྣུམ་འཁོར་གླ་ དང་ ཉོ་ཚོང་བཅས་ཀྱི་གསལ་བསྒྲགས་མཐུད་སྦྱོར་འབདཝ་ཨིན། གཡོག་དང་གླ་ཁ་ ཚོང་འབྲེལ་གྱི་གན་རྒྱ་དངོས་སུ་ཚོགས་མི་ནང་ཁུལ་ལུ་བཟོ་དགོཔ་ལས་ སྟེགས་བུ་འདི་བར་འབྲེལ་གྱི་ཞབས་ཏོག་ཙམ་ཨིན།',
        ],
      },
      {
        title: '༢. ཐོ་བཀོད་དང་ངེས་པར་དུ་ཁས་ལེན་དགོཔ།',
        paragraphs: [
          'རྩིས་ཐོ་གསར་བཟོ་འབད་བའི་སྐབས་ མིང་དང་གློག་འཕྲིན་ འགྲུལ་འཕྲིན་ཨང་གྲངས་དངོས་མ་བཀོད་དེ་ ཞབས་ཏོག་ཆ་རྐྱེན་དང་སྒེར་དོན་སྲིད་བྱུས་ངེས་པར་དུ་གདམ་རྟགས་བཀོད་དགོ།',
        ],
      },
      {
        title: '༣. བདག་སྐྱོང་པའི་རྟགས་བཀོད་དང་བཏོན་གཏང་དབང་ཚད། (EU DSA)',
        paragraphs: [
          'གསལ་བསྒྲགས་གང་རུང་ འབྲེལ་མེད་དམ་ གནོད་སྐྱོན་ཅན་ ཡང་ན་ བདེན་མེད་འཛོལ་བ་ཡོད་པ་ཅིན་ བདག་སྐྱོང་པ་གིས་ ཉེན་བརྡའི་རྟགས་བཀོད་ནི་ཡང་ན་ བཏོན་གཏང་ནིའི་དབང་ཚད་ཡོད།',
        ],
      },
    ],
    privacySections: [
      {
        title: '༡. སྒེར་དོན་གནས་ཚུལ་བསྡུ་ལེན་དང་ལག་ལེན། (GDPR)',
        paragraphs: [
          'JobSQUAD གིས་ ཐོ་བཀོད་གནས་ཚུལ་ (མིང་ གློག་འཕྲིན་ འགྲུལ་འཕྲིན་ གོ་གནས་ དང་ ཆ་རྐྱེན་ཁས་ལེན་དུས་ཚོད) དང་ གསལ་བསྒྲགས་དཔར་དང་ཡིག་འཕྲིན་བཅས་ ཞབས་ཏོག་སྤྲོད་ནི་དང་ ཉེན་སྲུང་དོན་ལུ་ལག་ལེན་འཐབ་ཨིན།',
          'Firebase དང་ Resend དེ་ལས་ Gemini API (སྐད་ཡིག་ ༧ ནང་བསྒྱུར་བཅོས་དོན་ལུ) ཡུ་རོབ་ཀྱི་ཉེན་སྲུང་ཚད་གཞི་དང་མཐུན་པར་ལག་ལེན་འཐབ་ཨིན། ཁྱོད་ཀྱི་ GDPR ཐོབ་དབང་ (མཐོང་དབང་ བཅོས་དབང་ བསུབ་དབང་) དོན་ལུ་ contact.jobsquad@gmail.com ཡང་ན་ CNIL (www.cnil.fr) ལུ་འབྲེལ་བ་འཐབ་ཚུགས།',
        ],
      },
    ],
  },
  gsw: {
    modalTitle: 'Rächtlichi Hiwiis, AGB & Dateschutz nach europäischem Rächt (DSGVO / DSA)',
    termsTab: 'Nutzigsbedingige (AGB)',
    privacyTab: 'Dateschutz (DSGVO)',
    effectiveLabel: 'Nach europäischem Rächt (DSGVO / DSA) und französischem Rächt',
    controllerBadge:
      'Verantwortlich: JobSQUAD · 10 Voie Falguiere, Vitry Sur Seine, 94400, France · contact.jobsquad@gmail.com · +33 7 59 16 31 33',
    termsSections: [
      {
        title: '1. Rolle vo JobSQUAD',
        paragraphs: [
          'JobSQUAD isch e mehrsprachigi Plattform für Stellenaagebot, LOOKING FOR JOB, Wohnigs- und Automieti sowie lokali Verchäuf. Verträg chömed direkt zwüsche de Mitgliider zstand; JobSQUAD handlet als Vermittligsplattform gmäss EU Digital Services Act (DSA).',
        ],
      },
      {
        title: '2. Registrierig & Pflicht-Zuestimmig',
        paragraphs: [
          'Bi de Kontoerstellg müend wahrheitsgemässi Aagabe gmacht und d Nutzigsbedingige sowie d Dateschutzerklärig zwingend per Häckli akzeptiert werde. Inserentinnen und Inserenten bestätiged, mindestens 18 Jahr alt z sii.',
        ],
      },
      {
        title: '3. Moderation, Markiere & Lösche (EU DSA)',
        paragraphs: [
          'Administratore chönd Inserat bi irrelevante, schädliche oder unrichtige Inhalt mit eme sichtbare Warnhiiwiis markiere oder direkt lösche. Eigeni Inserat chönd jederzeit bearbeitet oder glöscht werde.',
        ],
      },
    ],
    privacySections: [
      {
        title: '1. Verantwortlichi Stell & Verarbeitig (DSGVO)',
        paragraphs: [
          'Verantwortlich: JobSQUAD, 10 Voie Falguiere, Vitry Sur Seine, 94400, France (contact.jobsquad@gmail.com). Mir verarbeitend Registrierigsdate (Name, E-Mail, Handy, Rolle, Zuestimmigszitpunkt), Inseratsdate inkl. Bilder sowie Kontaktformular-Aafroge zur Vertragserfüllig und Plattformsicherheit (CAPTCHA, CSRF, HttpOnly-Session).',
          'Technischi Partner sind Google Firebase, Resend und Google Gemini API (für 7-Sprache-Übersetzig) unter EU-Standardvertragsklausle. Ihri DSGVO-Rächt (Uskunft, Berichtigung, Löschig) sowie s Beschwerderächt bi de CNIL (www.cnil.fr) sind jederzeit gwährleistet.',
        ],
      },
    ],
  },
  bo: {
    modalTitle: 'ཡུ་རོབ་ཁྲིམས་ལུགས་ལྟར་གྱི་ཞབས་ཞུའི་ཆ་རྐྱེན་དང་སྒེར་དོན་སྲིད་བྱུས། (EU / GDPR & DSA)',
    termsTab: 'ཞབས་ཞུའི་ཆ་རྐྱེན།',
    privacyTab: 'སྒེར་དོན་སྲིད་བྱུས། (GDPR)',
    effectiveLabel: 'ཡུ་རོབ་མཉམ་འབྲེལ་ (GDPR & DSA) དང་ཕ་རན་སིའི་ཁྲིམས་ལུགས་གཞིར་བཟུང་བཟོས་པ།',
    controllerBadge:
      'འགན་འཛིན་དང་གཞི་གྲངས་དོ་དམ་པ།: JobSQUAD · 10 Voie Falguiere, Vitry Sur Seine, 94400, France · contact.jobsquad@gmail.com · +33 7 59 16 31 33',
    termsSections: [
      {
        title: '༡། སྟེགས་བུའི་ངོ་བོ་དང་འགན་འཁྲི།',
        paragraphs: [
          'JobSQUAD ནི་ལས་ཀ་འཚོལ་མཁན་དང་ལས་བདག ཁང་བདག རླངས་འཁོར་བདག་པོ། ས་གནས་ཚོང་པ་བཅས་མཉམ་སྦྲེལ་བྱེད་པའི་སྐད་ཡིག་སྣ་མང་གི་དྲ་ཚིགས་ཤིག་ཡིན།',
          'ཡུ་རོབ་མཉམ་འབྲེལ་གྱི་གྲངས་འཛིན་ཞབས་ཞུའི་ཁྲིམས་ཡིག་ (DSA) དང་ཕ་རན་སིའི་ཁྲིམས་ལུགས་ལྟར། JobSQUAD ནི་བར་འབྲེལ་ཞབས་ཞུ་སྤྲོད་མཁན་ཙམ་ཡིན་པས། སྤྱོད་མཁན་ཕན་ཚུན་དབར་གྱི་ལས་གླ་དང་ཁང་གླ། ཉོ་ཚོང་གན་རྒྱའི་ནང་ཐད་ཀར་ཞུགས་མི་ཐུབ།',
        ],
      },
      {
        title: '༢། ཐོ་འགོད་དང་ངེས་པར་དུ་ཁས་ལེན་བྱ་དགོས་པ།',
        paragraphs: [
          'ཐོ་ཁོངས་གསར་བཟོ་བྱེད་སྐབས་མིང་དང་གློག་འཕྲིན་ཁ་བྱང་། ལག་ཁྱེར་ཁ་པར་ཨང་གྲངས། ཐོ་ཁོངས་རིགས་བཅས་བདེན་པ་བཀོད་དེ་ ཞབས་ཞུའི་ཆ་རྐྱེན་དང་སྒེར་དོན་སྲིད་བྱུས་འདི་ངེས་པར་དུ་མོས་མཐུན་རྟགས་རྒྱག་དགོས།',
          'ཁྱེད་ཀྱིས་རང་ལོ་ ༡༨ ལོན་པ་དང་། ཁང་པ་དང་རླངས་འཁོར། ཉོ་ཚོང་གསལ་བསྒྲགས་སྤེལ་སྐབས་འདྲ་པར་ངོ་མ་དང་འབྲེལ་གཏུགས་ཁ་པར་ཨང་ངེས་པར་དུ་འཇུག་དགོས་པ་ཁས་ལེན་བྱེད་དགོས།',
        ],
      },
      {
        title: '༣། འགོག་སྡོམ་དང་དོ་དམ་པས་རྟགས་རྒྱག་པའམ་བསུབ་ཆོག་པ། (EU DSA)',
        paragraphs: [
          'ཁྲིམས་འགལ་དང་གནོད་སྐྱོན། མགོ་སྐོར། དབྱེ་འབྱེད། ཡང་ན་འབྲེལ་མེད་དང་བདེན་མེད་ཀྱི་གསལ་བསྒྲགས་སྤེལ་མི་ཆོག གལ་ཏེ་གསལ་བསྒྲགས་གང་རུང་འབྲེལ་མེད་དམ་གནོད་སྐྱོན། ནོར་འཁྲུལ་ཅན་ཡིན་པ་ཤེས་རྟོགས་བྱུང་ཚེ། དོ་དམ་པས་ཉེན་བརྡའི་རྒྱུ་མཚན་བཀོད་ནས་རྟགས་རྒྱག་པའམ་ཐད་ཀར་བསུབ་ཆོག',
          'གསལ་བསྒྲགས་སྤེལ་མཁན་གྱིས་རང་ཉིད་ཀྱི་གསལ་བསྒྲགས་བཟོ་བཅོས་སམ་བསུབ་ཆོག་པ་དང་། དོ་དམ་ཐད་ཞུ་གཏུག་བྱ་འདོད་ན་ contact.jobsquad@gmail.com ལ་འབྲེལ་བ་གནང་ཆོག',
        ],
      },
    ],
    privacySections: [
      {
        title: '༡། གཞི་གྲངས་དོ་དམ་པའི་ཁ་བྱང་དང་བསྡུ་ལེན་བྱེད་པའི་གཞི་གྲངས། (GDPR)',
        paragraphs: [
          'གཞི་གྲངས་དོ་དམ་པ།: JobSQUAD, 10 Voie Falguiere, Vitry Sur Seine, 94400, France (contact.jobsquad@gmail.com, +33 7 59 16 31 33)།',
          'བསྡུ་ལེན་བྱེད་པའི་གནས་ཚུལ། ཐོ་འགོད་མིང་དང་གློག་འཕྲིན། ཁ་པར་ཨང་གྲངས། ཐོ་ཁོངས་རིགས། གསང་ཨང་ཉེན་སྲུང་ཨང་རྟགས་ (scrypt) འམ་ Google ངོ་རྟགས། ཆ་རྐྱེན་ཁས་ལེན་པའི་དུས་ཚོད། གསལ་བསྒྲགས་ཀྱི་འདྲ་པར་དང་ཡིག་འཕྲིན་ཁག དེ་བཞིན་བདེ་འཇགས་དང་ CAPTCHA ཞིབ་བཤེར་ཆེད་དགོས་ངེས་ཀྱི་ཉར་འཇོག་ཙམ་ལས་ཚོང་ལས་རྗེས་འདེད་བྱེད་མཁན་གྱི་ Cookie གང་ཡང་མེད།',
        ],
      },
      {
        title: '༢། ཁྲིམས་མཐུན་གཞི་འཛིན་དང་གསུམ་པའི་ཞབས་ཞུ།',
        paragraphs: [
          'GDPR དོན་ཚན་ ༦ ལྟར་གན་རྒྱ་ལག་བསྟར་དང་ཁྲིམས་ལུགས་བརྩི་སྲུང་ (DSA)། བདེ་འཇགས་དང་དོ་དམ་ཁེ་ཕན། ཐོ་འགོད་སྐབས་ཀྱི་མོས་མཐུན་བཅས་ལ་གཞི་བཅོལ་ཏེ་ལས་སྣོན་བྱེད་པ་ཡིན།',
          'ལག་རྩལ་རམ་འདེགས་སྡེ་ཚན་ Google Firebase དང་ Resend དེ་བཞིན་སྐད་ཡིག་ ༧ ནང་བསྒྱུར་བའི་ཆེད་ Google Gemini API བཅས་ཡུ་རོབ་ཚད་གཞི་ (SCCs) ལྟར་བཀོལ་སྤྱོད་བྱེད་ཀྱི་ཡོད།',
        ],
      },
      {
        title: '༣། ཡུ་རོབ་ GDPR ཁེ་དབང་དང་ཞུ་གཏུག',
        paragraphs: [
          'ཁྱེད་ལ་རང་ཉིད་ཀྱི་གཞི་གྲངས་ལྟ་སྤྱོད་དང་བཟོ་བཅོས། རྩ་བསུབ། བཀག་འགོག་བཅས་ཀྱི་ཐོབ་ཐང་ཡོད་པས་ contact.jobsquad@gmail.com ལ་འབྲེལ་བ་གནང་བའམ། ཕ་རན་སིའི་གཞི་གྲངས་སྲུང་སྐྱོབ་ལས་ཁུངས་ CNIL (www.cnil.fr) ལ་ཞུ་གཏུག་བྱེད་ཐུབ།',
        ],
      },
    ],
  },
};
