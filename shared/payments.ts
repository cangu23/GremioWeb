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
