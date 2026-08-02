import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';

export interface CreateNewsInput {
  title: string;
  summary: string;
  content: string;
  coverImage?: string;
  category?: string;
  isPinned?: boolean;
  isPublished?: boolean;
}

export interface UpdateNewsInput {
  title?: string;
  summary?: string;
  content?: string;
  coverImage?: string;
  category?: string;
  isPinned?: boolean;
  isPublished?: boolean;
}

// Generate URL slug from title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 100);
}

export const getAllNews = async (options: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  isPublishedOnly?: boolean;
}) => {
  const page = options.page || 1;
  const limit = options.limit || 12;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options.isPublishedOnly) {
    where.isPublished = true;
  }

  if (options.category && options.category !== 'ALL') {
    where.category = options.category;
  }

  if (options.search && options.search.trim()) {
    const q = options.search.trim();
    where.OR = [
      { title: { contains: q } },
      { summary: { contains: q } },
      { content: { contains: q } },
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    }),
    prisma.newsArticle.count({ where }),
  ]);

  return {
    articles,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getPinnedArticle = async () => {
  const article = await prisma.newsArticle.findFirst({
    where: { isPinned: true, isPublished: true },
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });

  if (!article) {
    // Return most recent published article if none pinned
    return prisma.newsArticle.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });
  }

  return article;
};

export const getNewsBySlug = async (slugOrId: string) => {
  const article = await prisma.newsArticle.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });

  if (!article) {
    throw new AppError('Artículo de noticias no encontrado', 404);
  }

  // Increment view count asynchronously
  await prisma.newsArticle.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  }).catch(() => {});

  return article;
};

export const createNews = async (authorId: string, data: CreateNewsInput) => {
  let baseSlug = slugify(data.title);
  if (!baseSlug) baseSlug = `articulo-${Date.now()}`;

  let slug = baseSlug;
  let counter = 1;
  while (await prisma.newsArticle.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  // If pinning this article, unpin other articles if needed
  if (data.isPinned) {
    await prisma.newsArticle.updateMany({
      where: { isPinned: true },
      data: { isPinned: false },
    });
  }

  return prisma.newsArticle.create({
    data: {
      title: data.title,
      slug,
      summary: data.summary,
      content: data.content,
      coverImage: data.coverImage || null,
      category: data.category || 'PLATFORM',
      isPinned: data.isPinned || false,
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
      authorId,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });
};

export const updateNews = async (id: string, data: UpdateNewsInput) => {
  const article = await prisma.newsArticle.findUnique({ where: { id } });
  if (!article) {
    throw new AppError('Artículo no encontrado', 404);
  }

  let slug = article.slug;
  if (data.title && data.title !== article.title) {
    let baseSlug = slugify(data.title);
    slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.newsArticle.findUnique({ where: { slug } });
      if (!existing || existing.id === id) break;
      slug = `${baseSlug}-${counter++}`;
    }
  }

  if (data.isPinned) {
    await prisma.newsArticle.updateMany({
      where: { isPinned: true, NOT: { id } },
      data: { isPinned: false },
    });
  }

  return prisma.newsArticle.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title, slug }),
      ...(data.summary !== undefined && { summary: data.summary }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });
};

export const deleteNews = async (id: string) => {
  const article = await prisma.newsArticle.findUnique({ where: { id } });
  if (!article) {
    throw new AppError('Artículo no encontrado', 404);
  }

  return prisma.newsArticle.delete({ where: { id } });
};

