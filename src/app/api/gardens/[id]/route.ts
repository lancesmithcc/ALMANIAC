import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGardenById, updateGarden, deleteGarden, getUserGardenMembership } from '@/lib/database';
import { GardenFormData } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const garden = await getGardenById(id, session.user.id);
    
    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }

    return NextResponse.json(garden);
  } catch (error) {
    console.error('Error fetching garden:', error);
    return NextResponse.json({ error: 'Failed to fetch garden' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Check if user has permission to edit garden
    const membership = await getUserGardenMembership(id, session.user.id);
    if (!membership || !membership.permissions.can_edit_garden) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data: Partial<GardenFormData> = await request.json();
    await updateGarden(id, session.user.id, data);

    return NextResponse.json({ message: 'Garden updated successfully' });
  } catch (error) {
    console.error('Error updating garden:', error);
    return NextResponse.json({ error: 'Failed to update garden' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Check if user is owner (only owners can delete gardens)
    const membership = await getUserGardenMembership(id, session.user.id);
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only garden owners can delete gardens' }, { status: 403 });
    }

    await deleteGarden(id, session.user.id);
    return NextResponse.json({ message: 'Garden deleted successfully' });
  } catch (error) {
    console.error('Error deleting garden:', error);
    return NextResponse.json({ error: 'Failed to delete garden' }, { status: 500 });
  }
} 