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
  const count = await prisma.newsArticle.count();
  if (count > 0) return;

  const sampleArticles = [
    {
      title: '¡Nueva Ruleta de la Suerte con Polvo Estelar y Animación 60FPS!',
      summary: 'Llegó la actualización del sistema de Ruleta Diaria. Ahora incluye físicas de giro fluido, efectos de sonido dinámicos y giros extra con Polvo Estelar.',
      content: `### 🎰 ¡Gran Actualización en la Ruleta del Gremio!

Nos complace anunciar la remodelación completa del sistema de **Ruleta de la Suerte**.

#### ✨ ¿Qué hay de nuevo?
- **Físicas de Giro Continuo**: Animación de giro a 60FPS sin congelamiento ni tiempos de espera.
- **Sonidos de Clavija Dinámicos**: Los ticks de audio y el movimiento del puntero se aceleran y desaceleran en sincronía total con la rueda.
- **Giros Extra con Polvo Estelar**: ¿Ya usaste tu giro diario? ¡Ahora puedes usar 🪙 **50 Polvo Estelar** para obtener un giro extra!
- **Rachas de Giro**: Mantén tu racha diaria activa para obtener un bono acumulativo de hasta **+50% de XP**.

¡Pruébala ahora en la sección [Ruleta](/roulette)!`,
      coverImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
      category: 'PLATFORM',
      isPinned: true,
      isPublished: true,
    },
    {
      title: 'Debuts VTuber de la Semana y Nuevas Salas de Chat',
      summary: 'Conoce a las nuevas talentos que se unen al Gremio esta semana y descubre las salas temáticas exclusivas.',
      content: `### 🎙️ ¡Nuevas Estrellas en el Firmamento VTuber!

Esta semana damos la bienvenida a increíbles creadoras de contenido que se integran a la comunidad del **Gremio Estelar**.

#### 🌟 Destacadas de la semana:
1. **Hoshizora Maid & Observatorio**: Descubre los minijuegos y la tienda astronómica.
2. **Nuevos Emotes & Stickers**: Ya disponibles en los chats de gremio.
3. **Eventos comunitarios**: Participa en las salas en vivo todos los fines de semana.

Visita la sección de [VTubers](/vtubers) para enviarles tu apoyo.`,
      coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      category: 'VTUBER',
      isPinned: false,
      isPublished: true,
    },
    {
      title: 'Notas del Parche v1.8: Optimización Global y Sistema de Noticias',
      summary: 'Resumen completo de las mejoras del sistema, velocidad de carga y nuevo Hub de Novedades.',
      content: `### 🛠️ Notas del Parche 1.8

Hemos desplegado una serie de mejoras técnicas para garantizar la máxima fluidez en toda la plataforma.

#### 🚀 Novedades:
- **Hub de Noticias y Novedades**: Centralización de comunicados, parches y noticias en un solo lugar.
- **Rendimiento UI**: Optimización de componentes Next.js con carga previa de imágenes y soporte SWC.
- **Panel de Administración**: Mejoras en el panel de gestión para moderadores y administradores.

¡Gracias por formar parte de la comunidad!`,
      coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      category: 'PATCH_NOTES',
      isPinned: false,
      isPublished: true,
    },
  ];

  for (const item of sampleArticles) {
    await createNews(authorId, item).catch(() => {});
  }
};
