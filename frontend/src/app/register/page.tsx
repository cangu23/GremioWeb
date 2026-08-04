'use client';

export const dynamic = 'force-dynamic';

import AuthLayout from '@/components/auth/AuthLayout';

export default function RegisterPage() {
  return <AuthLayout activeTab="register" />;
}
