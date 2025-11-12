'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/shared/Card';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const state = searchParams.get('state');

    if (token && refreshToken) {
      // Store tokens
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Redirect to original destination or home
      const redirectTo = state || '/';
      router.push(redirectTo);
    } else {
      // Auth failed
      router.push('/login');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 to-ocean-50 p-4 flex items-center justify-center">
      <Card className="max-w-md w-full text-center">
        <p className="text-gray-600">Completing sign in...</p>
      </Card>
    </div>
  );
}
