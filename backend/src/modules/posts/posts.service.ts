import AppError from '../../errors/AppError';
import * as PostsRepository from './posts.repository';
import * as NotificationsService from '../notifications/notifications.service';
import { CreatePostPayload, CreateCommentPayload } from '@gremio-estelar/shared';
import * as UserRepository from '../users/user.repository';
import * as SocialRepository from '../social/social.repository';
import * as AdminRepository from '../admin/admin.repository';
import prisma from '../../database/prisma';

// ========== POSTS ==========

export const createPost = async (payload: CreatePostPayload, userId: string, mentionedUserIds?: string[]) => {
  const post = await PostsRepository.createPost({
    content: payload.content,
    mediaUrl: payload.mediaUrl,
    isPinned: payload.isPinned,
    pollData: payload.pollData,
    userId,
  });

  // Process hashtags
  const hashtagRegex = /#(\w+)/g;
  const hashtags = payload.content.match(hashtagRegex);
  if (hashtags) {
    for (const tag of hashtags) {
      const name = tag.slice(1); // Remove #
      const hashtag = await PostsRepository.findOrCreateHashtag(name);
      await PostsRepository.linkPostToHashtag(post.id, hashtag.id);
    }
  }

  // Process mentions & notify
  const poster = await UserRepository.findById(userId);
  if (mentionedUserIds && poster) {
    for (const mentionedId of mentionedUserIds) {
      await PostsRepository.createMention(post.id, mentionedId);
      // Only notify if mentioning someone else
      if (mentionedId !== userId) {
        await NotificationsService.notifyMention(poster.username, post.id, mentionedId).catch(() => {});
      }
    }
  }

  // Fetch the complete post with relations
  const fullPost = await PostsRepository.findPostById(post.id);
  if (!fullPost) throw new AppError('Error al crear publicación', 500);

  return formatPost(fullPost);
};

export const getFeed = async (currentUserId?: string, page = 1, limit = 20) => {
  const posts = await PostsRepository.findAllPosts(page, limit);
  return Promise.all(posts.map(async (p) => {
    const formatted = formatPost(p);
    if (currentUserId) {
      const like = await PostsRepository.findPostLike(currentUserId, p.id);
      formatted.isLikedByMe = !!like;
    }
    return formatted;
  }));
};

export const getPersonalizedFeed = async (userId: string, page = 1, limit = 20) => {
  // Get users this user follows
  const following = await SocialRepository.getFollowing(userId);
  const followingIds = following.map((f) => f.followingId);
  
  // Include own posts
  followingIds.push(userId);
  
  const posts = await PostsRepository.findPostsByUsers(followingIds, page, limit);
  return Promise.all(posts.map(async (p) => {
    const formatted = formatPost(p);
    const like = await PostsRepository.findPostLike(userId, p.id);
    formatted.isLikedByMe = !!like;
    return formatted;
  }));
};

export const updatePost = async (postId: string, payload: { content?: string; mediaUrl?: string }, userId: string) => {
  const post = await PostsRepository.findPostById(postId);
  if (!post) throw new AppError('Publicación no encontrada', 404);
  if (post.userId !== userId) throw new AppError('No tienes permiso para editar esta publicación', 403);

  const updateData: { content?: string; mediaUrl?: string } = {};
  if (payload.content !== undefined) updateData.content = payload.content;
  if (payload.mediaUrl !== undefined) updateData.mediaUrl = payload.mediaUrl;

  const updated = await PostsRepository.updatePost(postId, updateData);
  return formatPost(updated);
};

export const getUserPosts = async (targetUserId: string, currentUserId?: string, page = 1, limit = 20) => {
  const posts = await PostsRepository.findPostsByUser(targetUserId, page, limit);
  return Promise.all(posts.map(async (p) => {
    const formatted = formatPost(p);
    if (currentUserId) {
      const like = await PostsRepository.findPostLike(currentUserId, p.id);
      formatted.isLikedByMe = !!like;
    }
    return formatted;
  }));
};

export const getPostById = async (id: string, currentUserId?: string) => {
  const post = await PostsRepository.findPostById(id);
  if (!post) throw new AppError('Publicación no encontrada', 404);

  const formatted = formatPost(post);
  if (currentUserId) {
    const like = await PostsRepository.findPostLike(currentUserId, id);
    formatted.isLikedByMe = !!like;
  }
  return formatted;
};

