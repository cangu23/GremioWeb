import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import AppError from './errors/AppError';
import mainRouter from './index';

const app = express();

// ========== SECURITY MIDDLEWARE ==========

// Helmet: Set security-related HTTP headers
app.use(helmet());

// CORS: Allow frontend to make requests with credentials (development: allow all origins)
app.use(cors({
  origin: (_origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    callback(null, true);
  },
  credentials: true,
}));

// Rate Limiting: Protect API from abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
  },
});

// Apply rate limiting to all /api routes
app.use('/api', limiter);

// More strict rate limit for auth routes (applied BEFORE general limiter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login/register attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
  },
});

// ========== PARSING MIDDLEWARE ==========

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ========== ROUTES ==========

// Apply auth limiter BEFORE general limiter so auth routes get stricter limit
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api', mainRouter);

// ========== ERROR HANDLING ==========

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  console.error('Unhandled error:', err);
  console.error('Stack:', err.stack);

  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

export default app;
