// ==========================================================================
// Gremio Estelar - Sistema Unificado de Postulaciones Estelares
// ==========================================================================

export type ApplicationRole =
  | 'MODERATOR'
  | 'ADMIN'
  | 'VTUBER'
  | 'STREAMER'
  | 'ARTIST'
  | 'CLIPPER'
  | 'HELPER';

export interface ApplicationQuestion {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

export interface UniqueChallengeOption {
  value: string;
  label: string;
  description?: string;
}

export interface UniqueChallenge {
  id: string;
  title: string;
  tagline: string;
  type: 'scenario' | 'audio_or_lore' | 'stream_showcase' | 'portfolio' | 'clip_breakdown' | 'support_simulation';
  instructions: string;
  promptScenario?: string;
  options?: UniqueChallengeOption[];
  requiresActionChoice?: boolean;
  requiresTextJustification?: boolean;
  justificationPlaceholder?: string;
  requiresMediaOrUrl?: boolean;
  mediaLabel?: string;
  mediaPlaceholder?: string;
}

export interface RoleApplicationConfig {
  role: ApplicationRole;
  title: string;
  subtitle: string;
  badge: string;
  symbol: string;
  color: string;
  gradient: string;
  minAccountAgeDays: number;
  minLevel: number;
  description: string;
  questions: ApplicationQuestion[];
  challenge: UniqueChallenge;
  pledge: string;
}

export const APPLICATION_ROLES_CONFIG: Record<ApplicationRole, RoleApplicationConfig> = {
  MODERATOR: {
    role: 'MODERATOR',
    title: 'Centinela del Santuario',
    subtitle: 'Vigila la armonía en chats, feed y gremios con templanza e imparcialidad',
    badge: '✦ Centinela',
    symbol: '✦',
    color: '#a78bfa',
    gradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(139, 92, 246, 0.05))',
    minAccountAgeDays: 0,
    minLevel: 1,
    description: 'Los Centinelas resguardan la convivencia de la comunidad. Tienen herramientas para silenciar, advertir y proteger a creadores y usuarios ante ataques, spam o toxicidad.',
    questions: [
      {
        id: 'availability',
        label: 'Disponibilidad y Franja Horaria',
        description: 'Indica tu país/zona horaria y cuántas horas puedes dedicar semanalmente a la moderación activa.',
        placeholder: 'Ej: GMT-5 (Colombia/Perú/México), 14 horas semanales, tardes y noches...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'experience',
        label: 'Experiencia Previa en Moderación',
        description: '¿Has sido moderador en canales de Twitch/Kick/YouTube, servidores de Discord o foros?',
        placeholder: 'Cuéntanos qué comunidades has moderado y qué herramientas o bots manejas...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'philosophy',
        label: 'Gestión de Conflictos y Provocaciones',
        description: 'Si un usuario te insulta o te provoca directamente durante una discusión en el feed, ¿cuál es tu procedimiento mental y tus acciones?',
        placeholder: 'Describe tu templanza y pasos para desescalar el conflicto sin perder la compostura...',
        type: 'textarea',
        required: true,
      },
    ],
    challenge: {
      id: 'sentinel_filter',
      title: 'El Filtro del Centinela (Prueba de Reacción Táctica)',
      tagline: 'Evalúa 3 situaciones simuladas y define la acción proporcional requerida',
      type: 'scenario',
      instructions: 'Analiza los siguientes tres sucesos y determina la acción inmediata:',
      promptScenario: 'Suceso 1: Un usuario veterano publica un link sospechoso de acortador con el texto "miren las fotos privadas filtradas de X VTuber".\nSuceso 2: En los comentarios de un post, dos miembros se lanzan indirectas pasivo-agresivas con sarcasmo pesado, incomodando a los demás pero sin usar insultos explícitos.\nSuceso 3: Un usuario recién registrado postea el mismo anuncio de su servidor de Discord 4 veces en 2 minutos.',
      requiresActionChoice: true,
      options: [
        {
          value: 'BAN_S1_WARN_S2_MUTE_S3',
          label: 'S1: Baneo inmediato + reporte admin | S2: Advertencia pública de cese | S3: Borrado masivo y silencio temporal',
          description: 'Protocolo de respuesta proporcional estándar.',
        },
        {
          value: 'WARN_ALL',
          label: 'Advertir a todos públicamente primero antes de aplicar cualquier sanción técnica',
          description: 'Protocolo preventivo no punitivo.',
        },
        {
          value: 'BAN_ALL',
          label: 'Baneo estricto de los tres usuarios para cortar la toxicidad de raíz',
          description: 'Tolerancia cero absoluta.',
        },
      ],
      requiresTextJustification: true,
      justificationPlaceholder: 'Explica en detalle tu razonamiento para cada uno de los 3 casos y cómo comunicarías la decisión a la comunidad para evitar drama.',
    },
    pledge: 'Juro solemnemente como Centinela actuar siempre con rectitud, templanza e imparcialidad, sin anteponer amistades ni rencores, protegiendo a cada miembro del Santuario Estelar.',
  },

