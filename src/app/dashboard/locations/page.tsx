'use client';

import { useSession } from 'next-auth/react';
import GardensManager from '@/components/GardensManager';

export default function GardensPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-white">Please log in to manage your gardens.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight text-white">Garden Management</h1>
      
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 backdrop-blur-sm">
        <h2 className="text-2xl text-green-400 font-semibold mb-4">Your Gardens</h2>
        {session?.user?.id && <GardensManager />}
      </div>
    </div>
  );
} 