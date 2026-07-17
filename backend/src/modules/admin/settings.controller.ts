import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database';

/**
 * Get ALL app settings as a flat key-value object.
 * Returns default values for known keys if not yet stored.
 */
const DEFAULT_SETTINGS: Record<string, string> = {
  cafe_schedule: 'Abierto todos los días — Horario: 18:00 - 23:00 VRChat',
  cafe_description: 'Un acogedor café VR donde nuestras maids estelares te harán sentir como en casa. ☕✨',
  cafe_tagline: 'Donde las estrellas se encuentran para una taza de té',
  cafe_welcome_message: '¡Bienvenido a Hoshizora Maid Café! ✨ Toma asiento y déjate consentir por nuestras maids.',
  cafe_color_primary: '#d4a030',
  cafe_color_secondary: '#8B6914',
  cafe_color_accent: '#f5e6d3',
  cafe_discord_url: 'https://discord.gg/hoshizora',
  cafe_twitter_url: 'https://twitter.com/hoshizora_maid',
  cafe_twitch_url: '',
  cafe_vrchat_world: 'Hoshizora Maid Café (VRChat)',
  cafe_timezone: 'UTC-3',
  cafe_logo_url: '',
  cafe_banner_url: '',
};

export const getAllSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stored = await prisma.appSetting.findMany();
    const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const s of stored) {
      settings[s.key] = s.value;
    }
    res.json({ settings });
  } catch (err) { next(err); }
};

/**
 * Upsert one or multiple settings.
 * Body: { settings: { "cafe_schedule": "...", "cafe_description": "..." } }
 */
export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { settings: incoming } = req.body;
    if (!incoming || typeof incoming !== 'object' || Object.keys(incoming).length === 0) {
      res.status(400).json({ error: 'Se requiere al menos un ajuste' });
      return;
    }

    const allowedKeys = Object.keys(DEFAULT_SETTINGS);
    const results: Record<string, string> = {};

    for (const [key, value] of Object.entries(incoming)) {
      if (!allowedKeys.includes(key)) continue;
      if (typeof value !== 'string') continue;

      const trimmed = value.trim();

      await prisma.appSetting.upsert({
        where: { key },
        update: { value: trimmed },
        create: { key, value: trimmed },
      });
      results[key] = trimmed;
    }

    res.json({ settings: results });
  } catch (err) { next(err); }
};