  ADMIN: {
    role: 'ADMIN',
    title: 'Alto Mando Estelar',
    subtitle: 'Liderazgo estratégico, gestión de crisis comunitarias y coordinación general',
    badge: '★ Alto Mando',
    symbol: '★',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.05))',
    minAccountAgeDays: 0,
    minLevel: 1,
    description: 'El Alto Mando coordina el rumbo del Gremio, supervisa al staff, media en conflictos de alto calibre entre talentos y asegura la estabilidad de todo el ecosistema.',
    questions: [
      {
        id: 'leadership',
        label: 'Trayectoria y Liderazgo de Equipos',
        description: '¿Qué experiencia tienes coordinando personas, organizando torneos/eventos o gestionando proyectos digitales?',
        placeholder: 'Describe roles de liderazgo previos, tamaño de las comunidades y logros obtenidos...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'vision',
        label: 'Visión y Proyectos para el Gremio',
        description: 'Menciona 2 propuestas concretas que pondrías en marcha para aumentar la retención y la actividad de usuarios y talentos.',
        placeholder: 'Ej: Nuevas dinámicas de clanes, eventos entre streamers, integración de economías...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'teamwork',
        label: 'Resolución de Desacuerdos Internos',
        description: 'Si tienes una discrepancia profunda con otro Administrador o con el Creador del proyecto respecto a una decisión, ¿cómo lo abordas?',
        placeholder: 'Describe tu madurez para argumentar con datos y buscar consenso...',
        type: 'textarea',
        required: true,
      },
    ],
    challenge: {
      id: 'crisis_simulation',
      title: 'Simulador de Crisis Estelar (Caso Práctico)',
      tagline: 'Resuelve un conflicto público masivo que pone en riesgo la reputación comunitaria',
      type: 'scenario',
      instructions: 'Lee con atención el siguiente escenario y redacta tu plan de contención paso a paso:',
      promptScenario: 'Escenario: Durante un stream conjunto, un talento oficial acusa a otro streamer verificado de robarle ideas y de hablar a sus espaldas. En menos de 30 minutos, las dos comunidades inundan el feed de la web con posts de odio cruzado, cancelaciones y quejas. Varios miembros VIP exigen reembolsos y la expulsión inmediata de uno de los involucrados.',
      requiresTextJustification: true,
      justificationPlaceholder: 'Desglosa tu plan de acción: 1) Medidas de los primeros 30 minutos, 2) Manejo en privado con ambos creadores, 3) Comunicado oficial para el feed público.',
    },
    pledge: 'Juro velar con honor, transparencia e integridad por el destino de Gremio Estelar, anteponiendo la prosperidad colectiva por sobre el beneficio individual.',
  },

  VTUBER: {
    role: 'VTUBER',
    title: 'Talento Virtual Oficial',
    subtitle: 'Da vida a un personaje virtual con lore, transmisiones en vivo y colaboraciones',
    badge: '✦ VTuber Oficial',
    symbol: '✦',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.05))',
    minAccountAgeDays: 0,
    minLevel: 1,
    description: 'Los VTubers oficiales forman la constelación de talentos del Gremio. Tienen insignia verificada, sincronización en vivo de directos, perfil con lore personalizado y prioridad en eventos.',
    questions: [
      {
        id: 'modelDetails',
        label: 'Especificaciones del Modelo o Avatar',
        description: '¿Qué tecnología usas? (Live2D, 3D VRM, PNGTuber, Hand-drawn) y quién es el ilustrador/rigger.',
        placeholder: 'Ej: Live2D diseñado por @artista y riggeado por @rigger...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'streamingSchedule',
        label: 'Canales de Emisión y Frecuencia',
        description: 'Pega los enlaces a tus canales (Twitch, YouTube, Kick, TikTok, X) y tus días habituales de stream.',
        placeholder: 'https://twitch.tv/mi_canal\nLunes, Miércoles y Sábados a las 19:00 UTC...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'contentStyle',
        label: 'Propuesta de Contenido y Colaboraciones',
        description: '¿Qué tipo de directos realizas y qué proyectos o colaboraciones te gustaría hacer en el Gremio?',
        placeholder: 'Gaming competitivo, charlas interactivas, música, eventos con otros VTubers...',
        type: 'textarea',
        required: true,
      },
    ],
    challenge: {
      id: 'vtuber_lore_voice',
      title: 'Ficha de Lore & Muestra de Identidad',
      tagline: 'Preséntate en personaje como habitante del universo de Gremio Estelar',
      type: 'audio_or_lore',
      instructions: 'Redacta un fragmento del lore de tu personaje conectándolo con el mundo de las estrellas y proporciona un enlace a un clip o audiodemo donde se escuche tu voz y carisma.',
      promptScenario: '¿Quién es tu personaje? ¿De qué rincón del cosmos proviene y qué misión o deseo lo trajo hasta las puertas del Santuario Estelar?',
      requiresMediaOrUrl: true,
      mediaLabel: 'Enlace a Clip Destacado o Muestra de Audio/Video',
      mediaPlaceholder: 'https://clips.twitch.tv/... o https://youtube.com/watch?... o enlace a Google Drive/Vocaroo',
      requiresTextJustification: true,
      justificationPlaceholder: 'Escribe aquí el lore y la personalidad de tu personaje...',
    },
    pledge: 'Juro encarnar a mi personaje con pasión y respeto, mantener directos entretenidos y apoyar la constelación de creadores virtuales de Gremio Estelar.',
  },

  STREAMER: {
    role: 'STREAMER',
    title: 'Streamer Oficial',
    subtitle: 'Transmisiones dinámicas, raids colaborativas e integración de la comunidad',
    badge: '✧ Streamer Oficial',
    symbol: '✧',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.05))',
    minAccountAgeDays: 0,
    minLevel: 1,
    description: 'Los Streamers oficiales impulsan la vida en vivo de la plataforma con transmisiones en directo, raids comunitarias y generación de contenido dinámico.',
    questions: [
      {
        id: 'channels',
        label: 'Canales de Transmisión y Métricas',
        description: 'Pega los enlaces a tus canales activos (Twitch, Kick, YouTube) y tu promedio de espectadores habitual.',
        placeholder: 'https://twitch.tv/... | Promedio de viewers: 20-40...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'equipmentSetup',
        label: 'Setup Técnico y Calidad Audiovisual',
        description: 'Detalla tu equipo para streaming (micrófono, cámara/capturadora, especificaciones de PC y velocidad de internet).',
        placeholder: 'Micrófono Shure MV7, cámara Sony a6000, GPU RTX 3070, 100 Mbps simétricos...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'synergy',
        label: 'Sinergia Comunitaria y Raids',
        description: '¿Con qué frecuencia apoyas a otros streamers con raids y cómo involucras a tu chat en la plataforma del Gremio?',
        placeholder: 'Suelo raidear al final de cada stream a creadores del gremio y organizar juegos comunitarios...',
        type: 'textarea',
        required: true,
      },
    ],
    challenge: {
      id: 'stream_showcase',
      title: 'El Escaparate de Transmisión (Tu Momento Cúspide)',
      tagline: 'Demuestra tu energía y química con tu audiencia',
      type: 'stream_showcase',
      instructions: 'Pega el enlace a un clip donde se aprecie tu mejor momento de streaming: una jugada épica, una charla divertida o una interacción inolvidable con tu chat.',
      requiresMediaOrUrl: true,
      mediaLabel: 'Enlace al Clip de Streaming',
      mediaPlaceholder: 'https://clips.twitch.tv/... o https://kick.com/.../clips/... o enlace directo a video',
      requiresTextJustification: true,
      justificationPlaceholder: 'Explica en 2-3 párrafos por qué este clip refleja tu esencia como streamer y qué valor añadido aportas a la comunidad.',
    },
    pledge: 'Juro brindar transmisiones entretenidas y sinceras, apoyar a mis compañeros con raids y colaboraciones y ser un digno embajador del Gremio en directo.',
  },

  ARTIST: {
    role: 'ARTIST',
    title: 'Artista & Diseñador Cósmico',
    subtitle: 'Ilustraciones, emotes, banners, identidades visuales y elementos para la tienda',
    badge: '✦ Artista Estelar',
    symbol: '✦',
    color: '#c084fc',
    gradient: 'linear-gradient(135deg, rgba(192, 132, 252, 0.2), rgba(147, 51, 234, 0.05))',
    minAccountAgeDays: 0,
    minLevel: 1,
    description: 'Los Artistas crean la magia visual del Gremio. Tienen insignia artística, vitrina para sus comisiones y la oportunidad de diseñar marcos, stickers y banners oficiales.',
    questions: [
      {
        id: 'specialties',
        label: 'Especialidades Artísticas',
        description: '¿En qué ramas te destacas? (Ilustración 2D anime/manga, Emotes/Stickers, Pixel Art, Modelado 3D, Rigging Live2D, Overlays UI)',
        placeholder: 'Especializado en emotes chibi y banners temáticos de fantasía espacial...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'tools',
        label: 'Herramientas y Software',
        description: 'Programas de dibujo y diseño que utilizas en tu flujo de trabajo.',
        placeholder: 'Clip Studio Paint EX, Photoshop, Blender, Live2D Cubism...',
        type: 'text',
        required: true,
      },
      {
        id: 'commissionsInfo',
        label: 'Portafolio y Comisiones',
        description: 'Enlaces a tu portafolio digital (ArtStation, VGen, Carrd, Behance, X/Twitter).',
        placeholder: 'https://vgen.co/... o https://artstation.com/...',
        type: 'textarea',
        required: true,
      },
    ],
    challenge: {
      id: 'gallery_showcase',
      title: 'La Galería Galáctica (Portfolio Destacado)',
      tagline: 'Comparte tus 3 creaciones maestras y el proceso creativo',
      type: 'portfolio',
      instructions: 'Pega los enlaces a 3 obras tuyas terminadas y cuéntanos sobre la pieza más compleja que hayas realizado hasta la fecha.',
      requiresMediaOrUrl: true,
      mediaLabel: 'Enlaces a 3 Muestras de Arte',
      mediaPlaceholder: '1. https://... (Emote)\n2. https://... (Banner)\n3. https://... (Ilustración completa)',
      requiresTextJustification: true,
      justificationPlaceholder: 'Describe la historia detrás de tu pieza favorita, el tiempo que te tomó y las técnicas empleadas.',
    },
    pledge: 'Juro crear con honestidad, respetar la propiedad intelectual ajena y brindar mi talento para embellecer el universo del Gremio Estelar.',
  },

  CLIPPER: {
    role: 'CLIPPER',
    title: 'Clipper & Editor Audiovisual',
    subtitle: 'Edición de clips con alto dinamismo, subtítulos con estilo y formato vertical',
    badge: '✧ Clipper & Editor',
    symbol: '✧',
    color: '#22d3ee',
    gradient: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(6, 182, 212, 0.05))',
    minAccountAgeDays: 0,
    minLevel: 1,
    description: 'Los Clippers son los maestros del ritmo. Transforman horas de directos en clips magnéticos para TikTok, YouTube Shorts y Reels, viralizando a los talentos del Gremio.',
    questions: [
      {
        id: 'software',
        label: 'Software de Edición y Efectos',
        description: '¿Qué software utilizas para corte, efectos, subtitulado y mezcla de sonido?',
        placeholder: 'DaVinci Resolve Studio, Premiere Pro, After Effects...',
        type: 'text',
        required: true,
      },
      {
        id: 'portfolioClips',
        label: 'Cuentas y Redes de Clips',
        description: 'Enlaces a tus canales o perfiles de clips en TikTok, YouTube Shorts, Reels o X.',
        placeholder: 'https://tiktok.com/@... o https://youtube.com/@...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'turnaroundTime',
        label: 'Tiempo de Entrega y Ritmo de Publicación',
        description: '¿Cuánto tiempo te toma producir un clip corto editado desde que finaliza el stream?',
        placeholder: 'Entre 2 y 4 horas por clip terminado con subtítulos animados y zooms dinámicos...',
        type: 'text',
        required: true,
      },
    ],
    challenge: {
      id: 'viral_breakdown',
      title: 'El Desglose de Retención y Viralidad',
      tagline: 'Demuestra tu olfato para crear ganchos irresistibles',
      type: 'clip_breakdown',
      instructions: 'Pega el enlace a tu mejor clip editado y desglosa su estructura de retención:',
      promptScenario: 'Explica: 1) Cuál es el gancho de los primeros 3 segundos. 2) Qué cortes de respiración o efectos usaste para evitar que el espectador hiciera scroll. 3) Qué título y hashtags elegiste para posicionarlo.',
      requiresMediaOrUrl: true,
      mediaLabel: 'Enlace al Clip Editado',
      mediaPlaceholder: 'https://tiktok.com/@.../video/... o https://youtube.com/shorts/...',
      requiresTextJustification: true,
      justificationPlaceholder: 'Desglosa aquí tu análisis de retención, edición y selección de títulos...',
    },
    pledge: 'Juro capturar la esencia de los creadores con respeto y creatividad, ayudando a expandir la luz de los talentos en todas las plataformas.',
  },

  HELPER: {
    role: 'HELPER',
    title: 'Guía Estelar',
    subtitle: 'Atención cálida a nuevos usuarios, resolución de dudas y bienvenida comunitaria',
    badge: '✦ Guía Estelar',
    symbol: '✦',
    color: '#34d399',
    gradient: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.05))',
    minAccountAgeDays: 0,
    minLevel: 1,
    description: 'Los Guías Estelares son la primera sonrisa que reciben los nuevos miembros. Ayudan a entender las misiones, el Stardust, los gremios y orientan a quien lo necesite.',
    questions: [
      {
        id: 'platformKnowledge',
        label: 'Conocimiento de los Sistemas del Gremio',
        description: '¿Qué tan familiarizado estás con Stardust, Pase Estelar, Ruleta diaria, Gremios, Tienda y Perfiles?',
        placeholder: 'Describe tu nivel de conocimiento y uso cotidiano de las herramientas de la web...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'patienceStory',
        label: 'Paciencia y Empatía',
        description: 'Cuéntanos una ocasión donde tuviste que guiar con calma a una persona que no entendía la tecnología o estaba frustrada.',
        placeholder: 'Describe la situación y cómo lograste que se sintiera cómoda y agradecida...',
        type: 'textarea',
        required: true,
      },
      {
        id: 'activeHours',
        label: 'Horarios de Conexión en el Chat',
        description: '¿En qué momentos del día sueles estar conectado leyendo o interactuando en el chat público o Discord?',
        placeholder: 'Tardes de 16:00 a 22:00, fines de semana completos...',
        type: 'text',
        required: true,
      },
    ],
    challenge: {
      id: 'support_simulation',
      title: 'Módulo de Simulación de Bienvenida y Ayuda',
      tagline: 'Demuestra tu don de gentes ante un usuario recién llegado y confundido',
      type: 'support_simulation',
      instructions: 'Lee la pregunta del usuario y redacta la respuesta exacta que le darías en el chat:',
      promptScenario: 'Usuario recién registrado @StarNovice escribe en el chat público: "Hola a todos... acabo de registrarme pero la verdad no entiendo nada de esta página :( ¿Para qué sirven esos puntos de Stardust que dan arriba, cómo me uno a un gremio de streamers y dónde veo los directos? ¿Alguien me explica por favor?"',
      requiresTextJustification: true,
      justificationPlaceholder: 'Escribe aquí tu respuesta tal como se la enviarías al usuario novato, con un tono cálido, amigable, claro y pedagógico...',
    },
    pledge: 'Juro brindar una mano amiga a cada navegante del cosmos que pise el Gremio, guiándolo con paciencia, bondad y entusiasmo.',
  },
};

export function getApplicationConfig(role: string): RoleApplicationConfig | undefined {
  const normalized = (role || '').toUpperCase() as ApplicationRole;
  return APPLICATION_ROLES_CONFIG[normalized];
}

export function getAllApplicationConfigs(): RoleApplicationConfig[] {
  return Object.values(APPLICATION_ROLES_CONFIG);
}
