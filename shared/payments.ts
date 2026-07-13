export interface SubscriptionTierData {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  benefits: string[];
  badgeLabel: string | null;
  color: string | null;
  active: boolean;
}

export interface UserSubscriptionData {
  id: string;
  userId: string;
  tierId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  createdAt: string;
  tier: SubscriptionTierData;
}

export interface DonationData {
  id: string;
  donorId: string;
  recipientId: string;
  amount: number;
  currency: string;
  message: string | null;
  anonymous: boolean;
  createdAt: string;
  donor?: {
    id: string;
    username: string;
  };
  recipient?: {
    id: string;
    username: string;
    vtuberProfile?: { displayName: string | null; avatarUrl: string | null } | null;
  };
}

export interface CreateDonationPayload {
  recipientId: string;
  amount: number;
  message?: string;
  anonymous?: boolean;
}

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export const DEFAULT_TIERS: Omit<SubscriptionTierData, 'id'>[] = [
  {
    name: 'Estrella Naciente',
    description: 'Apoyo básico para tu VTuber favorito',
    price: 2.99,
    interval: 'month',
    benefits: ['Badge exclusivo en el chat', 'Acceso a contenido exclusivo'],
    badgeLabel: null,
    color: '#a8a8a8',
    active: true,
  },
  {
    name: 'Supernova',
    description: 'Apoyo intermedio con beneficios adicionales',
    price: 5.99,
    interval: 'month',
    benefits: ['Todo lo del nivel anterior', 'Emotes personalizados', 'Participación en encuestas'],
    badgeLabel: null,
    color: '#ffd700',
    active: true,
  },
  {
    name: 'Constelación',
    description: 'El nivel máximo de apoyo',
    price: 12.99,
    interval: 'month',
    benefits: ['Todo lo del nivel anterior', 'Menciones en streams', 'Acceso a grupo VIP de Discord', 'Contenido detrás de escenas'],
    badgeLabel: null,
    color: '#ff6b9d',
    active: true,
  },
];
