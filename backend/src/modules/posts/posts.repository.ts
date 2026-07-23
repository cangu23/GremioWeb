import { prisma } from '../../database';

const postIncludes = {
  user: {
    select: {
      id: true,
      username: true,
      role: true,
      avatarUrl: true,
      vtuberProfile: {
        select: {
          displayName: true,
          avatarUrl: true,
          isVerified: true,
          isApproved: true,
        },
      },
    },
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
  return prisma.post.findMany({
    where: {
      hashtags: {
        some: { hashtag: { name: hashtagName } },
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
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          avatarUrl: true,
          vtuberProfile: {
            select: {
              displayName: true,
              avatarUrl: true,
              isVerified: true,
              isApproved: true,
            },
          },
        },
      },
      _count: { select: { likes: true } },
    },
  });
};

export const findCommentsByPost = (postId: string) => {
  return prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          avatarUrl: true,
          vtuberProfile: {
            select: {
              displayName: true,
              avatarUrl: true,
              isVerified: true,
              isApproved: true,
            },
          },
        },
      },
      _count: { select: { likes: true } },
    },
  });
};

export const findCommentById = (id: string) => {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          avatarUrl: true,
          vtuberProfile: {
            select: {
              displayName: true,
              avatarUrl: true,
              isVerified: true,
              isApproved: true,
            },
          },
        },
      },
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

export const findTrendingHashtags = (limit = 10) => {
  return prisma.hashtag.findMany({
    take: limit,
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

export const sendDirectMessage = (data: {
  content: string;
  senderId: string;
  receiverId: string;
}) => {
  return prisma.directMessage.create({
    data,
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
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
      sender: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
  });
};

export const findUserConversations = async (userId: string) => {
  // Get all DMs and deduplicate in-memory (SQLite doesn't support multi-field distinct)
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
  });
  
  // Deduplicate: keep only the most recent message per conversation pair
  const seen = new Set<string>();
  return messages.filter(msg => {
    const pairId = [msg.senderId, msg.receiverId].sort().join(':');
    if (seen.has(pairId)) return false;
    seen.add(pairId);
    return true;
  });
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