export const seedDefaultNewsIfEmpty = async (authorId: string) => {
  // Clear any previous sample/placeholder articles
  await prisma.newsArticle.deleteMany({
    where: {
      OR: [
        { coverImage: { contains: 'unsplash' } },
        { title: { contains: 'Llegó la actualización' } },
      ],
    },
  }).catch(() => {});

  const count = await prisma.newsArticle.count();
  if (count > 0) return;

  const realArticles = [
    {
      title: '🎰 ¡Gran Lanzamiento de la Ruleta Estelar a 60FPS y Polvo Estelar!',
      summary: 'La Ruleta de la Suerte ha sido reconstruida con motor físico a 60FPS, sonidos dinámicos de clavija, sistema de rachas (+50% XP) y giros extra con Polvo Estelar.',
      content: `### 🎰 ¡Remodelación Completa de la Ruleta Estelar!

Nos complace presentar la nueva **Ruleta de la Suerte** ([ir a la Ruleta](/roulette)) totalmente optimizada con tecnología de animación fluida a 60FPS y nuevas mecánicas de recompensa.

#### ✨ Principales Novedades:
- **Motor Físico a 60FPS**: Animaciones de rotación en tiempo real sin latencia ni congelamientos al presionar "Girar".
- **Audio Físico Sincronizado**: Los ticks de sonido y el movimiento del puntero (*pointer flick*) se aceleran y desaceleran en sincronía perfecta con la rotación de la rueda.
- **Giros Extra con Polvo Estelar**: ¿Usaste tu giro diario? ¡Consigue giros adicionales usando 🪙 **50 Polvo Estelar**!
- **Bono de Racha Diaria**: Mantén tu racha activa día a día para desbloquear hasta un **+50% de XP adicional** en tus victorias.
- **Acreditación Instantánea**: Tus ganancias de XP y Polvo Estelar se reflejan de inmediato en tu perfil y barra superior.`,
      coverImage: 'https://images-ext-1.discordapp.net/external/ZN39TPiFOV_5zjm7w9BRv8NCZJsuPvoKhBdwnSwYtJ4/https/i.pinimg.com/736x/1c/17/bd/1c17bdc0c15c22705213c052a3af6653.jpg?format=webp&width=536&height=641',
      category: 'PLATFORM',
      isPinned: true,
      isPublished: true,
    },
    {
      title: '⚡ Notas del Parche v2.0: Hub de Noticias y Mejoras Globales de Formularios',
      summary: 'Lanzamiento del nuevo Hub de Noticias y Novedades unificado, optimización de contraste en formularios globales en modo oscuro y corrección de selección en inputs.',
      content: `### 🛠️ Notas del Parche v2.0 — GremioWeb

Hemos desplegado una actualización completa enfocada en la experiencia de usuario, diseño visual y facilidades de administración.

#### 🚀 Cambios Incluidos:
- **Hub Unificado de Noticias y Novedades**: Centralizamos todas las actualizaciones en una sola sección accesible desde [/news](/news) y [/novedades](/novedades).
- **Lector de Cristal Modal**: Abre y lee cualquier anuncio completo sin salir de la página con contador de vistas y tiempo de lectura.
- **Optimización Global de Formularios**: Corregimos el contraste en campos de selección desplegables, añadimos soporte de modo oscuro nativo (\`color-scheme: dark\`) para calendarios e indicadores de validación claros.
- **Directorio VTuber Restaurado**: Visibilidad garantizada para los perfiles VTuber activos de la comunidad en el directorio.`,
      coverImage: 'https://i.pinimg.com/originals/ce/70/ff/ce70fff209ec669dea8e0eeb119f4534.gif',
      category: 'PATCH_NOTES',
      isPinned: false,
      isPublished: true,
    },
    {
      title: '🌸 Directorio Oficial de VTubers y Comunidad Gremio Estelar',
      summary: 'Conoce los perfiles oficiales de nuestros creadores de contenido, streaming en vivo, redes sociales y mascotas interactivas.',
      content: `### 🎙️ ¡Conoce a las VTubers de Gremio Estelar!

Te invitamos a explorar el **Directorio Oficial de VTubers** ([visitar VTubers](/vtubers)):

#### 🌟 Novedades para la Comunidad:
- **Perfiles VTuber Verificados**: Explora a streamers de la comunidad como *AleshaWeasleyVT*, *Guren VT*, *Yusuki*, *hoshi*, *CHOCO* y más.
- **Indicadores En Vivo**: Entérate al instante cuando una VTuber esté transmitiendo en vivo en Twitch o YouTube.
- **Redes & Horarios de Stream**: Consulta enlaces oficiales a Twitch, YouTube, X/Twitter, Kick y horarios semanales.
- **Mascotas y Personalización**: Configura tu avatar con mascotas animadas, títulos exclusivos y música en tu perfil.`,
      coverImage: 'https://i.pinimg.com/originals/06/e0/0a/06e00aebdd4a2a57c135e1ddd6d7e052.gif',
      category: 'VTUBER',
      isPinned: false,
      isPublished: true,
    },
  ];

  for (const item of realArticles) {
    await createNews(authorId, item).catch(() => {});
  }
};
