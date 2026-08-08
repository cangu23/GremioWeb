import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Dependencies mock (only what EventsService.create touches) ──
vi.mock('./events.repository', () => ({
  createEvent: vi.fn(),
}));

vi.mock('../users/user.repository', () => ({
  findById: vi.fn(),
}));

vi.mock('../notifications/notifications.service', () => ({
  notifyEventAttend: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../gamification/gamification.service', () => ({
  awardXpForAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../ecosystem/missions.service', () => ({
  trackMissionProgress: vi.fn().mockResolvedValue(undefined),
}));

// Evita cargar prisma real vía platform-subscriptions.service
vi.mock('../subscriptions/platform-subscriptions.service', () => ({
  getEffectivePlan: vi.fn(() => 'FREE'),
}));

// ── Import SUT ───────────────────────────────────
import * as EventsService from './events.service';
import * as EventsRepository from './events.repository';

const basePayload = {
  title: 'Stream de prueba',
  description: 'Un evento de regresión',
  date: new Date(Date.now() + 86400000).toISOString(), // fecha futura válida
};

describe('EventsService.create — gating de roles múltiples', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (EventsRepository.createEvent as any).mockResolvedValue({
      id: 'evt-1',
      title: 'Stream de prueba',
      creatorId: 'user-1',
    });
  });

  it("permite crear eventos a un usuario con rol múltiple 'ADMIN,MODERATOR'", async () => {
    const result = await EventsService.create(basePayload, 'user-1', 'ADMIN,MODERATOR');

    expect(result).toMatchObject({ id: 'evt-1', isAttending: false });
    expect(EventsRepository.createEvent).toHaveBeenCalledTimes(1);
  });

  it("permite crear eventos a 'STAFF' (antes bloqueado por comparación exacta)", async () => {
    const result = await EventsService.create(basePayload, 'user-1', 'STAFF');

    expect(result).toMatchObject({ id: 'evt-1' });
    expect(EventsRepository.createEvent).toHaveBeenCalledTimes(1);
  });

  it("permite crear eventos a roles múltiples con VTuber ('VTUBER,BETA_TESTER')", async () => {
    const result = await EventsService.create(basePayload, 'user-1', 'VTUBER,BETA_TESTER');

    expect(result).toMatchObject({ id: 'evt-1' });
    expect(EventsRepository.createEvent).toHaveBeenCalledTimes(1);
  });

  it("permite crear eventos a un rol único permitido ('MODERATOR')", async () => {
    const result = await EventsService.create(basePayload, 'user-1', 'MODERATOR');

    expect(result).toMatchObject({ id: 'evt-1' });
    expect(EventsRepository.createEvent).toHaveBeenCalledTimes(1);
  });

  it("normaliza espacios en el rol (' MODERATOR ')", async () => {
    const result = await EventsService.create(basePayload, 'user-1', ' MODERATOR ');

    expect(result).toMatchObject({ id: 'evt-1' });
    expect(EventsRepository.createEvent).toHaveBeenCalledTimes(1);
  });

  it("bloquea a un usuario normal 'USER' con 403 y no crea el evento", async () => {
    await expect(EventsService.create(basePayload, 'user-1', 'USER')).rejects.toMatchObject({
      message: 'Solo los VTubers y el equipo de la plataforma pueden crear eventos.',
      statusCode: 403,
    });
    expect(EventsRepository.createEvent).not.toHaveBeenCalled();
  });

  it("bloquea a un rol no permitido en combinación ('BETA_TESTER,USER')", async () => {
    await expect(EventsService.create(basePayload, 'user-1', 'BETA_TESTER,USER')).rejects.toMatchObject({
      message: 'Solo los VTubers y el equipo de la plataforma pueden crear eventos.',
      statusCode: 403,
    });
    expect(EventsRepository.createEvent).not.toHaveBeenCalled();
  });

  it("bloquea a rol vacío/null (cae a 'USER')", async () => {
    await expect(EventsService.create(basePayload, 'user-1', '')).rejects.toMatchObject({
      message: 'Solo los VTubers y el equipo de la plataforma pueden crear eventos.',
      statusCode: 403,
    });
    expect(EventsRepository.createEvent).not.toHaveBeenCalled();
  });
});
