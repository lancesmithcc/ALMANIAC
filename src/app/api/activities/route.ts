import { NextRequest, NextResponse } from 'next/server';
import { getRecentActivities, createActivity } from '@/lib/database';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ActivityLog } from '@/types';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10'); // Default to 10, consistent with db function
    
    const activities = await getRecentActivities(session.user.id, limit);
    
    return NextResponse.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
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
    const body = await request.json();
    const { plant_id, type, description, location, notes } = body;
    
    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }
    
    const activityData: Omit<ActivityLog, 'id' | 'created_at'> = {
      user_id: session.user.id, // Associate with current user
      plant_id: plant_id || null,
      type,
      description,
      location: location || null,
      timestamp: new Date(), // This should be set server-side
      notes: notes || null
    };

    const id = await createActivity(activityData);
    
    return NextResponse.json({
      success: true,
      id,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
} 