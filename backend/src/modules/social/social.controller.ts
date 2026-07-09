import { Request, Response, NextFunction } from 'express';
import * as SocialService from './social.service';

export const follow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followerId = req.user!.id;
    const followingId = String(req.params.followingId);
    const result = await SocialService.follow(followerId, followingId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const unfollow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followerId = req.user!.id;
    const followingId = String(req.params.followingId);
    const result = await SocialService.unfollow(followerId, followingId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getSocialProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const currentUserId = req.user?.id;
    const profile = await SocialService.getSocialProfile(userId, currentUserId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const followers = await SocialService.getFollowers(userId);
    res.status(200).json(followers);
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const following = await SocialService.getFollowing(userId);
    res.status(200).json(following);
  } catch (error) {
    next(error);
  }
};