export const deletePost = async (postId: string, userId: string, moderationNote?: string) => {
  const post = await PostsRepository.findPostById(postId);
  if (!post) throw new AppError('Publicación no encontrada', 404);

  // Allow owner, admin, or moderator to delete
  const isStaffAction = post.userId !== userId;
  let staffUser = null;
  if (isStaffAction) {
    staffUser = await UserRepository.findById(userId);
    if (!staffUser || (staffUser.role !== 'ADMIN' && staffUser.role !== 'MODERATOR')) {
      throw new AppError('No tienes permiso para eliminar esta publicación', 403);
    }
  }

  await PostsRepository.deletePost(postId);

  // Log audit trail and notify author for staff moderation actions
  if (isStaffAction && staffUser) {
    AdminRepository.createAdminLog({
      userId,
      action: 'DELETE_POST',
      detail: JSON.stringify({
        postId,
        contentPreview: post.content.substring(0, 100),
        authorId: post.userId,
        authorUsername: post.user?.username || 'unknown',
      }),
    }).catch((err) => console.error('[AuditLog] Error logging DELETE_POST:', err));

    NotificationsService.notifyPostDeleted(staffUser.username, postId, post.userId, moderationNote).catch(() => {});
  }

  return { message: 'Publicación eliminada' };
};

// ========== LIKES ==========

export const likePost = async (postId: string, userId: string) => {
  const post = await PostsRepository.findPostById(postId);
  if (!post) throw new AppError('Publicación no encontrada', 404);

  const existing = await PostsRepository.findPostLike(userId, postId);
  if (existing) throw new AppError('Ya te gusta esta publicación', 409);

  await PostsRepository.likePost(userId, postId);

  // Notify post owner
  if (post.userId !== userId) {
    const liker = await UserRepository.findById(userId);
    if (liker) {
      await NotificationsService.notifyLike(liker.username, postId, post.userId).catch(() => {});
    }
  }

  return { message: 'Like agregado' };
};

export const unlikePost = async (postId: string, userId: string) => {
  const existing = await PostsRepository.findPostLike(userId, postId);
  if (!existing) throw new AppError('No te gusta esta publicación', 404);

  await PostsRepository.unlikePost(userId, postId);
  return { message: 'Like eliminado' };
};

// ========== COMMENTS ==========

export const createComment = async (postId: string, payload: CreateCommentPayload, userId: string) => {
  const post = await PostsRepository.findPostById(postId);
  if (!post) throw new AppError('Publicación no encontrada', 404);

  const comment = await PostsRepository.createComment({
    content: payload.content,
    mediaUrl: payload.mediaUrl,
    postId,
    userId,
  });

  // Notify post owner
  if (post.userId !== userId) {
    const commenter = await UserRepository.findById(userId);
    if (commenter) {
      await NotificationsService.notifyComment(commenter.username, postId, post.userId).catch(() => {});
    }
  }

  return {
    ...comment,
    isLikedByMe: false,
    createdAt: comment.createdAt.toISOString(),
  };
};

export const getComments = async (postId: string, currentUserId?: string) => {
  const comments = await PostsRepository.findCommentsByPost(postId);
  return Promise.all(comments.map(async (c) => {
    let isLikedByMe = false;
    if (currentUserId) {
      const like = await PostsRepository.findCommentLike(currentUserId, c.id);
      isLikedByMe = !!like;
    }
    return {
      ...c,
      isLikedByMe,
      createdAt: c.createdAt.toISOString(),
    };
  }));
};

export const deleteComment = async (commentId: string, userId: string, moderationNote?: string) => {
  const comment = await PostsRepository.findCommentById(commentId);
  if (!comment) throw new AppError('Comentario no encontrado', 404);

  // Allow owner, admin, or moderator to delete
  const isStaffAction = comment.userId !== userId;
  let staffUser = null;
  if (isStaffAction) {
    staffUser = await UserRepository.findById(userId);
    if (!staffUser || (staffUser.role !== 'ADMIN' && staffUser.role !== 'MODERATOR')) {
      throw new AppError('No tienes permiso para eliminar este comentario', 403);
    }
  }

  await PostsRepository.deleteComment(commentId);

  // Log audit trail and notify author for staff moderation actions
  if (isStaffAction && staffUser) {
    AdminRepository.createAdminLog({
      userId,
      action: 'DELETE_COMMENT',
      detail: JSON.stringify({
        commentId,
        contentPreview: comment.content.substring(0, 100),
        postId: comment.postId,
        authorId: comment.userId,
        authorUsername: comment.user?.username || 'unknown',
      }),
    }).catch((err) => console.error('[AuditLog] Error logging DELETE_COMMENT:', err));

    NotificationsService.notifyCommentDeleted(staffUser.username, commentId, comment.userId, moderationNote).catch(() => {});
  }

  return { message: 'Comentario eliminado' };
};

