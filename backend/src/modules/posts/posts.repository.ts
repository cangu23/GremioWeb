import { prisma } from '../../database';

const userSelect = {
  id: true,
  username: true,
  role: true,
  avatarUrl: true,
  plan: true,
  profileFrame: true,
  verifiedUntil: true,
  vtuberProfile: {
    select: {
      displayName: true,
      avatarUrl: true,
      isVerified: true,
      isApproved: true,
    },
  },
  streamerProfile: {
    select: {
      displayName: true,
      avatarUrl: true,
      isVerified: true,
      isApproved: true,
    },
  },
  purchases: {
    where: { equipped: true },
    include: { item: true },
  },
};

const postIncludes = {
  user: {
    select: userSelect,
  },
  _count: { select: { comments: true, likes: true } },
  hashtags: {
    include: { hashtag: { select: { id: true, name: true } } },
  },
  mentions: {
    include: { user: { select: { id: true, username: true } } },
  },
};

// ========== POSTS ==========

export const createPost = (data: {
  content: string;
  mediaUrl?: string;
  isPinned?: boolean;
  pollData?: string;
  userId: string;
}) => {
  return prisma.post.create({
    data,
    include: postIncludes,
  });
};

export const findPostById = (id: string) => {
  return prisma.post.findUnique({
    where: { id },
    include: postIncludes,
  });
};

export const findAllPosts = (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return prisma.post.findMany({
    where: { isHidden: false },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    skip,
    take: limit,
    include: postIncludes,
  });
};

export const findRecentPostsForAlgorithmicFeed = (takeCount = 60, skipCount = 0) => {
  return prisma.post.findMany({
    where: { isHidden: false },
    orderBy: { createdAt: 'desc' },
    skip: skipCount,
    take: takeCount,
    include: postIncludes,
  });
};

export const findRecentPostsForTrendingFeed = (sinceDate: Date, takeCount = 100) => {
  return prisma.post.findMany({
    where: {
      isHidden: false,
      createdAt: { gte: sinceDate },
    },
    orderBy: { createdAt: 'desc' },
    take: takeCount,
    include: postIncludes,
  });
};

export const findMediaPosts = (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return prisma.post.findMany({
    where: {
      isHidden: false,
      mediaUrl: { not: null },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    skip,
    take: limit,
    include: postIncludes,
  });
};

export const findPostsByUser = (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return prisma.post.findMany({
    where: { userId },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    skip,
    take: limit,
    include: postIncludes,
  });
};

export const findPostsByHashtag = (hashtagName: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const cleanName = (hashtagName || '').toLowerCase().replace(/^#/, '').trim();
  return prisma.post.findMany({
    where: {
      hashtags: {
        some: { hashtag: { name: cleanName } },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    include: postIncludes,
  });
};

export const findPostsByUsers = (userIds: string[], page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return prisma.post.findMany({
    where: { userId: { in: userIds } },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    include: postIncludes,
  });
};

export const updatePost = (id: string, data: Record<string, unknown>) => {
  return prisma.post.update({
    where: { id },
    data,
    include: postIncludes,
  });
};

export const deletePost = (id: string) => {
  return prisma.post.delete({ where: { id } });
};

// Like post
export const likePost = (userId: string, postId: string) => {
  return prisma.like.create({
    data: { userId, postId },
  });
};

export const unlikePost = (userId: string, postId: string) => {
  return prisma.like.delete({
    where: { userId_postId: { userId, postId } },
  });
};

export const findPostLike = (userId: string, postId: string) => {
  return prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });
};

// ========== COMMENTS ==========

export const createComment = (data: {
  content: string;
  mediaUrl?: string;
  postId: string;
  userId: string;
}) => {
  return prisma.comment.create({
    data,
    include: {
      user: { select: userSelect },
      _count: { select: { likes: true } },
    },
  });
};

export const findCommentsByPost = (postId: string) => {
  return prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: userSelect },
      _count: { select: { likes: true } },
    },
  });
};

export const findCommentById = (id: string) => {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      user: { select: userSelect },
      _count: { select: { likes: true } },
    },
  });
};

export const deleteComment = (id: string) => {
  return prisma.comment.delete({ where: { id } });
};

// Like comment
export const likeComment = (userId: string, commentId: string) => {
  return prisma.like.create({
    data: { userId, commentId },
  });
};

export const unlikeComment = (userId: string, commentId: string) => {
  return prisma.like.delete({
    where: { userId_commentId: { userId, commentId } },
  });
};

export const findCommentLike = (userId: string, commentId: string) => {
  return prisma.like.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });
};

// ========== HASHTAGS ==========

export const findOrCreateHashtag = async (name: string) => {
  const lower = name.toLowerCase();
  let hashtag = await prisma.hashtag.findUnique({ where: { name: lower } });
  if (!hashtag) {
    hashtag = await prisma.hashtag.create({ data: { name: lower } });
  }
  return hashtag;
};

