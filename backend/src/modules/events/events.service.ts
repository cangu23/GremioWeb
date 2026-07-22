import AppError from '../../errors/AppError';
import * as EventsRepository from './events.repository';
import * as UserRepository from '../users/user.repository';
import * as NotificationsService from '../notifications/notifications.service';
import { CreateEventPayload, UpdateEventPayload } from '@gremio-estelar/shared';

export const create = async (payload: CreateEventPayload, creatorId: string, creatorRole: string) => {
  // Solo VTubers, Maids y Admins pueden crear eventos en la plataforma
  const canCreateEvent = ['VTUBER', 'MAID', 'ADMIN'].includes(creatorRole);
  if (!canCreateEvent) {
    throw new AppError('Solo los VTubers y el equipo de la plataforma pueden crear eventos.', 403);
  }

  const eventDate = new Date(payload.date);
  if (isNaN(eventDate.getTime())) {
    throw new AppError('Fecha del evento inválida.', 400);
  }

  const event = await EventsRepository.createEvent({
    title: payload.title,
    description: payload.description,
    date: eventDate,
    location: payload.location,
    maxAttendees: payload.maxAttendees,
    coverUrl: payload.coverUrl,
    creatorId,
  });

  return { ...event, isAttending: false };
};

export const getAll = async (status?: string) => {
  return EventsRepository.findAllEvents(status);
};

export const getById = async (id: string, currentUserId?: string) => {
  const event = await EventsRepository.findEventById(id);
  if (!event) {
    throw new AppError('Evento no encontrado.', 404);
  }

  let isAttending = false;
  if (currentUserId) {
    const attendee = await EventsRepository.findAttendee(id, currentUserId);
    isAttending = !!attendee;
  }

  return { ...event, isAttending };
};

export const update = async (id: string, payload: UpdateEventPayload, userId: string) => {
  const event = await EventsRepository.findEventById(id);
  if (!event) {
    throw new AppError('Evento no encontrado.', 404);
  }
  if (event.creatorId !== userId) {
    throw new AppError('No tienes permiso para editar este evento.', 403);
  }

  const updateData = { ...payload } as Record<string, unknown>;
  if (payload.date) {
    const eventDate = new Date(payload.date);
    if (isNaN(eventDate.getTime())) {
      throw new AppError('Fecha del evento inválida.', 400);
    }
    updateData.date = eventDate;
  }

  return EventsRepository.updateEvent(id, updateData);
};

export const remove = async (id: string, userId: string) => {
  const event = await EventsRepository.findEventById(id);
  if (!event) {
    throw new AppError('Evento no encontrado.', 404);
  }
  if (event.creatorId !== userId) {
    throw new AppError('No tienes permiso para eliminar este evento.', 403);
  }

  await EventsRepository.deleteEvent(id);
  return { message: 'Evento eliminado correctamente.' };
};

export const attend = async (eventId: string, userId: string) => {
  const event = await EventsRepository.findEventById(eventId);
  if (!event) {
    throw new AppError('Evento no encontrado.', 404);
  }

  const existing = await EventsRepository.findAttendee(eventId, userId);
  if (existing) {
    throw new AppError('Ya estás inscrito en este evento.', 409);
  }

  if (event.maxAttendees) {
    const count = await EventsRepository.countAttendees(eventId);
    if (count >= event.maxAttendees) {
      throw new AppError('El evento ha alcanzado el límite de asistentes.', 400);
    }
  }

  await EventsRepository.createAttendee(eventId, userId);

  // Send notification to event creator
  if (event.creatorId !== userId) {
    const attendee = await UserRepository.findById(userId);
    if (attendee) {
      await NotificationsService.notifyEventAttend(attendee.username, event.title, eventId, event.creatorId).catch(() => {});
    }
  }

  return { message: 'Te has inscrito al evento.', eventId };
};

export const unattend = async (eventId: string, userId: string) => {
  const existing = await EventsRepository.findAttendee(eventId, userId);
  if (!existing) {
    throw new AppError('No estás inscrito en este evento.', 404);
  }

  await EventsRepository.deleteAttendee(eventId, userId);
  return { message: 'Te has desinscrito del evento.', eventId };
};

export const getMyEvents = async (userId: string) => {
  return EventsRepository.findUserEvents(userId);
};
