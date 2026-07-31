import { Request, Response, NextFunction } from 'express';
import * as PetRequestsService from './pet-requests.service';

export const createPetRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const petRequest = await PetRequestsService.createPetRequest(userId, req.body);
    res.status(201).json({ success: true, data: petRequest });
  } catch (error) {
    next(error);
  }
};

export const getMyPetRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const petRequests = await PetRequestsService.getUserPetRequests(userId);
    res.json({ success: true, data: petRequests });
  } catch (error) {
    next(error);
  }
};

export const listPetRequestsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PetRequestsService.listPetRequestsAdmin(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const approvePetRequestAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewerId = (req as any).user.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const petRequest = await PetRequestsService.approvePetRequestAdmin(id, reviewerId, req.body);
    res.json({ success: true, data: petRequest });
  } catch (error) {
    next(error);
  }
};

export const rejectPetRequestAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewerId = (req as any).user.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const petRequest = await PetRequestsService.rejectPetRequestAdmin(id, reviewerId, req.body);
    res.json({ success: true, data: petRequest });
  } catch (error) {
    next(error);
  }
};
