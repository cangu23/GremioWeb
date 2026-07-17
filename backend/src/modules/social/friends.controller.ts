import { Request, Response, NextFunction } from 'express';
import * as FriendsService from './friends.service';

export const sendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user!.id;
    const receiverId = String(req.params.userId);
    const result = await FriendsService.sendRequest(senderId, receiverId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const acceptRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const requesterId = String(req.params.userId);
    const result = await FriendsService.acceptRequest(userId, requesterId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const rejectRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const requesterId = String(req.params.userId);
    const result = await FriendsService.rejectRequest(userId, requesterId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const removeFriend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const friendId = String(req.params.userId);
    const result = await FriendsService.removeFriend(userId, friendId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const getFriends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.userId);
    const friends = await FriendsService.getFriendsList(userId);
    res.status(200).json(friends);
  } catch (err) { next(err); }
};

export const getPendingRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const requests = await FriendsService.getPendingRequestsList(userId);
    res.status(200).json(requests);
  } catch (err) { next(err); }
};

export const getSentRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const requests = await FriendsService.getSentRequestsList(userId);
    res.status(200).json(requests);
  } catch (err) { next(err); }
};

export const getPendingCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const count = await FriendsService.getPendingCount(userId);
    res.json({ count });
  } catch (err) { next(err); }
};
