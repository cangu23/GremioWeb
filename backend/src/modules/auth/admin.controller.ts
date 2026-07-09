import { Request, Response, NextFunction } from 'express';

export const testAdminAccess = (req: Request, res: Response) => {
  res.status(200).json({
    message: `Admin access granted to ${req.user?.email}`,
  });
};