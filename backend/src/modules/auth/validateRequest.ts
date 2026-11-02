import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import AppError from '../../errors/AppError';

export const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        // En Express 5, req.query solo tiene getter en el prototipo.
        // Asignar req.query = ... lanza TypeError ('Cannot set property query of #<IncomingMessage> which has only a getter').
        // Usamos Object.defineProperty para sobrescribir la propiedad en req con el valor parseado de forma segura.
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      if (parsed.params !== undefined) {
        Object.defineProperty(req, 'params', {
          value: parsed.params,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = (error.issues || error.errors || []).map((e) => e.message).join(', ');
        return next(new AppError(message || 'Datos de solicitud inválidos', 400));
      }
      next(error);
    }
  };
