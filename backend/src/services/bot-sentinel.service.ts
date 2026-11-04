import env from '../config/env';
import { createLogger } from '../utils/logger';

const log = createLogger('BOT-SENTINEL');

export interface BotHealthRecord {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'waking_up' | 'offline';
  statusCode: number | null;
  responseTimeMs: number | null;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  consecutiveFailures: number;
  error?: string;
}

interface BotTargetConfig {
  id: string;
  name: string;
  url: string;
}

const botHealthMap = new Map<string, BotHealthRecord>();
let sentinelIntervalHandle: ReturnType<typeof setInterval> | null = null;
let isCycleRunning = false;

/**
 * Returns configured bot targets from environment
 */
function getBotTargets(): BotTargetConfig[] {
  const targets: BotTargetConfig[] = [];

  if (env.SEIZA_POLICE_URL) {
    targets.push({
      id: 'seiza-police',
      name: 'Seiza Police (Bot de Seguridad)',
      url: env.SEIZA_POLICE_URL.trim(),
    });
  }

  if (env.HOSHIZORABOT_URL) {
    targets.push({
      id: 'hoshizorabot',
      name: 'Hoshizora Bot (Bot Estelar)',
      url: env.HOSHIZORABOT_URL.trim(),
    });
  }

  if (env.CHRISTHEND_URL) {
    targets.push({
      id: 'christhend',
      name: 'Christhend (Jefa de Facción MAID)',
      url: env.CHRISTHEND_URL.trim(),
    });
  }

  if (env.SENTINEL_EXTRA_URLS) {
    const extraUrls = env.SENTINEL_EXTRA_URLS.split(',')
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && (u.startsWith('http://') || u.startsWith('https://')));

    extraUrls.forEach((url, idx) => {
      targets.push({
        id: `extra-service-${idx + 1}`,
        name: `Servicio Externo ${idx + 1}`,
        url,
      });
    });
  }

  return targets;
}

/**
 * Pings a single bot endpoint to keep it awake or trigger cold-start wakeup
 */
async function pingBot(target: BotTargetConfig): Promise<BotHealthRecord> {
  const start = Date.now();
  const existing = botHealthMap.get(target.id) || {
    id: target.id,
    name: target.name,
    url: target.url,
    status: 'offline',
    statusCode: null,
    responseTimeMs: null,
    lastCheckedAt: null,
    lastSuccessAt: null,
    consecutiveFailures: 0,
  };

  const controller = new AbortController();
  const timeoutMs = 25000; // 25s timeout allows cold starts on Render
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(target.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'GremioEstelar-Sentinel/1.0 (+https://gremioestelar.com)',
        Accept: '*/*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - start;
    const isOk = response.status >= 200 && response.status < 400;

    const record: BotHealthRecord = {
      ...existing,
      statusCode: response.status,
      responseTimeMs: duration,
      lastCheckedAt: new Date().toISOString(),
      consecutiveFailures: isOk ? 0 : existing.consecutiveFailures + 1,
      status: isOk
        ? 'online'
        : [502, 503, 504].includes(response.status)
        ? 'waking_up'
        : 'offline',
      lastSuccessAt: isOk ? new Date().toISOString() : existing.lastSuccessAt,
      error: isOk ? undefined : `HTTP ${response.status} ${response.statusText}`,
    };

    botHealthMap.set(target.id, record);

    if (isOk) {
      log.info(`✦ [Centinela] ${target.name} activo y despierto (${duration}ms) [${response.status}]`);
    } else {
      log.warn(`✧ [Centinela] ${target.name} respondió con código no exitoso: ${response.status} (${duration}ms)`);
    }

    return record;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const duration = Date.now() - start;
    const isAbort = err.name === 'AbortError';
    const errorMsg = isAbort ? `Timeout de ${timeoutMs}ms (iniciando cold-start)` : err.message || 'Error de conexión';

    const record: BotHealthRecord = {
      ...existing,
      statusCode: null,
      responseTimeMs: duration,
      lastCheckedAt: new Date().toISOString(),
      consecutiveFailures: existing.consecutiveFailures + 1,
      status: isAbort ? 'waking_up' : 'offline',
      error: errorMsg,
    };

    botHealthMap.set(target.id, record);
    log.warn(`★ [Centinela] ${target.name} en proceso de reactivación: ${errorMsg} (${duration}ms)`);
    return record;
  }
}

/**
 * Runs a full wakeup & monitoring cycle across all registered bots
 */
export async function runBotSentinelCycle(): Promise<BotHealthRecord[]> {
  if (isCycleRunning) {
    log.debug('✦ [Centinela] Ciclo anterior en ejecución, omitiendo...');
    return getBotSentinelStatus();
  }

  isCycleRunning = true;
  try {
    const targets = getBotTargets();
    if (targets.length === 0) {
      return [];
    }

    // Ping all bots in parallel with individual error resilience
    const results = await Promise.allSettled(targets.map((target) => pingBot(target)));
    const records: BotHealthRecord[] = [];

    for (const res of results) {
      if (res.status === 'fulfilled') {
        records.push(res.value);
      }
    }

    return records;
  } finally {
    isCycleRunning = false;
  }
}

/**
 * Returns current health status of all monitored bots
 */
export function getBotSentinelStatus(): BotHealthRecord[] {
  return Array.from(botHealthMap.values());
}

/**
 * Starts the automated Sentinel service
 */
export function startBotSentinel(): void {
  if (!env.BOT_SENTINEL_ENABLED) {
    log.info('✧ [Centinela] Deshabilitado por configuración (BOT_SENTINEL_ENABLED=false)');
    return;
  }

  if (sentinelIntervalHandle) {
    log.info('✦ [Centinela] Ya se encuentra en ejecución.');
    return;
  }

  const intervalMs = Math.max(60000, env.BOT_SENTINEL_INTERVAL_MS);
  log.info(`✦ [Centinela] Guardián de Bots activado — Monitoreando y auto-reviviendo cada ${Math.round(intervalMs / 60000)} minutos.`);

  // Primer ciclo con leve delay de arranque (5 segundos) para dar prioridad al boot del servidor
  setTimeout(() => {
    runBotSentinelCycle().catch((err) => log.error({ err }, 'Error en ciclo inicial del Centinela'));
  }, 5000).unref();

  sentinelIntervalHandle = setInterval(() => {
    runBotSentinelCycle().catch((err) => log.error({ err }, 'Error en ciclo periódico del Centinela'));
  }, intervalMs);

  sentinelIntervalHandle.unref();
}

/**
 * Stops the automated Sentinel service
 */
export function stopBotSentinel(): void {
  if (sentinelIntervalHandle) {
    clearInterval(sentinelIntervalHandle);
    sentinelIntervalHandle = null;
    log.info('✧ [Centinela] Guardián de Bots detenido.');
  }
}