// ========== HASHTAGS ==========

export const getTrendingHashtags = async (limit = 10) => {
  return PostsRepository.findTrendingHashtags(limit);
};

export const getPostsByHashtag = async (hashtag: string, page = 1, limit = 20) => {
  const posts = await PostsRepository.findPostsByHashtag(hashtag, page, limit);
  return posts.map(formatPost);
};

// ========== REPORTS ==========

export const reportPost = async (data: {
  postId: string;
  reporterId: string;
  reason: string;
  description?: string;
}) => {
  const post = await PostsRepository.findPostById(data.postId);
  if (!post) throw new AppError('Publicación no encontrada', 404);

  if (post.userId === data.reporterId) {
    throw new AppError('No puedes reportar tu propia publicación', 400);
  }

  if (!data.reason || data.reason.trim().length < 5) {
    throw new AppError('La razón debe tener al menos 5 caracteres', 400);
  }

  const report = await prisma.report.create({
    data: {
      targetType: 'POST',
      targetId: data.postId,
      reason: data.reason.trim(),
      description: data.description?.trim(),
      reporterId: data.reporterId,
      status: 'PENDING',
    },
  });

  return { message: 'Reporte enviado correctamente. Gracias por ayudar a mantener la comunidad segura.', id: report.id };
};

export const reportComment = async (data: {
  commentId: string;
  reporterId: string;
  reason: string;
  description?: string;
}) => {
  const comment = await PostsRepository.findCommentById(data.commentId);
  if (!comment) throw new AppError('Comentario no encontrado', 404);

  if (comment.userId === data.reporterId) {
    throw new AppError('No puedes reportar tu propio comentario', 400);
  }

  if (!data.reason || data.reason.trim().length < 5) {
    throw new AppError('La razón debe tener al menos 5 caracteres', 400);
  }

  const report = await prisma.report.create({
    data: {
      targetType: 'COMMENT',
      targetId: data.commentId,
      reason: data.reason.trim(),
      description: data.description?.trim(),
      reporterId: data.reporterId,
      status: 'PENDING',
    },
  });

  return { message: 'Reporte enviado correctamente. Gracias por ayudar a mantener la comunidad segura.', id: report.id };
};

// ========== DIRECT MESSAGES ==========

export const sendMessage = async (content: string, senderId: string, receiverId: string) => {
  if (senderId === receiverId) throw new AppError('No puedes enviarte mensajes a ti mismo', 400);
  if (!content.trim()) throw new AppError('El mensaje no puede estar vacío', 400);

  const receiver = await UserRepository.findById(receiverId);
  if (!receiver) throw new AppError('Usuario no encontrado', 404);

  return PostsRepository.sendDirectMessage({
    content: content.trim(),
    senderId,
    receiverId,
  });
};

export const getConversation = async (user1Id: string, user2Id: string) => {
  return PostsRepository.findConversation(user1Id, user2Id);
};

export const getConversations = async (userId: string) => {
  return PostsRepository.findUserConversations(userId);
};

export const markAsRead = async (dmId: string, userId: string) => {
  const dm = await PostsRepository.markDmAsRead(dmId);
  return dm;
};

export const getUnreadDmCount = async (userId: string) => {
  return PostsRepository.countUnreadDms(userId);
};

// ========== HELPERS ==========

function formatPost(post: NonNullable<Awaited<ReturnType<typeof PostsRepository.findPostById>>>) {
  return {
    id: post.id,
    content: post.content,
    mediaUrl: post.mediaUrl,
    isPinned: post.isPinned,
    isPoll: post.isPoll,
    pollData: post.pollData,
    createdAt: post.createdAt?.toISOString?.() || post.createdAt,
    updatedAt: post.updatedAt?.toISOString?.() || post.updatedAt,
    userId: post.userId,
    user: post.user,
    _count: post._count || { comments: 0, likes: 0 },
    isLikedByMe: false,
    hashtags: post.hashtags?.map((h) => h.hashtag.name) || [],
    mentions: post.mentions?.map((m) => m.user.username) || [],
  };
}
