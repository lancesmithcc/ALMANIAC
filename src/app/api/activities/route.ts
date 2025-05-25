import { NextRequest, NextResponse } from 'next/server';
import { getRecentActivities, createActivity } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const activities = await getRecentActivities(limit);
    
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
  try {
    const body = await request.json();
    const { plant_id, type, description, location, notes } = body;
    
    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }
    
    const id = await createActivity({
      plant_id: plant_id || null,
      type,
      description,
      location: location || null,
      timestamp: new Date(),
      notes: notes || null
    });
    
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