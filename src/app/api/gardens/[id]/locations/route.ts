import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createGardenLocation, getGardenLocationsByGardenId, getUserGardenMembership } from '@/lib/database';
import { GardenLocationFormData } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  let session;
  let gardenId;
  let data: GardenLocationFormData | undefined;
  
  try {
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    gardenId = id;
    
    // Check if user has permission to add locations
    const membership = await getUserGardenMembership(gardenId, session.user.id);
    if (!membership || !membership.permissions.can_edit_garden) {
      console.log('Permission check failed:', {
        membership,
        gardenId,
        userId: session.user.id
      });
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    data = await request.json();
    
    if (!data) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    const locationId = await createGardenLocation({
      garden_id: gardenId,
      user_id: session.user.id,
      name: data.name,
      description: data.description,
      notes: data.notes,
      size: data.size,
      soil_type: data.soil_type,
      light_conditions: data.light_conditions,
      irrigation_type: data.irrigation_type,
      microclimate_notes: data.microclimate_notes,
    });

    return NextResponse.json({ id: locationId, message: 'Garden location created successfully' });
  } catch (error) {
    console.error('Error creating garden location:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      gardenId: gardenId || 'undefined',
      userId: session?.user?.id || 'undefined',
      requestData: data || 'undefined'
    });
    return NextResponse.json({ 
      error: 'Failed to create garden location',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: gardenId } = await params;
    
    // Check if user has access to this garden
    const membership = await getUserGardenMembership(gardenId, session.user.id);
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const locations = await getGardenLocationsByGardenId(gardenId);
    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching garden locations:', error);
    return NextResponse.json({ error: 'Failed to fetch garden locations' }, { status: 500 });
  }
} 