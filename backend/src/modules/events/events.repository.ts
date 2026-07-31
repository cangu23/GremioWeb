import { prisma } from '../../database';

export const createEvent = (data: {
  title: string;
  description: string;
  date: Date;
  location?: string;
  maxAttendees?: number;
  coverUrl?: string;
  creatorId: string;
}) => {
  return prisma.event.create({
    data,
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { attendees: true } },
    },
  });
};

export const autoUpdateExpiredEvents = async () => {
  try {
    await prisma.event.updateMany({
      where: {
        date: { lt: new Date() },
        status: { in: ['UPCOMING', 'ONGOING'] },
      },
      data: {
        status: 'FINISHED',
      },
    });
  } catch {
    // Ignore error
  }
};

export const findEventById = async (id: string) => {
  await autoUpdateExpiredEvents();
  return prisma.event.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { attendees: true } },
    },
  });
};

export const findAllEvents = async (status?: string) => {
  await autoUpdateExpiredEvents();
  const where = status ? { status } : {};
  return prisma.event.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { attendees: true } },
    },
    orderBy: { date: 'asc' },
  });
};

export const updateEvent = (id: string, data: Record<string, unknown>) => {
  return prisma.event.update({
    where: { id },
    data,
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { attendees: true } },
    },
  });
};

export const deleteEvent = (id: string) => {
  return prisma.event.delete({ where: { id } });
};

export const createAttendee = (eventId: string, userId: string) => {
  return prisma.eventAttendee.create({
    data: { eventId, userId },
  });
};

export const deleteAttendee = (eventId: string, userId: string) => {
  return prisma.eventAttendee.delete({
    where: { eventId_userId: { eventId, userId } },
  });
};

export const findAttendee = (eventId: string, userId: string) => {
  return prisma.eventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
};

export const countAttendees = (eventId: string) => {
  return prisma.eventAttendee.count({ where: { eventId } });
};

export const findUserEvents = async (userId: string) => {
  await autoUpdateExpiredEvents();
  return prisma.eventAttendee.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              vtuberProfile: { select: { displayName: true, avatarUrl: true } },
            },
          },
          _count: { select: { attendees: true } },
        },
      },
    },
    orderBy: { event: { date: 'asc' } },
  });
};
