'use client';

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import GardenSettings from '@/components/GardenSettings';

export default function GardenSettingsPage() {
  const { status } = useSession();
  const params = useParams();
  const gardenId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      {status === 'authenticated' && gardenId ? (
        <GardenSettings gardenId={gardenId} />
      ) : (
        <p className="text-white text-center">Please log in to view garden settings.</p>
      )}
    </div>
  );
} 