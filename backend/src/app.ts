import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import http from 'http';
import AppError from './errors/AppError';
import mainRouter from './index';

const BOOT = '[BOOT]';
const REQ = '[REQ]';

console.log(`${BOOT} [${new Date().toISOString()}] Initializing Express app...`);

const app = express();

console.log(`${BOOT} Express app instance created`);

// ========== TRUST PROXY ==========
// Render and other cloud hosts use a proxy/load balancer.
// This ensures req.protocol detects HTTPS via x-forwarded-proto header.
app.set('trust proxy', 1);
console.log(`${BOOT} Trust proxy enabled`);

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
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://gremio-frontend.onrender.com',
  'https://gremio-backend.onrender.com',
  'https://gremioweb.onrender.com',
];
console.log(`${BOOT} CORS allowed origins:`, ALLOWED_ORIGINS);

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));
console.log(`${BOOT} CORS configured`);

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
  // Exempt notification polling from rate limiting
  skip: (req) => req.path.startsWith('/notifications'),
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
console.log(`${BOOT} Static files: /uploads → ${uploadsPath}`);
app.use('/uploads', express.static(uploadsPath));

// ========== FRONTEND PROXY (Next.js standalone) ==========
// In production, proxy non-API requests to the Next.js standalone server
// running on FRONTEND_PORT (default 3001).
// The startup script (start.sh) starts both servers:
//   - Frontend: node frontend/server.js on port 3001 (background)
//   - Backend:  this server on port 4000 (foreground)
if (process.env.NODE_ENV === 'production') {
  const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '3001', 10);

  console.log(`${BOOT} Frontend proxy: forwarding to http://localhost:${FRONTEND_PORT}`);

  // Serve Next.js static files directly for performance
  const frontendPath = path.join(__dirname, '..', '..', 'frontend');
  const nextStaticPath = path.join(frontendPath, '.next', 'static');
  const publicPath = path.join(frontendPath, 'public');

  app.use('/_next/static', express.static(nextStaticPath, {
    maxAge: '1y',
    immutable: true,
  }));

  app.use(express.static(publicPath));

  // Catch-all: proxy non-API requests to the Next.js server
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Let API routes pass through
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Serialize request body and recalculate content-length
    const bodyStr = req.body && typeof req.body === 'object'
      ? JSON.stringify(req.body)
      : '';

    const headers: Record<string, string> = {
      host: `localhost:${FRONTEND_PORT}`,
      'content-length': Buffer.byteLength(bodyStr).toString(),
    };
    // Forward original headers, but override host + content-length
    for (const [key, val] of Object.entries(req.headers)) {
      if (key !== 'host' && key !== 'content-length' && key !== 'content-encoding' && val !== undefined) {
        headers[key] = Array.isArray(val) ? val.join(', ') : val;
      }
    }

    let responded = false;
    const proxyReq = http.request(
      {
        hostname: 'localhost',
        port: FRONTEND_PORT,
        path: req.originalUrl,
        method: req.method,
        headers,
      },
      (proxyRes: any) => {
        responded = true;
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', () => {
      if (responded) return; // Headers already sent, ignore
      res.status(502).setHeader('Content-Type', 'text/html; charset=utf-8').send(
        '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0a0a1a;color:#fff;flex-direction:column;gap:16px">' +
        '<h1 style="color:#8a2be2">✨ Gremio Estelar</h1>' +
        '<p>El frontend se está iniciando... Recarga en unos segundos.</p>' +
        '<button onclick="location.reload()" style="padding:10px 24px;border-radius:8px;border:none;background:#8a2be2;color:#fff;cursor:pointer">Recargar</button>' +
        '</body></html>'
      );
    });

    proxyReq.end(bodyStr);
  });
}

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
