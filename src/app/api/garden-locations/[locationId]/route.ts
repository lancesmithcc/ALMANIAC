import { NextRequest, NextResponse } from 'next/server';
import { getGardenLocationById, updateGardenLocation, deleteGardenLocation } from '@/lib/database';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const location = await getGardenLocationById(locationId, session.user.id);
    if (!location) {
      return NextResponse.json({ error: 'Garden location not found or access denied' }, { status: 404 });
    }
    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error(`Error fetching garden location ${locationId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch garden location' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Ensure user can only update their own location
    const existingLocation = await getGardenLocationById(locationId, session.user.id);
    if (!existingLocation) {
      return NextResponse.json({ error: 'Garden location not found or access denied' }, { status: 404 });
    }

    // Exclude user_id, id, created_at, updated_at from updates
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, id, created_at, updated_at, ...validUpdates } = body;

    await updateGardenLocation(locationId, session.user.id, validUpdates);
    return NextResponse.json({ success: true, message: 'Garden location updated successfully' });
  } catch (error) {
    console.error(`Error updating garden location ${locationId}:`, error);
    return NextResponse.json({ error: 'Failed to update garden location' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ensure user can only delete their own location
    const existingLocation = await getGardenLocationById(locationId, session.user.id);
    if (!existingLocation) {
      return NextResponse.json({ error: 'Garden location not found or access denied' }, { status: 404 });
    }

    await deleteGardenLocation(locationId, session.user.id);
    return NextResponse.json({ success: true, message: 'Garden location deleted successfully' });
  } catch (error) {
    console.error(`Error deleting garden location ${locationId}:`, error);
    return NextResponse.json({ error: 'Failed to delete garden location' }, { status: 500 });
  }
} 