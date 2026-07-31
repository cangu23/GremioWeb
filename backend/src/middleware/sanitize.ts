import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'ul', 'ol', 'li', 'code', 'pre'],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    span: ['class', 'style'],
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return str;
  return sanitizeHtml(str, SANITIZE_OPTIONS);
};

export const sanitizeBody = (fieldsToSanitize?: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      const keys = fieldsToSanitize || Object.keys(req.body);
      for (const key of keys) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeString(req.body[key]);
        }
      }
    }
    next();
  };
};