export const linkPostToHashtag = (postId: string, hashtagId: string) => {
  return prisma.postHashtag.create({
    data: { postId, hashtagId },
  });
};

export const findTrendingHashtags = async (limit = 10) => {
  const safeLimit = Math.max(1, Math.min(limit, 30));
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 1. Group recent post-hashtag associations from the last 7 days
  const recentTagGroups = prisma.postHashtag?.groupBy
    ? await prisma.postHashtag.groupBy({
        by: ['hashtagId'],
        where: {
          post: {
            createdAt: { gte: sevenDaysAgo },
          },
        },
        _count: {
          postId: true,
        },
        orderBy: {
          _count: {
            postId: 'desc',
          },
        },
        take: safeLimit,
      }).catch(() => [])
    : [];

  if (recentTagGroups.length > 0) {
    const hashtagIds = recentTagGroups.map(g => g.hashtagId);
    const hashtags = await prisma.hashtag.findMany({
      where: { id: { in: hashtagIds } },
      select: { id: true, name: true },
    });

    const hashtagMap = new Map(hashtags.map(h => [h.id, h.name]));
    const results = recentTagGroups
      .map(g => ({
        id: g.hashtagId,
        name: hashtagMap.get(g.hashtagId) || '',
        _count: { posts: g._count.postId },
      }))
      .filter(r => r.name);

    if (results.length >= safeLimit) {
      return results;
    }

    // Fill remaining slots with historical all-time hashtags not in recent
    const existingIds = new Set(results.map(r => r.id));
    const fallbackLimit = safeLimit - results.length;
    const fallbackHashtags = await prisma.hashtag.findMany({
      where: { id: { notIn: Array.from(existingIds) } },
      take: fallbackLimit,
      orderBy: { posts: { _count: 'desc' } },
      include: { _count: { select: { posts: true } } },
    });

    return [...results, ...fallbackHashtags];
  }

  // Fallback: If no activity in last 7 days, return all-time hashtags
  return prisma.hashtag.findMany({
    take: safeLimit,
    orderBy: { posts: { _count: 'desc' } },
    include: { _count: { select: { posts: true } } },
  });
};

// ========== MENTIONS ==========

export const createMention = (postId: string, userId: string) => {
  return prisma.postMention.create({
    data: { postId, userId },
  });
};

// ========== DIRECT MESSAGES ==========

const chatUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  displayedRole: true,
  vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true, isApproved: true } },
  streamerProfile: { select: { displayName: true, avatarUrl: true, isVerified: true, isApproved: true } },
};

export const sendDirectMessage = (data: {
  content: string;
  senderId: string;
  receiverId: string;
}) => {
  return prisma.directMessage.create({
    data,
    include: {
      sender: { select: chatUserSelect },
      receiver: { select: chatUserSelect },
    },
  });
};

export const findConversation = (user1Id: string, user2Id: string, limit = 50) => {
  return prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    include: {
      sender: { select: chatUserSelect },
    },
  });
};

export const findUserConversations = async (userId: string) => {
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: chatUserSelect },
      receiver: { select: chatUserSelect },
    },
  });
  
  const unreadCounts: Record<string, number> = {};
  for (const msg of messages) {
    if (msg.receiverId === userId && !msg.read) {
      unreadCounts[msg.senderId] = (unreadCounts[msg.senderId] || 0) + 1;
    }
  }

  const seen = new Set<string>();
  const conversations: any[] = [];

  for (const msg of messages) {
    const pairId = [msg.senderId, msg.receiverId].sort().join(':');
    if (!seen.has(pairId)) {
      seen.add(pairId);
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      conversations.push({
        ...msg,
        unreadCount: unreadCounts[otherId] || 0,
      });
    }
  }

  return conversations;
};

export const markDmAsRead = (dmId: string) => {
  return prisma.directMessage.update({
    where: { id: dmId },
    data: { read: true },
  });
};

export const countUnreadDms = (userId: string) => {
  return prisma.directMessage.count({
    where: { receiverId: userId, read: false },
  });
};

export const markConversationAsRead = (receiverId: string, senderId: string) => {
  return prisma.directMessage.updateMany({
    where: {
      receiverId,
      senderId,
      read: false,
    },
    data: { read: true },
  });
};

export const findAllUnreadDmMessageIds = (receiverId: string) => {
  return prisma.directMessage.findMany({
    where: { receiverId, read: false },
    select: { id: true, senderId: true },
  });
};

export const findUnreadConversationMessageIds = (receiverId: string, senderId: string) => {
  return prisma.directMessage.findMany({
    where: { receiverId, senderId, read: false },
    select: { id: true },
  });
};

export const markAllDmsAsRead = (receiverId: string) => {
  return prisma.directMessage.updateMany({
    where: {
      receiverId,
      read: false,
    },
    data: { read: true },
  });
};
