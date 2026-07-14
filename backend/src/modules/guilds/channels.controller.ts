import { Request, Response, NextFunction } from 'express';
import * as ChannelsService from './channels.service';

export const createChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ChannelsService.createChannel(req.body, req.user!.id);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const getChannels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channels = await ChannelsService.getChannels(String(req.params.guildId), req.user!.id);
    res.json(channels);
  } catch (err) { next(err); }
};

export const deleteChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ChannelsService.deleteChannel(String(req.params.channelId), req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await ChannelsService.sendMessage({
      channelId: String(req.params.channelId),
      userId: req.user!.id,
      content: req.body.content,
    });
    res.status(201).json(message);
  } catch (err) { next(err); }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const before = req.query.before as string | undefined;
    const messages = await ChannelsService.getMessages(String(req.params.channelId), req.user!.id, limit, before);
    res.json(messages);
  } catch (err) { next(err); }
};
