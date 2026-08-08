import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Dependencies mock (only what GuildsService.create touches) ──
vi.mock('./guilds.repository', () => ({
  findAllGuilds: vi.fn(),
  createGuild: vi.fn(),
  addMember: vi.fn(),
}));

vi.mock('../users/user.repository', () => ({
  findById: vi.fn(),
}));

vi.mock('../notifications/notifications.service', () => ({
  notifyGuildJoined: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../gamification/gamification.service', () => ({
  awardXpForAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../ecosystem/missions.service', () => ({
  trackMissionProgress: vi.fn().mockResolvedValue(undefined),
}));

// ── Import SUT ───────────────────────────────────
import * as GuildsService from './guilds.service';
import * as GuildsRepository from './guilds.repository';

const basePayload = {
  name: 'Gremio de Prueba',
  description: 'Gremio para test de roles',
};

describe('GuildsService.create — gating de roles múltiples', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (GuildsRepository.findAllGuilds as any).mockResolvedValue([]);
    (GuildsRepository.createGuild as any).mockResolvedValue({
      id: 'guild-1',
      name: 'Gremio de Prueba',
      creatorId: 'user-1',
    });
    (GuildsRepository.addMember as any).mockResolvedValue({ guildId: 'guild-1', userId: 'user-1', role: 'LEADER' });
  });

  it("permite crear gremios a un usuario con rol múltiple 'ADMIN,MODERATOR'", async () => {
    const result = await GuildsService.create(basePayload, 'user-1', 'ADMIN,MODERATOR');

    expect(result).toMatchObject({ id: 'guild-1', isMember: true, myRole: 'LEADER' });
    expect(GuildsRepository.createGuild).toHaveBeenCalledTimes(1);
    expect(GuildsRepository.addMember).toHaveBeenCalledWith('guild-1', 'user-1', 'LEADER');
  });

  it("permite crear gremios a 'STAFF' (antes bloqueado por comparación exacta)", async () => {
    const result = await GuildsService.create(basePayload, 'user-1', 'STAFF');

    expect(result).toMatchObject({ id: 'guild-1' });
    expect(GuildsRepository.createGuild).toHaveBeenCalledTimes(1);
  });

  it("permite crear gremios a roles múltiples con VTuber ('VTUBER,MAID')", async () => {
    const result = await GuildsService.create(basePayload, 'user-1', 'VTUBER,MAID');

    expect(result).toMatchObject({ id: 'guild-1' });
    expect(GuildsRepository.createGuild).toHaveBeenCalledTimes(1);
  });

  it("permite crear gremios a un rol único permitido ('MODERATOR')", async () => {
    const result = await GuildsService.create(basePayload, 'user-1', 'MODERATOR');

    expect(result).toMatchObject({ id: 'guild-1' });
    expect(GuildsRepository.createGuild).toHaveBeenCalledTimes(1);
  });

  it("bloquea a un usuario normal 'USER' con 403 y no crea el gremio", async () => {
    await expect(GuildsService.create(basePayload, 'user-1', 'USER')).rejects.toMatchObject({
      message: 'Solo los VTubers y el equipo de la plataforma pueden crear gremios.',
      statusCode: 403,
    });
    expect(GuildsRepository.createGuild).not.toHaveBeenCalled();
    expect(GuildsRepository.addMember).not.toHaveBeenCalled();
  });

  it("bloquea a un rol no permitido en combinación ('BETA_TESTER,USER')", async () => {
    await expect(GuildsService.create(basePayload, 'user-1', 'BETA_TESTER,USER')).rejects.toMatchObject({
      message: 'Solo los VTubers y el equipo de la plataforma pueden crear gremios.',
      statusCode: 403,
    });
    expect(GuildsRepository.createGuild).not.toHaveBeenCalled();
  });

  it("bloquea a rol vacío/null (cae a 'USER')", async () => {
    await expect(GuildsService.create(basePayload, 'user-1', '')).rejects.toMatchObject({
      message: 'Solo los VTubers y el equipo de la plataforma pueden crear gremios.',
      statusCode: 403,
    });
    expect(GuildsRepository.createGuild).not.toHaveBeenCalled();
  });
});
