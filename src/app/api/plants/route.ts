import { NextRequest, NextResponse } from 'next/server';
import { createPlant, getPlants, updatePlant, deletePlant } from '@/lib/database';
import { PlantFormData } from '@/types';

export async function GET() {
  try {
    const plants = await getPlants();
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
  try {
    const body: PlantFormData = await request.json();
    
    // Validate required fields
    if (!body.plant_type || !body.planting_date || !body.location) {
      return NextResponse.json(
        { error: 'Missing required fields: plant_type, planting_date, location' },
        { status: 400 }
      );
    }

    // Convert form data to database format
    const plantData = {
      plant_type: body.plant_type,
      variety: body.variety || undefined,
      planting_date: new Date(body.planting_date),
      location: body.location,
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Plant ID is required' },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects if present
    if (updates.planting_date) {
      updates.planting_date = new Date(updates.planting_date);
    }

    await updatePlant(id, updates);
    
    return NextResponse.json({
      success: true,
      message: 'Plant updated successfully'
    });

  } catch (error) {
    console.error('Error updating plant:', error);
    return NextResponse.json(
      { error: 'Failed to update plant' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Plant ID is required' },
        { status: 400 }
      );
    }

    await deletePlant(id);
    
    return NextResponse.json({
      success: true,
      message: 'Plant deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting plant:', error);
    return NextResponse.json(
      { error: 'Failed to delete plant' },
      { status: 500 }
    );
  }
} 