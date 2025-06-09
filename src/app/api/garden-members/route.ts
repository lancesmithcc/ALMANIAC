import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getGardenMemberships, getUserGardenMembership, getGardenById } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gardenId = searchParams.get('gardenId');

    if (!gardenId) {
      return NextResponse.json({ error: 'Garden ID is required' }, { status: 400 });
    }

    // Check if user has access to this garden
    const userMembership = await getUserGardenMembership(gardenId, session.user.id);
    const garden = await getGardenById(gardenId, session.user.id);
    
    const hasAccess = garden?.user_id === session.user.id || userMembership;
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have access to this garden' }, { status: 403 });
    }

    // Get garden members
    const members = await getGardenMemberships(gardenId);

    return NextResponse.json({
      success: true,
      members
    });

  } catch (error) {
    console.error('Get garden members error:', error);
    return NextResponse.json(
      { error: 'Failed to get garden members. Please try again later.' },
      { status: 500 }
    );
  }
} 