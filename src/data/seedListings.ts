import type { Listing } from '../types/index.ts';

export const SEED_LISTINGS: Listing[] = [
  {
    id: 'seed-job-babysit-01',
    ownerId: 'seed-employer-1',
    ownerName: 'Famille Moreau',
    type: 'job',
    category: 'babysitting',
    title: 'After-School Bilingual Babysitter (2 Children)',
    description:
      'Seeking a caring, punctual babysitter for two children (ages 5 and 8) in Vitry-sur-Seine. Duties include school pickup, healthy snack preparation, and homework supervision Monday to Friday from 16:30 to 19:30.',
    location: 'Vitry-sur-Seine, Paris Metro',
    priceEur: 18,
    contactEmail: 'moreau.family@example.org',
    contactPhone: '+33 6 12 45 89 10',
    images: [],
    specs: { employmentType: 'Part-Time', pricePeriod: 'hour' },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 14, 9, 30),
    translations: {
      zh: {
        title: '双语课后育儿保姆（照看两名儿童）',
        description:
          '诚聘富有爱心且守时的育儿保姆，在塞纳河畔维特里照看两名儿童（5岁和8岁）。工作时间为周一至周五 16:30 至 19:30，负责接放学、准备健康加餐及辅导功课。',
        location: '法国巴黎大区 · 塞纳河畔维特里',
        specsSummary: '兼职 · 周一至周五',
      },
      en: {
        title: 'After-School Bilingual Babysitter (2 Children)',
        description:
          'Seeking a caring, punctual babysitter for two children (ages 5 and 8) in Vitry-sur-Seine. Duties include school pickup, healthy snack preparation, and homework supervision Monday to Friday from 16:30 to 19:30.',
        location: 'Vitry-sur-Seine, Paris Metro',
        specsSummary: 'Part-Time · Mon–Fri',
      },
      fr: {
        title: 'Baby-sitter bilingue périscolaire (2 enfants)',
        description:
          'Recherchons une personne attentionnée et ponctuelle pour deux enfants (5 et 8 ans) à Vitry-sur-Seine. Sortie d’école, goûter et aide aux devoirs du lundi au vendredi de 16h30 à 19h30.',
        location: 'Vitry-sur-Seine, Île-de-France',
        specsSummary: 'Temps partiel · Lun–Ven',
      },
      es: {
        title: 'Niñera bilingüe extraescolar (2 niños)',
        description:
          'Buscamos niñera responsable y puntual para dos niños (5 y 8 años) en Vitry-sur-Seine. Recogida escolar, merienda y apoyo con tareas de lunes a viernes de 16:30 a 19:30.',
        location: 'Vitry-sur-Seine, París',
        specsSummary: 'Media jornada · Lun–Vie',
      },
      dz: {
        title: 'ཨ་ལུ་གཉིས་ལྟ་རྟོག་འབད་མི་ (སྐད་གཉིས་ཤེས་མི)',
        description:
          'Vitry-sur-Seine ལུ་ ལོ་ ༥ དང་ ༨ ལང་མི་ཨ་ལུ་གཉིས་ སློབ་གྲྭ་ལས་ལེན་ནི་དང་ ཉིན་ཟས་བཟོ་ནི་ ནང་སྦྱོང་ལྟ་རྟོག་འབད་མི་ གཟའ་ཟླ་བ་ལས་སྤེན་པ་ ༡༦:༣༠-༡༩:༣༠ ཚུན་དགོཔ་ཡོད།',
        location: 'Vitry-sur-Seine, ཕ་རཱན་སི།',
        specsSummary: 'ཆུ་ཚོད་ཕྱེད་ལས་གཡོག',
      },
      gsw: {
        title: 'Zweisprachigi Chinderbetreuuig nach de Schuel (2 Chind)',
        description:
          'Mir sueched e zuverlässigi Betreuerin für zwei Chind (5 und 8 Jahr) in Vitry-sur-Seine. Abhole vo de Schuel, Zvieri und Ufgabebetreuuig vo Mäntig bis Fritig, 16:30–19:30.',
        location: 'Vitry-sur-Seine, Paris',
        specsSummary: 'Teilzyt · Mä–Fr',
      },
    },
  },
  {
    id: 'seed-job-restaurant-02',
    ownerId: 'seed-employer-2',
    ownerName: 'Bistro Lumière',
    type: 'job',
    category: 'restaurant',
    title: 'Sous Chef & Line Cook — Contemporary European Kitchen',
    description:
      'Busy neighborhood bistro seeks an experienced Sous Chef or Line Cook skilled in seasonal prep, grill station management, and food safety standards. Paid meals and two consecutive days off.',
    location: 'Paris 13e / Ivry',
    priceEur: 2650,
    contactEmail: 'careers@bistrolumiere.example.org',
    contactPhone: '+33 6 44 21 90 12',
    images: [],
    specs: { employmentType: 'Full-Time', restaurantName: 'Bistro Lumière', pricePeriod: 'month' },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 15, 11, 15),
    translations: {
      zh: {
        title: '现代欧式餐厅副厨师长 / 热菜厨师',
        description:
          '人气社区法式餐馆诚聘经验丰富的副厨师长或热菜厨师，擅长时令食材备料、扒炉档口管理及食品安全标准。提供工作餐及每周连续两天休息。',
        location: '巴黎十三区 / 伊夫里',
        specsSummary: '全职 · 包餐 · 双休',
      },
      en: {
        title: 'Sous Chef & Line Cook — Contemporary European Kitchen',
        description:
          'Busy neighborhood bistro seeks an experienced Sous Chef or Line Cook skilled in seasonal prep, grill station management, and food safety standards. Paid meals and two consecutive days off.',
        location: 'Paris 13e / Ivry',
        specsSummary: 'Full-Time · Meals Included',
      },
      fr: {
        title: 'Sous-chef / Cuisinier de partie — Cuisine européenne',
        description:
          'Bistrot animé recherche un sous-chef ou cuisinier confirmé pour la mise en place, le poste grill et le respect des normes HACCP. Repas fournis et deux jours de repos consécutifs.',
        location: 'Paris 13e / Ivry-sur-Seine',
        specsSummary: 'Temps plein · 2 jours de repos',
      },
      es: {
        title: 'Segundo de cocina / Cocinero — Bistró europeo',
        description:
          'Restaurante de barrio busca cocinero con experiencia en preparación estacional, parrilla e higiene alimentaria. Comidas incluidas y dos días libres seguidos.',
        location: 'París 13 / Ivry',
        specsSummary: 'Tiempo completo · Comidas incluidas',
      },
      dz: {
        title: 'ཟ་ཁང་གི་མ་ཆེན་འོག་མ་དང་ཟས་བཟོ་བ།',
        description:
          'པེ་རིསི་ ༡༣ ནང་ཡོད་པའི་ཟ་ཁང་ནང་ ཉམས་མྱོང་ཅན་གྱི་མ་ཆེན་འོག་མ་དགོཔ་ཡོད། ཟ་འཐུང་རིན་མེད་དང་ བདུན་ཕྲག་རེ་ནང་ངལ་གསོ་ཉིན་གཉིས་ཡོད།',
        location: 'Paris 13e, ཕ་རཱན་སི།',
        specsSummary: 'དུས་ཚོད་ཆ་ཚང་།',
      },
      gsw: {
        title: 'Sous-Chef & Postechoch — Moderns Bistro',
        description:
          'Lebändigs Quartier-Bistro suecht en erfahrene Sous-Chef für saisonali Chuchi, Grillposten und HACCP-Standards. Verpflegig und zwei zämehängendi Freitäg.',
        location: 'Paris 13e / Ivry',
        specsSummary: 'Vollzyt · 100%',
      },
    },
  },
  {
    id: 'seed-job-construction-03',
    ownerId: 'seed-employer-3',
    ownerName: 'Bâtir & Rénover SAS',
    type: 'job',
    category: 'construction',
    title: 'Site Electrician & Interior Renovation Specialist',
    description:
      'Growing renovation contractor hiring qualified electricians and multi-trade renovation technicians for residential apartments across Île-de-France. Safety gear, van transport, and overtime bonuses provided.',
    location: 'Creteil & Val-de-Marne',
    priceEur: 3100,
    contactEmail: 'rh@batir-renover.example.org',
    contactPhone: '+33 6 88 19 33 71',
    images: [],
    specs: { employmentType: 'Full-Time', pricePeriod: 'month' },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 16, 8, 45),
    translations: {
      zh: {
        title: '工地持证电工及室内翻新技师',
        description:
          '大型住宅翻新工程公司诚聘持证电工及综合装修技师，负责法兰西岛大区公寓翻新。公司配备全套安全防护装备、工程用车及加班奖金。',
        location: '克雷泰伊 / 马恩河谷省',
        specsSummary: '全职 · 配工作车',
      },
      en: {
        title: 'Site Electrician & Interior Renovation Specialist',
        description:
          'Growing renovation contractor hiring qualified electricians and multi-trade renovation technicians for residential apartments across Île-de-France. Safety gear, van transport, and overtime bonuses provided.',
        location: 'Créteil & Val-de-Marne',
        specsSummary: 'Full-Time · Tools & Van',
      },
      fr: {
        title: 'Électricien de chantier & Rénovation intérieure',
        description:
          'Entreprise générale recrute électriciens qualifiés et techniciens polyvalents pour des rénovations d’appartements en Île-de-France. Équipement, véhicule et primes fournis.',
        location: 'Créteil & Val-de-Marne',
        specsSummary: 'CDI · Véhicule fourni',
      },
      es: {
        title: 'Electricista de obra y especialista en reformas',
        description:
          'Contratista de reformas busca electricistas cualificados y técnicos polivalentes para viviendas en Île-de-France. Incluye equipo de seguridad, furgoneta y bonos.',
        location: 'Créteil y Val-de-Marne',
        specsSummary: 'Jornada completa · Vehículo incluido',
      },
      dz: {
        title: 'བཟོ་སྐྲུན་གློག་རིག་པ་དང་ནང་ཁྱིམ་བསྐྱར་བཟོ་མཁསཔ།',
        description:
          'Val-de-Marne ཁུལ་གྱི་སྡོད་ཁྱིམ་ཉམས་བཅོས་ལས་སྡེའི་ནང་ གློག་རིག་པ་དགོཔ་ཡོད། ཉེན་སྲུང་ཆས་དང་འགྲུལ་འཁོར་ལས་སྡེ་གིས་སྤྲོདཔ་ཨིན།',
        location: 'Créteil, Val-de-Marne',
        specsSummary: 'དུས་ཚོད་ཆ་ཚང་།',
      },
      gsw: {
        title: 'Baustelle-Elektriker & Innere-Uusbau-Fachmaa',
        description:
          'Wachsendi Umbaufirma suecht Elektriker und Allrounder für Wohnigs-Sanierige. Schutzausrüschtig, Gschäftsfahrzüg und Überzyt-Zuelage inbegriffe.',
        location: 'Créteil & Val-de-Marne',
        specsSummary: 'Vollzyt · Gschäftsfahrzüg',
      },
    },
  },
  {
    id: 'seed-job-cleaning-04',
    ownerId: 'seed-employer-4',
    ownerName: 'ClaireNet Services',
    type: 'job',
    category: 'cleaning',
    title: 'Commercial Office & Boutique Cleaning Coordinator',
    description:
      'Reliable cleaning specialist needed for morning office suites and design showrooms. Eco-certified supplies provided on site; flexible 25–35 hour weekly schedule.',
    location: 'Vitry-sur-Seine & Choisy-le-Roi',
    priceEur: 16,
    contactEmail: 'jobs@clairenet.example.org',
    contactPhone: '+33 6 70 15 48 92',
    images: [],
    specs: { employmentType: 'Flexible', pricePeriod: 'hour' },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 16, 14, 20),
    translations: {
      zh: {
        title: '写字楼及精品展厅保洁专员',
        description:
          '诚聘细心可靠的晨间保洁专员，负责办公套房及设计展厅日常清洁维护。现场提供环保认证清洁用品，每周 25–35 小时灵活排班。',
        location: '塞纳河畔维特里 & 舒瓦西勒鲁瓦',
        specsSummary: '每周 25–35 小时 · 弹性班次',
      },
      en: {
        title: 'Commercial Office & Boutique Cleaning Coordinator',
        description:
          'Reliable cleaning specialist needed for morning office suites and design showrooms. Eco-certified supplies provided on site; flexible 25–35 hour weekly schedule.',
        location: 'Vitry-sur-Seine & Choisy-le-Roi',
        specsSummary: 'Flexible · 25–35 hrs/wk',
      },
      fr: {
        title: 'Agent d’entretien bureaux et boutiques',
        description:
          'Recherchons agent fiable pour l’entretien matinal de bureaux et showrooms. Produits écologiques fournis sur place, planning flexible de 25h à 35h par semaine.',
        location: 'Vitry-sur-Seine & Choisy-le-Roi',
        specsSummary: '25h–35h/semaine · Matin',
      },
      es: {
        title: 'Especialista de limpieza de oficinas y locales',
        description:
          'Se busca personal fiable para limpieza matinal de oficinas y salas de exposición. Productos ecológicos provistos y horario flexible de 25 a 35 horas semanales.',
        location: 'Vitry-sur-Seine y Choisy-le-Roi',
        specsSummary: 'Horario flexible · 25–35 h/sem',
      },
      dz: {
        title: 'ཡིག་ཚང་དང་ཚོང་ཁང་གཙང་སྦྲ་འགོ་འདྲེནཔ།',
        description:
          'དྲོ་པ་ཡིག་ཚང་དང་ཚོང་ཁང་གཙང་སྦྲ་འབད་མི་དགོཔ་ཡོད། གཙང་སྦྲའི་ཅ་ལག་ཚུ་ལས་སྡེ་གིས་སྤྲོད་ནི་དང་ བདུན་ཕྲག་རེ་ལུ་ཆུ་ཚོད་ ༢༥ ལས་ ༣༥ བར་སྒྱུར་བཅོས་བཏུབ།',
        location: 'Vitry-sur-Seine, ཕ་རཱན་སི།',
        specsSummary: 'ཆུ་ཚོད་སྒྱུར་བཅོས་བཏུབ།',
      },
      gsw: {
        title: 'Reinigungsfachchraft für Büro & Showrooms',
        description:
          'Zuverlässigi Reinigungsfachchraft für am Morge i Büros und Usstellige gsuecht. Öko-Reinigungsmittel vor Ort, flexibli 25–35 Stunde pro Wuche.',
        location: 'Vitry-sur-Seine & Choisy-le-Roi',
        specsSummary: 'Flexibel · 60–80%',
      },
    },
  },
  {
    id: 'seed-job-elderly-05',
    ownerId: 'seed-employer-5',
    ownerName: 'Résidence Soleil',
    type: 'job',
    category: 'elderly_care',
    title: 'Certified Elderly Care Assistant (Day Shift)',
    description:
      'Compassionate caregiver needed to assist senior residents with morning routines, light meal prep, medication reminders, and mobility walks. Supportive care team and transit pass reimbursement.',
    location: 'Villejuif, Greater Paris',
    priceEur: 2250,
    contactEmail: 'care@residencesoleil.example.org',
    contactPhone: '+33 6 51 89 44 20',
    images: [],
    specs: { employmentType: 'Full-Time', pricePeriod: 'month' },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 17, 10, 0),
    translations: {
      zh: {
        title: '持证长者照护专员（白班）',
        description:
          '诚聘富有同情心与耐心的照护专员，协助长者完成晨间起居、营养简餐准备、用药提醒及日常散步陪伴。团队氛围融洽，报销交通月票。',
        location: '维勒瑞夫（大巴黎区）',
        specsSummary: '全职白班 · 交通补贴',
      },
      en: {
        title: 'Certified Elderly Care Assistant (Day Shift)',
        description:
          'Compassionate caregiver needed to assist senior residents with morning routines, light meal prep, medication reminders, and mobility walks. Supportive care team and transit pass reimbursement.',
        location: 'Villejuif, Greater Paris',
        specsSummary: 'Full-Time · Day Shift',
      },
      fr: {
        title: 'Auxiliaire de vie pour personnes âgées (Jour)',
        description:
          'Recherchons accompagnant(e) bienveillant(e) pour aide au lever, repas légers, rappels de médicaments et promenades. Équipe solidaire et remboursement du pass transport.',
        location: 'Villejuif, Grand Paris',
        specsSummary: 'Temps plein · Horaire de jour',
      },
      es: {
        title: 'Auxiliar de cuidado para adultos mayores (Turno día)',
        description:
          'Buscamos cuidador compasivo para apoyar con rutinas matinales, comidas ligeras, recordatorio de medicación y paseos. Equipo cercano y abono de transporte.',
        location: 'Villejuif, Gran París',
        specsSummary: 'Tiempo completo · Turno día',
      },
      dz: {
        title: 'རྒན་ཤོས་ལྟ་རྟོག་པ་ (ཉིན་མོའི་ལས་རིམ)',
        description:
          'རྒན་ཤོས་ཚུ་ལུ་ དྲོ་པ་གཙང་སྦྲ་ བཞེས་སྒོ་ སྨན་དུས་དྲན་བསྐུལ་ དང་ འཆམ་འཆམ་སྐབས་རོགས་རམ་འབད་མི་དགོཔ་ཡོད། འགྲུལ་བསྐྱོད་ཀྱི་འཛིན་ཤོག་བྱིནམ་ཨིན།',
        location: 'Villejuif, Paris',
        specsSummary: 'ཉིན་མོའི་དུས་ཚོད་ཆ་ཚང་།',
      },
      gsw: {
        title: 'Betreuigsfachchraft für Seniore (Tagdienst)',
        description:
          'Herzliche Pflägehelfer für Morgeroutine, liechti Mahlzyte, Medikamänte-Erinnerig und Spaziergäng gsuecht. Tolles Team und ÖV-Abo-Bitrag.',
        location: 'Villejuif, Grossruum Paris',
        specsSummary: 'Vollzyt · Tagdienst',
      },
    },
  },
  {
    id: 'seed-job-companion-06',
    ownerId: 'seed-employer-6',
    ownerName: 'Liaison Humaine',
    type: 'job',
    category: 'companion',
    title: 'Social Companion & Appointment Escort',
    description:
      'Warm, conversational companion needed to accompany seniors or recovering adults to medical appointments, cultural outings, grocery runs, and afternoon tea.',
    location: 'Gentilly / Arcueil',
    priceEur: 19,
    contactEmail: 'hello@liaisonhumaine.example.org',
    contactPhone: '+33 6 33 90 12 77',
    images: [],
    specs: { employmentType: 'Part-Time', pricePeriod: 'hour' },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 18, 16, 10),
    translations: {
      zh: {
        title: '贴心陪护与出行陪同专员',
        description:
          '诚聘温和健谈的陪护专员，陪同长者或康复期人士前往医院就诊、文化休闲活动、超市采买及下午茶陪伴。',
        location: '让蒂伊 / 阿尔克伊',
        specsSummary: '兼职 · 弹性安排',
      },
      en: {
        title: 'Social Companion & Appointment Escort',
        description:
          'Warm, conversational companion needed to accompany seniors or recovering adults to medical appointments, cultural outings, grocery runs, and afternoon tea.',
        location: 'Gentilly / Arcueil',
        specsSummary: 'Part-Time · Flexible',
      },
      fr: {
        title: 'Dame / Compagnon de compagnie et sorties',
        description:
          'Personne chaleureuse recherchée pour accompagner des seniors ou adultes en convalescence aux rendez-vous médicaux, sorties culturelles et courses de proximité.',
        location: 'Gentilly / Arcueil',
        specsSummary: 'Temps partiel · Flexible',
      },
      es: {
        title: 'Acompañante social y traslados a citas',
        description:
          'Buscamos acompañante amable para asistir a adultos mayores en citas médicas, paseos culturales, compras y momentos de conversación.',
        location: 'Gentilly / Arcueil',
        specsSummary: 'Tiempo parcial · Flexible',
      },
      dz: {
        title: 'མཉམ་འགྲོ་རོགས་པ་དང་སྨན་ཁང་བསྐྱལ་མི།',
        description:
          'རྒན་ཤོས་དང་ནད་པ་དྲག་སྐྱེད་ཅན་ཚུ་ སྨན་ཁང་དང་ཚོང་ཁང་ ལྟ་སྐོར་ལུ་འགྲོ་བའི་སྐབས་ མཉམ་དུ་འགྲོ་མི་སེམས་བཟང་རོགས་པ་དགོཔ་ཡོད།',
        location: 'Gentilly / Arcueil',
        specsSummary: 'ཆུ་ཚོད་ཕྱེད་ལས་གཡོག',
      },
      gsw: {
        title: 'Gsellschafts-Begleitig & Termin-Begleitperson',
        description:
          'Warmherzige Begleiter gsuecht für Arzttermin, kulturelli Usflüg, Iichäuf und gmeinsami Kafi-Pouse mit ältere Mänsche.',
        location: 'Gentilly / Arcueil',
        specsSummary: 'Teilzyt · Flexibel',
      },
    },
  },
  // HOUSE RENTALS
  {
    id: 'seed-house-vitry-01',
    ownerId: 'seed-owner-1',
    ownerName: 'Marc Delacroix',
    type: 'house',
    category: 'apartment',
    title: 'Sunlit 2-Bedroom Parisian Apartment with Balcony',
    description:
      'Bright 78 m² furnished apartment located 4 minutes from Tram T9 in Vitry-sur-Seine. Features oak herringbone flooring, tall French windows, modern open kitchen, high-speed fiber, and quiet courtyard exposure.',
    location: '14 Rue Pasteur, Vitry-sur-Seine, 94400',
    priceEur: 1480,
    contactEmail: 'marc.delacroix@example.org',
    contactPhone: '+33 6 19 84 22 05',
    images: ['/src/assets/images/house_modern_vitry_1795026725502.jpg'],
    specs: {
      bedrooms: 2,
      bathrooms: 1,
      areaSqm: 78,
      furnished: true,
      pricePeriod: 'month',
    },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 13, 12, 0),
    translations: {
      zh: {
        title: '巴黎大区阳光两室一厅精装阳台公寓',
        description:
          '位于塞纳河畔维特里 78 平方米明亮精装公寓，步行 4 分钟即达 T9 有轨电车站。配备人字拼橡木地板、法式落地窗、开放式现代厨房与高速光纤，临静谧中庭。',
        location: '法国 94400 维特里 Pasteur 街 14 号',
        specsSummary: '2室1卫 · 78 m² · 拎包入住',
      },
      en: {
        title: 'Sunlit 2-Bedroom Parisian Apartment with Balcony',
        description:
          'Bright 78 m² furnished apartment located 4 minutes from Tram T9 in Vitry-sur-Seine. Features oak herringbone flooring, tall French windows, modern open kitchen, high-speed fiber, and quiet courtyard exposure.',
        location: '14 Rue Pasteur, Vitry-sur-Seine, 94400',
        specsSummary: '2 Beds · 1 Bath · 78 m² · Furnished',
      },
      fr: {
        title: 'Appartement T3 lumineux avec balcon — Vitry-sur-Seine',
        description:
          'Bel appartement meublé de 78 m² à 4 minutes du Tram T9. Parquet en chêne, grandes fenêtres à la française, cuisine équipée, fibre optique et vue sur cour calme.',
        location: '14 Rue Pasteur, Vitry-sur-Seine, 94400',
        specsSummary: '2 Chambres · 1 SDB · 78 m² · Meublé',
      },
      es: {
        title: 'Luminoso apartamento amueblado de 2 dormitorios con balcón',
        description:
          'Amplio piso amueblado de 78 m² a 4 minutos del Tranvía T9 en Vitry-sur-Seine. Suelos de roble, ventanales franceses, cocina equipada y fibra óptica.',
        location: '14 Rue Pasteur, Vitry-sur-Seine, 94400',
        specsSummary: '2 Hab · 1 Baño · 78 m² · Amueblado',
      },
      dz: {
        title: 'ཉལ་ཁང་ ༢ ཅན་གྱི་འོད་མདངས་ཆེ་བའི་སྡོད་ཁྱིམ།',
        description:
          'Vitry-sur-Seine ལུ་ རྒྱ་ཁྱོན་ ༧༨ m² ཡོད་པའི་སྡོད་ཁྱིམ་ཁྱིམ་ཆས་ཆ་ཚང་ཅན་ རླུང་འགྲོ་བཟང་བའི་སྒོ་སྒྲིག་དང་འབྲེལ་བ་འཐབ་ཚུགས།',
        location: 'Vitry-sur-Seine, 94400, ཕ་རཱན་སི།',
        specsSummary: 'ཉལ་ཁང་ ༢ · ༧༨ m²',
      },
      gsw: {
        title: 'Hellmöblierti 3-Zimmer-Wohnig mit Balkon',
        description:
          '78 m² grossi, möblierti Wohnig nur 4 Minute vom Tram T9 i Vitry-sur-Seine. Eicheparkett, hochi Fänster, moderni Chuchi und Glasfaser-Internet.',
        location: '14 Rue Pasteur, Vitry-sur-Seine, 94400',
        specsSummary: '2 Schlafzimmer · 78 m² · Möbliert',
      },
    },
  },
  {
    id: 'seed-house-villa-02',
    ownerId: 'seed-owner-2',
    ownerName: 'Sophie Laurent',
    type: 'house',
    category: 'villa',
    title: 'Limestone 4-Bedroom Family Townhome & Garden',
    description:
      'Spacious 165 m² limestone townhome featuring a landscaped garden courtyard, private garage, 4 bedrooms, 2.5 bathrooms, and energy-efficient heat pump heating. Ideal for families or remote executives.',
    location: 'Antony / Parc de Sceaux',
    priceEur: 2850,
    contactEmail: 'sophie.laurent@example.org',
    contactPhone: '+33 7 82 14 55 90',
    images: ['/src/assets/images/house_family_villa_1795026725743.jpg'],
    specs: {
      bedrooms: 4,
      bathrooms: 3,
      areaSqm: 165,
      furnished: false,
      pricePeriod: 'month',
    },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 15, 15, 30),
    translations: {
      zh: {
        title: '石灰岩四居室庭院家庭别墅（带私家车库）',
        description:
          '165 平方米宽敞四居室联排别墅，附带精致园艺庭院、私人车库、3 间卫浴及高效热泵供暖系统，毗邻索镇公园，适合家庭居住或高管长租。',
        location: '巴黎南郊 · 安东尼 / 索镇公园',
        specsSummary: '4室3卫 · 165 m² · 带花园车库',
      },
      en: {
        title: 'Limestone 4-Bedroom Family Townhome & Garden',
        description:
          'Spacious 165 m² limestone townhome featuring a landscaped garden courtyard, private garage, 4 bedrooms, 3 bathrooms, and energy-efficient heat pump heating. Ideal for families or remote executives.',
        location: 'Antony / Parc de Sceaux',
        specsSummary: '4 Beds · 3 Baths · 165 m² · Garden',
      },
      fr: {
        title: 'Maison familiale 4 chambres avec jardin paysager',
        description:
          'Spacieuse maison en pierre de 165 m² offrant jardin clos, garage privé, 4 chambres, 3 salles de bain et pompe à chaleur économique à proximité du Parc de Sceaux.',
        location: 'Antony / Parc de Sceaux',
        specsSummary: '4 Chambres · 3 SDB · 165 m² · Jardin',
      },
      es: {
        title: 'Casa adosada de piedra de 4 dormitorios con jardín',
        description:
          'Amplia vivienda de 165 m² con jardín privado, garaje, 4 habitaciones, 3 baños y climatización eficiente junto al Parque de Sceaux.',
        location: 'Antony / Parc de Sceaux',
        specsSummary: '4 Hab · 3 Baños · 165 m² · Jardín',
      },
      dz: {
        title: 'ཉལ་ཁང་ ༤ དང་ལྡུམ་ར་ཅན་གྱི་བཟའ་ཚང་ཁྱིམ།',
        description:
          'རྒྱ་ཁྱོན་ ༡༦༥ m² ཡོད་པའི་ཁྱིམ་གཞིས་ སྒེར་གྱི་སྣུམ་འཁོར་བཞག་སའི་ཁང་མིག་དང་ལྡུམ་ར་ ཁྲུས་ཁང་ ༣ བཅས་ཡོདཔ་ཨིན།',
        location: 'Antony / Parc de Sceaux, Paris',
        specsSummary: 'ཉལ་ཁང་ ༤ · ༡༦༥ m²',
      },
      gsw: {
        title: 'Grosszügigs 5.5-Zimmer-Reihehus mit Garte',
        description:
          '165 m² Steihus mit pflegtem Garte, Privatgarage, 4 Schlafzimmer, 3 Bäder und Wärmepumpi-Heizig. Ideal für Familie.',
        location: 'Antony / Parc de Sceaux',
        specsSummary: '4 Schlafzimmer · 165 m² · Garte',
      },
    },
  },
  // CAR RENTALS
  {
    id: 'seed-car-sedan-01',
    ownerId: 'seed-car-1',
    ownerName: 'AutoÉlite Mobilité',
    type: 'car',
    category: 'sedan',
    title: '2025 Electric Executive Sedan — Long Range',
    description:
      'Immaculate slate-blue executive EV sedan with 560 km WLTP range, panoramic glass roof, adaptive cruise control, and fast-charging badge included. Available for daily, weekend, or business hire.',
    location: 'Vitry-sur-Seine / Orly Airport',
    priceEur: 74,
    contactEmail: 'fleet@autoelite.example.org',
    contactPhone: '+33 6 95 40 18 27',
    images: ['/src/assets/images/car_electric_sedan_1795026727044.jpg'],
    specs: {
      year: 2025,
      transmission: 'Automatic',
      fuel: 'Electric',
      seats: 5,
      pricePeriod: 'day',
    },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 16, 17, 45),
    translations: {
      zh: {
        title: '2025款长续航纯电行政级轿车出租',
        description:
          '全新岩板蓝纯电行政轿车，WLTP 续航 560 公里，配备全景天窗、自适应巡航及快充卡。支持日租、周末短租及商务接待。',
        location: '维特里 / 巴黎奥利机场周边',
        specsSummary: '2025年 · 自动挡 · 纯电动 · 5座',
      },
      en: {
        title: '2025 Electric Executive Sedan — Long Range',
        description:
          'Immaculate slate-blue executive EV sedan with 560 km WLTP range, panoramic glass roof, adaptive cruise control, and fast-charging badge included. Available for daily, weekend, or business hire.',
        location: 'Vitry-sur-Seine / Orly Airport',
        specsSummary: '2025 · Automatic · Electric · 5 Seats',
      },
      fr: {
        title: 'Berline Électrique 2025 Grande Autonomie',
        description:
          'Superbe berline électrique bleu ardoise (560 km WLTP), toit panoramique, régulateur adaptatif et badge de recharge inclus. Location à la journée ou au week-end.',
        location: 'Vitry-sur-Seine / Aéroport d’Orly',
        specsSummary: '2025 · Automatique · Électrique · 5 places',
      },
      es: {
        title: 'Sedán eléctrico ejecutivo 2025 — Gran autonomía',
        description:
          'Impecable berlina eléctrica azul pizarra con 560 km de autonomía, techo panorámico y tarjeta de carga rápida incluida. Alquiler por días o fines de semana.',
        location: 'Vitry-sur-Seine / Aeropuerto de Orly',
        specsSummary: '2025 · Automático · Eléctrico · 5 plazas',
      },
      dz: {
        title: '༢༠༢༥ གློག་ཤུགས་སྣུམ་འཁོར་སེ་ཌཱན་ (ཐག་རིང་བསྐྱོད་ཚུགས་མི)',
        description:
          'གློག་ཐེངས་གཅིག་གིས་ཀི་ལོ་མི་ཊར་ ༥༦༠ བསྐྱོད་ཚུགས་པའི་སྣུམ་འཁོར་ ཉིན་རེའི་གླ་ཆ་བཏབ་སྟེ་གཡར་ཚུགས།',
        location: 'Vitry-sur-Seine / Orly',
        specsSummary: '༢༠༢༥ · རང་འགུལ་ · སྡོད་ཁྲི་ ༥',
      },
      gsw: {
        title: '2025 Elektro-Limousine mit Langstrecki',
        description:
          'Toppflegti Elektro-Limousine mit 560 km Richwiiti, Panoramadach und Ladecharte inbegriffe. Ideal für Tages- oder Gschäftsmieti.',
        location: 'Vitry-sur-Seine / Flughafe Orly',
        specsSummary: '2025 · Automat · Elektro · 5 Plätz',
      },
    },
  },
  {
    id: 'seed-car-suv-02',
    ownerId: 'seed-car-2',
    ownerName: 'Alpine Mobility GmbH',
    type: 'car',
    category: 'suv',
    title: '2024 Hybrid Compact SUV — All-Season Ready',
    description:
      'Pearl-white self-charging hybrid SUV equipped with winter-rated tires, Apple CarPlay / Android Auto, spacious luggage boot, and full comprehensive insurance.',
    location: 'Zurich / Geneva / Paris Pickup',
    priceEur: 68,
    contactEmail: 'rent@alpinemobility.example.org',
    contactPhone: '+41 44 580 29 14',
    images: ['/src/assets/images/car_compact_suv_1795026730322.jpg'],
    specs: {
      year: 2024,
      transmission: 'Automatic',
      fuel: 'Hybrid',
      seats: 5,
      pricePeriod: 'day',
    },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 17, 13, 15),
    translations: {
      zh: {
        title: '2024款珠光白混动紧凑型 SUV（全季节轮胎）',
        description:
          '珠光白油电混动 SUV，配备四季雪地认证轮胎、CarPlay 无线互联、宽大行李厢及全额商业保险，支持长短途租用。',
        location: '苏黎世 / 日内瓦 / 巴黎取车',
        specsSummary: '2024年 · 自动挡 · 油电混动 · 5座',
      },
      en: {
        title: '2024 Hybrid Compact SUV — All-Season Ready',
        description:
          'Pearl-white self-charging hybrid SUV equipped with winter-rated tires, Apple CarPlay / Android Auto, spacious luggage boot, and full comprehensive insurance.',
        location: 'Zurich / Geneva / Paris Pickup',
        specsSummary: '2024 · Automatic · Hybrid · 5 Seats',
      },
      fr: {
        title: 'SUV Compact Hybride 2024 — Toutes saisons',
        description:
          'SUV hybride blanc nacré équipé de pneus toutes saisons, CarPlay, grand coffre et assurance tous risques incluse.',
        location: 'Zurich / Genève / Paris',
        specsSummary: '2024 · Automatique · Hybride · 5 places',
      },
      es: {
        title: 'SUV compacto híbrido 2024 — Todo clima',
        description:
          'SUV híbrido blanco perla con neumáticos de invierno, Apple CarPlay, maletero amplio y seguro a todo riesgo incluido.',
        location: 'Zúrich / Ginebra / París',
        specsSummary: '2024 · Automático · Híbrido · 5 plazas',
      },
      dz: {
        title: '༢༠༢༤ ཧའི་བི་རིཌ་ SUV སྣུམ་འཁོར།',
        description:
          'ཉེན་སྲུང་འགན་ལེན་ཆ་ཚང་ཡོད་པའི་ ༢༠༢༤ ལོའི་ཧའི་བི་རིཌ་ SUV སྣུམ་འཁོར་གླ་གཡར་འབད་ཚུགས།',
        location: 'Zurich / Geneva / Paris',
        specsSummary: '༢༠༢༤ · ཧའི་བི་རིཌ་ · སྡོད་ཁྲི་ ༥',
      },
      gsw: {
        title: '2024 Hybrid-Kompakt-SUV — Wintertauglich',
        description:
          'Perlwyss Hybrid-SUV mit Allwetter-Pneu, CarPlay, grossem Kofferrum und Vollkasko-Versicherig inklusive.',
        location: 'Züri / Gämf / Paris',
        specsSummary: '2024 · Automat · Hybrid · 5 Plätz',
      },
    },
  },
  // LOCAL SALES MARKETPLACE
  {
    id: 'seed-sale-laptop-01',
    ownerId: 'seed-seller-1',
    ownerName: 'Lucas Chen',
    type: 'sale',
    category: 'electronics',
    title: 'Pro Ultrabook 14" (32GB RAM / 1TB SSD) + Mechanical Keyboard',
    description:
      'Barely used brushed aluminum 14-inch developer workstation laptop paired with a wireless tactile mechanical keyboard. Includes original box, USB-C GaN charger, and remaining warranty.',
    location: 'Vitry-sur-Seine, 94400',
    priceEur: 1150,
    contactEmail: 'lucas.chen@example.org',
    contactPhone: '+33 6 28 73 41 09',
    images: ['/src/assets/images/sales_laptop_desk_1795026726677.jpg'],
    specs: { condition: 'Like New', brand: 'ProBook Studio', pricePeriod: 'once' },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 17, 18, 5),
    translations: {
      zh: {
        title: '14英寸专业铝合金超极本（32G+1TB）含无线机械键盘',
        description:
          '成色极新 14 英寸开发办公高性能笔记本电脑，搭配定制无线机械键盘。附原装包装盒、氮化镓快充头及官方剩余保修。',
        location: '法国 94400 维特里',
        specsSummary: '几乎全新 · 32GB / 1TB',
      },
      en: {
        title: 'Pro Ultrabook 14" (32GB RAM / 1TB SSD) + Mechanical Keyboard',
        description:
          'Barely used brushed aluminum 14-inch developer workstation laptop paired with a wireless tactile mechanical keyboard. Includes original box, USB-C GaN charger, and remaining warranty.',
        location: 'Vitry-sur-Seine, 94400',
        specsSummary: 'Like New · 32GB / 1TB',
      },
      fr: {
        title: 'Ultrabook Pro 14" (32 Go / 1 To SSD) + Clavier mécanique',
        description:
          'Ordinateur portable aluminium 14 pouces quasi neuf avec clavier mécanique sans fil. Boîte d’origine, chargeur USB-C et garantie constructeur inclus.',
        location: 'Vitry-sur-Seine, 94400',
        specsSummary: 'Comme neuf · 32 Go / 1 To',
      },
      es: {
        title: 'Ultrabook Pro 14" (32GB / 1TB SSD) + Teclado mecánico',
        description:
          'Portátil profesional de aluminio casi nuevo acompañado de teclado mecánico inalámbrico. Incluye caja original, cargador USB-C y garantía vigente.',
        location: 'Vitry-sur-Seine, 94400',
        specsSummary: 'Como nuevo · 32GB / 1TB',
      },
      dz: {
        title: '༡༤" ཨཱལ་ཊ་ར་བུཀ་གློག་ཀླད་དང་མེ་ཀེ་ནི་ཀཱལ་ཀི་བོརཌ།',
        description:
          'གསརཔ་བཟུམ་ཡོད་པའི་ 32GB RAM / 1TB SSD གློག་ཀླད་དང་ ཀི་བོརཌ་ འགོ་ཐོག་སྒྲོམ་བཅས་བཙོང་ནི་ཡོད།',
        location: 'Vitry-sur-Seine, 94400',
        specsSummary: 'གསརཔ་བཟུམ།',
      },
      gsw: {
        title: 'Pro Ultrabook 14" (32GB / 1TB) + Mechanischi Tastatur',
        description:
          'Fast neuwärtige 14-Zoll-Laptop inklusiv kabelloser mechanischer Tastatur, Originalverpackig, USB-C-Ladegerät und Restgarantie.',
        location: 'Vitry-sur-Seine, 94400',
        specsSummary: 'Wie neu · 32GB / 1TB',
      },
    },
  },
  {
    id: 'seed-sale-espresso-02',
    ownerId: 'seed-seller-2',
    ownerName: 'Elena Rossi',
    type: 'sale',
    category: 'appliances',
    title: 'Italian Dual-Boiler Stainless Espresso Machine',
    description:
      'Artisan brushed stainless steel dual-boiler espresso machine with PID temperature control, rotary pressure gauges, bottomless portafilter, and tamper set. Descaled and tested.',
    location: 'Paris 5e / Quartier Latin',
    priceEur: 790,
    contactEmail: 'elena.rossi@example.org',
    contactPhone: '+33 6 61 08 55 43',
    images: ['/src/assets/images/sales_espresso_machine_1795026727874.jpg'],
    specs: { condition: 'Excellent', brand: 'Aurora Artigiana', pricePeriod: 'once' },
    status: 'active',
    isSeeded: true,
    createdAt: Date.UTC(2026, 10, 18, 19, 20),
    translations: {
      zh: {
        title: '意式双锅炉拉丝不锈钢半自动咖啡机',
        description:
          '手工工艺双锅炉意式浓缩咖啡机，带 PID 精准控温、双压力表、无底手柄及压粉套装。已完成深度除钙保养，性能完好。',
        location: '巴黎第五区 · 拉丁区',
        specsSummary: '成色极佳 · 双锅炉 PID',
      },
      en: {
        title: 'Italian Dual-Boiler Stainless Espresso Machine',
        description:
          'Artisan brushed stainless steel dual-boiler espresso machine with PID temperature control, rotary pressure gauges, bottomless portafilter, and tamper set. Descaled and tested.',
        location: 'Paris 5e / Quartier Latin',
        specsSummary: 'Excellent · Dual-Boiler PID',
      },
      fr: {
        title: 'Machine Espresso Italienne Double Chaudière Inox',
        description:
          'Machine espresso artisanale double chaudière avec contrôle PID, manomètres, porte-filtre sans fond et tamper. Détartrée et révisée.',
        location: 'Paris 5e / Quartier Latin',
        specsSummary: 'Excellent état · Double chaudière',
      },
      es: {
        title: 'Cafetera Espresso Italiana de Acero Inoxidable',
        description:
          'Máquina espresso artesanal de doble caldera con control PID, manómetros de presión, portafiltro desnudo y prensa incluidos. Revisada y descalcificada.',
        location: 'París 5 / Barrio Latino',
        specsSummary: 'Excelente · Doble caldera',
      },
      dz: {
        title: 'ཨི་ཊ་ལི་ཀཱ་ཕི་འཕྲུལ་ཆས་ལྕགས་རིགས།',
        description:
          'གནས་སྟངས་ལེགས་ཤོམ་ཡོད་པའི་ཀཱ་ཕི་འཕྲུལ་ཆས་ ཆ་ཚང་བཀྲུ་བཤལ་འབད་དེ་བརྟག་དཔྱད་གྲུབ་པ་བཙོང་ནི་ཡོད།',
        location: 'Paris 5e, ཕ་རཱན་སི།',
        specsSummary: 'ལེགས་ཤོམ།',
      },
      gsw: {
        title: 'Italiänischi Dual-Boiler Espresso-Maschine',
        description:
          'Edelstahl-Espressomaschine mit PID-Regelig, Manometer, bodelosem Siebträger und Tamper. Frisch entkalkt und prüeft.',
        location: 'Paris 5e / Quartier Latin',
        specsSummary: 'Sehr guet · Dual-Boiler',
      },
    },
  },
];
