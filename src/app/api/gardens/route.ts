import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createGarden, getGardens } from '@/lib/database';
import { GardenFormData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: GardenFormData = await request.json();
    
    const gardenId = await createGarden({
      user_id: session.user.id,
      name: data.name,
      description: data.description,
      notes: data.notes,
    });

    return NextResponse.json({ id: gardenId, message: 'Garden created successfully' });
  } catch (error) {
    console.error('Error creating garden:', error);
    return NextResponse.json({ error: 'Failed to create garden' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gardens = await getGardens(session.user.id);
    return NextResponse.json(gardens);
  } catch (error) {
    console.error('Error fetching gardens:', error);
    return NextResponse.json({ error: 'Failed to fetch gardens' }, { status: 500 });
  }
} 