import AppError from '../../errors/AppError';
import prisma from '../../database/prisma';
import { getEffectivePlan, planMeetsOrExceeds } from '../subscriptions/platform-subscriptions.service';
import * as NotificationsService from '../notifications/notifications.service';

/**
 * DMs grupales — beneficio del Plan Nova Pro y Stellar Elite.
 * (El plan promete \"Grupos de mensajes privados (DMs grupales)\".)
 */
async function assertNovaPlus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true },
  });
  const effective = getEffectivePlan(user?.plan, user?.role);
  if (!planMeetsOrExceeds(effective, 'NOVA')) {
    throw new AppError('Los DMs grupales son exclusivos de los Planes Nova Pro y Stellar Elite.', 403);
  }
}

export const createGroup = async (userId: string, name: string, memberIds: string[]) => {
  await assertNovaPlus(userId);

  const cleanName = (name || '').trim();
  if (!cleanName) throw new AppError('El nombre del grupo es requerido', 400);
  if (cleanName.length > 40) throw new AppError('El nombre del grupo no puede superar 40 caracteres', 400);

  // Los miembros deben existir y no repetirse; se incluye al creador siempre.
  const uniqueMembers = Array.from(new Set([userId, ...(memberIds || [])]));
  if (uniqueMembers.length < 2) {
    throw new AppError('Un grupo necesita al menos un miembro además de ti', 400);
  }
  if (uniqueMembers.length > 20) {
    throw new AppError('Un grupo no puede tener más de 20 miembros', 400);
  }

  const existing = await prisma.user.findMany({
    where: { id: { in: uniqueMembers } },
    select: { id: true },
  });
  if (existing.length !== uniqueMembers.length) {
    throw new AppError('Alguno de los miembros no existe', 400);
  }

  return prisma.$transaction(async (tx) => {
    const conversation = await tx.groupConversation.create({
      data: { name: cleanName, createdById: userId },
    });
    await tx.groupConversationMember.createMany({
      data: uniqueMembers.map((memberId) => ({
        conversationId: conversation.id,
        userId: memberId,
      })),
    });

    // Devolver la MISMA forma que listMyGroups (members + lastMessage): el
    // frontend añade el grupo recién creado a su lista y renderiza
    // group.members.length — si esto llegara sin `members`, la página de
    // chat revienta con "Cannot read properties of undefined (reading 'length')".
    const full = await tx.groupConversation.findUnique({
      where: { id: conversation.id },
      select: {
        id: true,
        name: true,
        createdById: true,
        createdAt: true,
        members: {
          select: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true } },
              },
            },
          },
        },
      },
    });

    return {
      ...full,
      members: (full?.members || []).map((mem) => mem.user),
      lastMessage: null,
    };
  });
};

export const listMyGroups = async (userId: string) => {
  const memberships = await prisma.groupConversationMember.findMany({
    where: { userId },
    select: {
      conversationId: true,
      conversation: {
        select: {
          id: true,
          name: true,
          createdById: true,
          createdAt: true,
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true, sender: { select: { username: true } } },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => ({
    ...m.conversation,
    members: m.conversation.members.map((mem) => mem.user),
    lastMessage: m.conversation.messages[0] || null,
  }));
};

export const getGroupMessages = async (conversationId: string, userId: string, limit = 50) => {
  await assertMember(conversationId, userId);
  return prisma.groupMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(100, Math.max(1, limit)),
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true } },
        },
      },
    },
  });
};

export const sendGroupMessage = async (conversationId: string, userId: string, content: string) => {
  const cleanContent = (content || '').trim();
  if (!cleanContent) throw new AppError('El mensaje no puede estar vacío', 400);
  if (cleanContent.length > 2000) throw new AppError('El mensaje no puede superar 2000 caracteres', 400);

  await assertMember(conversationId, userId);

  const message = await prisma.groupMessage.create({
    data: { conversationId, senderId: userId, content: cleanContent },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true } },
        },
      },
    },
  });

  // Notificar a los demás miembros (fire-and-forget)
  const conversation = await prisma.groupConversation.findUnique({
    where: { id: conversationId },
    include: { members: { select: { userId: true } } },
  });
  const sender = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, displayName: true } });
  const others = (conversation?.members || []).filter((m) => m.userId !== userId);
  if (conversation && sender && others.length > 0) {
    const name = sender.displayName || sender.username || 'Alguien';
    others.forEach((member) => {
      NotificationsService.notifyGroupMessage(name, conversation.name, conversationId, member.userId).catch(() => {});
    });
  }

  return message;
};

export const addGroupMember = async (conversationId: string, userId: string, newMemberId: string) => {
  await assertMember(conversationId, userId);

  const conversation = await prisma.groupConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, name: true, createdById: true, _count: { select: { members: true } } },
  });
  if (!conversation) throw new AppError('Grupo no encontrado', 404);
  if (conversation._count.members >= 20) {
    throw new AppError('Un grupo no puede tener más de 20 miembros', 400);
  }

  const target = await prisma.user.findUnique({ where: { id: newMemberId }, select: { id: true } });
  if (!target) throw new AppError('El usuario no existe', 404);

  try {
    return await prisma.groupConversationMember.create({
      data: { conversationId, userId: newMemberId },
    });
  } catch {
    throw new AppError('El usuario ya es miembro del grupo', 409);
  }
};

export const removeGroupMember = async (conversationId: string, requesterId: string, memberId: string) => {
  await assertMember(conversationId, requesterId);

  const conversation = await prisma.groupConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, createdById: true },
  });
  if (!conversation) throw new AppError('Grupo no encontrado', 404);

  // Solo el creador puede eliminar a otros; cualquiera puede salirse a sí mismo.
  if (memberId !== requesterId && conversation.createdById !== requesterId) {
    throw new AppError('Solo el creador del grupo puede eliminar miembros', 403);
  }

  await prisma.groupConversationMember.deleteMany({
    where: { conversationId, userId: memberId },
  });
  return { message: memberId === requesterId ? 'Has salido del grupo' : 'Miembro eliminado' };
};

export const leaveGroup = async (conversationId: string, userId: string) => {
  return removeGroupMember(conversationId, userId, userId);
};

async function assertMember(conversationId: string, userId: string) {
  const membership = await prisma.groupConversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) {
    throw new AppError('No eres miembro de este grupo', 403);
  }
}
