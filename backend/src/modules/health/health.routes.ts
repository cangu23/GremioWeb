import { Router, Request, Response } from 'express';
import prisma from '../../database/prisma';
import { getBotSentinelStatus, runBotSentinelCycle } from '../../services/bot-sentinel.service';

const router = Router();

const startTime = Date.now();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'unreachable';
  }

  const memoryUsage = process.memoryUsage();

  res.json({
    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    database: dbStatus,
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
  });
});

// Bots Sentinel health status endpoint
router.get('/health/bots', (req: Request, res: Response) => {
  const bots = getBotSentinelStatus();
  res.json({
    timestamp: new Date().toISOString(),
    count: bots.length,
    bots,
  });
});

// Force immediate wakeup ping across all bots
router.post('/health/bots/wakeup', async (req: Request, res: Response) => {
  const bots = await runBotSentinelCycle();
  res.json({
    message: 'Ciclo de reactivación completado exitosamente.',
    timestamp: new Date().toISOString(),
    bots,
  });
});

// Readiness probe for load balancers / cloud orchestration
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).send('READY');
  } catch (err) {
    res.status(503).send('NOT_READY');
  }
});

export default router;
