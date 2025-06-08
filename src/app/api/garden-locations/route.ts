import { NextRequest, NextResponse } from 'next/server';
import { createGardenLocation, getGardenLocations } from '@/lib/database';
import { GardenLocationFormData } from '@/types';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const locations = await getGardenLocations(session.user.id);
    return NextResponse.json({
      success: true,
      locations
    });
  } catch (error) {
    console.error('Error fetching garden locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch garden locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: GardenLocationFormData = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const locationData = {
      user_id: session.user.id,
      name: body.name,
      description: body.description || undefined,
      notes: body.notes || undefined,
      size: body.size || undefined,
      soil_type: body.soil_type || undefined,
      light_conditions: body.light_conditions || undefined,
      irrigation_type: body.irrigation_type || 'manual',
      microclimate_notes: body.microclimate_notes || undefined
    };

    const locationId = await createGardenLocation(locationData);
    
    return NextResponse.json({
      success: true,
      id: locationId,
      message: 'Garden location created successfully'
    });

  } catch (error) {
    console.error('Error creating garden location:', error);
    return NextResponse.json(
      { error: 'Failed to create garden location' },
      { status: 500 }
    );
  }
} 