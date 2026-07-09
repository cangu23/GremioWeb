import { Request, Response, NextFunction } from 'express';
import * as EventsService from './events.service';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const event = await EventsService.create(req.body, userId);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const events = await EventsService.getAll(status);
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const currentUserId = req.user?.id;
    const event = await EventsService.getById(id, currentUserId);
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;
    const event = await EventsService.update(id, req.body, userId);
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;
    const result = await EventsService.remove(id, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const attend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const eventId = String(req.params.id);
    const result = await EventsService.attend(eventId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const unattend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const eventId = String(req.params.id);
    const result = await EventsService.unattend(eventId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMyEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const events = await EventsService.getMyEvents(userId);
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};
