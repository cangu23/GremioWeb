import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import AppError from './errors/AppError';
import mainRouter from './index';

const app = express();

// ========== CORS (must be first) ==========
// Allow all origins with credentials for both development and production
// Using explicit origin list to ensure preflight (OPTIONS) requests work
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://gremio-frontend.onrender.com',
  'https://gremio-backend.onrender.com',
];

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      // Fallback: allow anyway (only block in strict production if needed)
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ========== SECURITY MIDDLEWARE ==========

// Helmet: Set security-related HTTP headers (AFTER CORS to avoid conflicts)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

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
app.use('/api/auth/google', authLimiter);

app.use('/api', mainRouter);

// ========== STATIC FILES ==========
// Serve uploaded files (avatars, banners)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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
