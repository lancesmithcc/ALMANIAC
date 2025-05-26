import { NextRequest, NextResponse } from 'next/server';
import { getPlantById, updatePlant, deletePlant } from '@/lib/database';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ plantId: string }> }) {
  const { plantId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const plant = await getPlantById(plantId, session.user.id);
    if (!plant) {
      return NextResponse.json({ error: 'Plant not found or access denied' }, { status: 404 });
    }
    return NextResponse.json({ success: true, plant });
  } catch (error) {
    console.error(`Error fetching plant ${plantId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch plant' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ plantId: string }> }) {
  const { plantId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Ensure user can only update their own plant - getPlantById checks this
    const existingPlant = await getPlantById(plantId, session.user.id);
    if (!existingPlant) {
      return NextResponse.json({ error: 'Plant not found or access denied' }, { status: 404 });
    }

    // Exclude user_id, id, created_at, updated_at from updates
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, id, created_at, updated_at, ...validUpdates } = body;

    if (validUpdates.planting_date) {
      validUpdates.planting_date = new Date(validUpdates.planting_date);
    }

    await updatePlant(plantId, session.user.id, validUpdates);
    return NextResponse.json({ success: true, message: 'Plant updated successfully' });
  } catch (error) {
    console.error(`Error updating plant ${plantId}:`, error);
    return NextResponse.json({ error: 'Failed to update plant' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ plantId: string }> }) {
  const { plantId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ensure user can only delete their own plant - getPlantById checks this implicitly before delete
    const existingPlant = await getPlantById(plantId, session.user.id);
    if (!existingPlant) {
      return NextResponse.json({ error: 'Plant not found or access denied' }, { status: 404 });
    }

    await deletePlant(plantId, session.user.id);
    return NextResponse.json({ success: true, message: 'Plant deleted successfully' });
  } catch (error) {
    console.error(`Error deleting plant ${plantId}:`, error);
    return NextResponse.json({ error: 'Failed to delete plant' }, { status: 500 });
  }
} 