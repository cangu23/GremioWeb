import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import adminRouter from './admin.routes';

// ── Mocks: cortan el árbol de imports del router para no tocar DB/red ──
// authenticate/authorize dejan pasar (el test solo valida el enrutado).
// mockJson debe crearse con vi.hoisted: vi.mock se hoistea y los factories
// no pueden capturar variables externas definidas después.
const { mockJson } = vi.hoisted(() => ({
  mockJson: (_req: any, res: any) => {
    res.status(200).json({ ok: true });
    return Promise.resolve();
  },
}));
vi.mock('../auth/authenticate', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  authenticateOptional: (_req: any, _res: any, next: any) => next(),
}));
vi.mock('../auth/authorize', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

// Controllers mockeados: el router solo los importa; ninguna ruta huérfana
// debe llegar a ellos (deben fallar con 404 ANTES en el enrutado).
// Los handlers ELIMINADOS (getUserDetail, restoreUser, getVtuberDetail, …)
// se incluyen en el mock respondiendo 200: si alguien re-añade la ruta, el
// test falla limpio con "expected 404, got 200" (en vez de un crash de
// import por handler undefined o un timeout por handler colgado).
vi.mock('./admin.controller', () => ({
  getDashboardStats: vi.fn(),
  getRecentActivity: vi.fn(),
  listUsers: vi.fn().mockResolvedValue({ data: [], meta: {} }),
  getUserDetail: vi.fn(mockJson),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  restoreUser: vi.fn(mockJson),
  cleanupUserProfiles: vi.fn(),
  grantPlan: vi.fn(),
  revokePlan: vi.fn(),
  listVtubers: vi.fn(),
  getVtuberDetail: vi.fn(mockJson),
  updateVtuber: vi.fn(),
  listStreamers: vi.fn(),
  updateStreamer: vi.fn(),
  listEvents: vi.fn(),
  getEventDetail: vi.fn(mockJson),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  listGuilds: vi.fn(),
  getGuildDetail: vi.fn(),
  updateGuild: vi.fn(),
  deleteGuild: vi.fn(),
  listPosts: vi.fn(),
  getPostDetail: vi.fn(mockJson),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  restorePost: vi.fn(),
  listComments: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
  listReports: vi.fn(),
  createReport: vi.fn(mockJson),
  resolveReport: vi.fn(),
  listLogs: vi.fn(),
}));
vi.mock('./codes.controller', () => ({
  generateCode: vi.fn().mockImplementation((_req: any, res: any) => {
    res.status(201).json({ message: 'ok' });
    return Promise.resolve();
  }),
  listCodes: vi.fn(),
  revokeCode: vi.fn(),
}));
vi.mock('./requests.controller', () => ({
  listRequests: vi.fn(),
  getRequestDetail: vi.fn(mockJson),
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));
vi.mock('./settings.controller', () => ({
  getAllSettings: vi.fn(),
  updateSettings: vi.fn(),
}));
vi.mock('./stickers.controller', () => ({
  listStickers: vi.fn(),
  createSticker: vi.fn(),
  updateSticker: vi.fn(mockJson),
  deleteSticker: vi.fn(),
}));
vi.mock('../ecosystem/pet-requests.controller', () => ({
  listPetRequestsAdmin: vi.fn(),
  approvePetRequestAdmin: vi.fn(),
  rejectPetRequestAdmin: vi.fn(),
}));

// Endpoints que se eliminaron por estar huérfanos del frontend. Si alguno
// "regresa" por accidente, este test falla (debe responder 404).
const REMOVED_ENDPOINTS: Array<[string, string]> = [
  ['GET', '/users/some-user-id'],
  ['POST', '/users/some-user-id/restore'],
  ['GET', '/vtubers/some-profile-id'],
  ['GET', '/events/some-event-id'],
  ['GET', '/posts/some-post-id'],
  ['POST', '/reports'],
  ['GET', '/vtuber-requests/some-request-id'],
  ['PATCH', '/stickers/some-sticker-id'],
];

describe('Admin routes — endpoints huérfanos eliminados', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/admin', adminRouter);
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}/api/admin`;
  });

  afterAll(async () => {
    // Cierra también las conexiones keep-alive de fetch/undici para un
    // teardown determinista (sin esperar el idle timeout de ~4s).
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it.each(REMOVED_ENDPOINTS)('respond 404: %s %s', async (method, path) => {
    const res = await fetch(`${baseUrl}${path}`, { method });
    expect(res.status).toBe(404);
  });

  it('smoke check: una ruta viva (POST /codes/generate) NO responde 404', async () => {
    const res = await fetch(`${baseUrl}/codes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'x', role: 'VTUBER' }),
    });
    expect(res.status).not.toBe(404);
  });
});
