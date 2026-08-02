import { Request, Response, NextFunction } from 'express';
import * as NewsService from './news.service';
import AppError from '../../errors/AppError';
import { isStaffRole } from '@gremio-estelar/shared';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, page, limit } = req.query;
    const isPublishedOnly = !isStaffRole(req.user?.role);

    const result = await NewsService.getAllNews({
      category: category as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 12,
      isPublishedOnly,
    });

    // Auto-seed sample news if empty and user is logged in
    if (result.articles.length === 0 && req.user?.id) {
      await NewsService.seedDefaultNewsIfEmpty(req.user.id);
      const recheck = await NewsService.getAllNews({
        category: category as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 12,
        isPublishedOnly,
      });
      return res.json(recheck);
    }

    return res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPinned = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await NewsService.getPinnedArticle();
    return res.json(article);
  } catch (error) {
    next(error);
  }
};

export const getBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const article = await NewsService.getNewsBySlug(slug);
    return res.json(article);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !isStaffRole(req.user.role)) {
      throw new AppError('No tienes permisos de administrador para crear noticias', 403);
    }

    const { title, summary, content, coverImage, category, isPinned, isPublished } = req.body;
    if (!title || !summary || !content) {
      throw new AppError('Título, resumen y contenido son obligatorios', 400);
    }

    const article = await NewsService.createNews(req.user.id, {
      title,
      summary,
      content,
      coverImage,
      category,
      isPinned,
      isPublished,
    });

    return res.status(201).json(article);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !isStaffRole(req.user.role)) {
      throw new AppError('No tienes permisos de administrador para editar noticias', 403);
    }

    const id = req.params.id as string;
    const article = await NewsService.updateNews(id, req.body);
    return res.json(article);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !isStaffRole(req.user.role)) {
      throw new AppError('No tienes permisos de administrador para eliminar noticias', 403);
    }

    const id = req.params.id as string;
    await NewsService.deleteNews(id);
    return res.json({ message: 'Noticia eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};
