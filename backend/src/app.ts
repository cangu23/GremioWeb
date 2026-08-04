import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import AppError from './errors/AppError';
import mainRouter from './index';

const BOOT = '[BOOT]';
const REQ = '[REQ]';

console.log(`${BOOT} [${new Date().toISOString()}] Initializing Express app...`);

const app = express();

console.log(`${BOOT} Express app instance created`);

// ========== TRUST PROXY ==========
// Render/Cloudflare Tunnel sit in front of the app in production, so we trust
// one proxy hop to read the real client IP (req.ip) and detect HTTPS via
// x-forwarded-proto. This also powers rate limiting by IP.
//
// ⚠️  Only enable this behind a real proxy. If the port is directly reachable
// on the internet, trusting X-Forwarded-For lets attackers spoof their IP and
// bypass rate limits. Set TRUST_PROXY=0 in that case (see .env.example).
const trustProxyEnabled =
  process.env.TRUST_PROXY === undefined
    ? process.env.NODE_ENV === 'production'
    : process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true';
app.set('trust proxy', trustProxyEnabled ? 1 : false);
console.log(`${BOOT} Trust proxy: ${trustProxyEnabled ? 'enabled (1 hop)' : 'disabled'}`);

// ========== REQUEST LOGGING (first middleware) ==========
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLine = `${REQ} ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`;
    
    if (res.statusCode >= 400) {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  });
  
  next();
});

// ========== CORS (must be early) ==========
console.log(`${BOOT} Configuring CORS...`);
import env, { isOriginAllowed } from './config/env';
console.log(`${BOOT} CORS allowed origins:`, env.ALLOWED_ORIGINS);

app.use(cors({
  origin: (origin, callback) => {
    try {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`${REQ} [CORS Blocked] origin: ${origin}`);
        callback(null, false);
      }
    } catch (err) {
      console.error(`${REQ} [CORS Error]`, err);
      if (origin && origin.includes('.onrender.com')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));
console.log(`${BOOT} CORS configured`);

// ========== COMPRESSION MIDDLEWARE ==========
app.use(compression());
console.log(`${BOOT} Compression middleware enabled`);

// ========== SECURITY MIDDLEWARE ==========

console.log(`${BOOT} Configuring Helmet...`);
// Helmet: Set security-related HTTP headers (AFTER CORS to avoid conflicts)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false, // Allow Google Sign-In popup postMessage
  originAgentCluster: false, // Disable origin-agent-cluster for Google compatibility
}));
console.log(`${BOOT} Helmet configured`);

// Rate Limiting: Protect API from abuse
console.log(`${BOOT} Configuring rate limiters...`);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (~33/min)
  standardHeaders: true,
  legacyHeaders: false,
  // Exempt preflight OPTIONS & notification polling from rate limiting
  skip: (req) => req.method === 'OPTIONS' || req.path.startsWith('/notifications'),
  message: {
    status: 'error',
    message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
  },
});

// Apply rate limiting to all /api routes
app.use('/api', limiter);
console.log(`${BOOT} General rate limiter applied to /api`);

// More strict rate limit for auth routes (applied BEFORE general limiter)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 login/register attempts per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    status: 'error',
    message: 'Demasiados intentos de autenticación. Intenta de nuevo en 10 minutos.',
  },
});

// ========== PARSING MIDDLEWARE ==========

console.log(`${BOOT} Configuring body parsers...`);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
console.log(`${BOOT} Body parsers configured`);

// ========== ROUTES ==========

console.log(`${BOOT} Mounting routes...`);

// Apply auth limiter BEFORE general limiter so auth routes get stricter limit
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);
console.log(`${BOOT} Auth rate limiters applied`);

console.log(`${BOOT} Mounting main API router...`);
app.use('/api', mainRouter);
console.log(`${BOOT} Main API router mounted`);

// ========== STATIC FILES ==========
// Serve uploaded files (avatars, banners)
const uploadsPath = path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  const avatarPath = path.join(uploadsPath, 'avatar');
  if (!fs.existsSync(avatarPath)) {
    fs.mkdirSync(avatarPath, { recursive: true });
  }
  const bannerPath = path.join(uploadsPath, 'banner');
  if (!fs.existsSync(bannerPath)) {
    fs.mkdirSync(bannerPath, { recursive: true });
  }
} catch (err) {
  console.warn(`${BOOT} Warning: could not initialize uploads directory:`, err);
}
console.log(`${BOOT} Static files: /uploads → ${uploadsPath}`);
app.use(
  '/uploads',
  express.static(uploadsPath, {
    maxAge: '1d',
    immutable: true,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    },
  })
);

// ========== FRONTEND ==========
// The frontend is served by Next.js directly (standalone server),
// which rewrites /api/* requests to the Express backend on port 4001.
// See frontend/next.config.mjs for the rewrite configuration.
// No proxy middleware needed here.

// ========== ERROR HANDLING ==========

console.log(`${BOOT} Registering error handler...`);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`${REQ} [ERROR] Unhandled error for ${req.method} ${req.originalUrl}:`, err.message);
  console.error(`${REQ} [ERROR] Stack:`, err.stack?.split('\n').slice(0, 5).join('\n'));
  
  if (err instanceof AppError) {
    console.warn(`${REQ} [AppError] ${err.statusCode} - ${err.message}`);
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

console.log(`${BOOT} Error handler registered`);
console.log(`${BOOT} [${new Date().toISOString()}] Express app initialization complete`);

export default app;
