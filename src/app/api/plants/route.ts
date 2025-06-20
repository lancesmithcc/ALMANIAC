import { NextRequest, NextResponse } from 'next/server';
import { createPlant, getPlantsFromAccessibleGardens } from '@/lib/database';
import { PlantFormData } from '@/types';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get plants from all gardens the user has access to (owned + member)
    const plants = await getPlantsFromAccessibleGardens(session.user.id);
    return NextResponse.json({
      success: true,
      plants
    });
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
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
    const body: PlantFormData = await request.json();
    
    if (!body.plant_type || !body.planting_date || (!body.location && !body.location_id)) {
      return NextResponse.json(
        { error: 'Missing required fields: plant_type, planting_date, location_id' },
        { status: 400 }
      );
    }

    const plantData = {
      user_id: session.user.id, // Associate with current user
      plant_type: body.plant_type,
      variety: body.variety || undefined,
      planting_date: new Date(body.planting_date),
      location: body.location,
      location_id: body.location_id || undefined,
      notes: body.notes || undefined,
      health_status: body.health_status,
      stage: body.stage
    };

    const plantId = await createPlant(plantData);
    
    return NextResponse.json({
      success: true,
      id: plantId,
      message: 'Plant created successfully'
    });

  } catch (error) {
    console.error('Error creating plant:', error);
    return NextResponse.json(
      { error: 'Failed to create plant' },
      { status: 500 }
    );
  }
}

// Note: The PUT and DELETE for a specific plant ID should be in [plantId]/route.ts
// This file should only handle /api/plants (GET all, POST new)
// I'll remove PUT and DELETE from here and ensure they are correctly placed and updated in [plantId]/route.ts 