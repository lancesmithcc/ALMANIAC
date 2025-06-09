import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGardenById, getGardenLocationsByGardenId, getPlantsByGardenId, getGardenMemberships, getUserGardenMembership } from '@/lib/database';
import { Plant } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: gardenId } = await params;
    const session = await getServerSession(authOptions);

    // Get garden details first
    const garden = await getGardenById(gardenId, session?.user?.id || '');
    
    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }

    // Check if user has access to this garden
    let hasAccess = false;
    
    if (session?.user?.id) {
      // Check if user is owner or has membership
      const membership = await getUserGardenMembership(gardenId, session.user.id);
      hasAccess = garden.user_id === session.user.id || !!membership;
    }

    // For now, allow public access to any garden (you can modify this later for privacy settings)
    // In a real-world scenario, you might have a "public" flag on gardens
    if (!hasAccess && !session?.user?.id) {
      // Allow anonymous viewing but limit data
    }

    try {
      // Get garden locations
      const locations = await getGardenLocationsByGardenId(gardenId);
      
      // Get plants for this garden
      const plants = await getPlantsByGardenId(gardenId);
      
      // Get member count
      let memberCount = 0;
      try {
        const memberships = await getGardenMemberships(gardenId);
        memberCount = memberships.length;
      } catch (error) {
        console.warn('Could not get member count:', error);
      }

      // Calculate stats
      const uniqueTypes = new Set(plants.map((p: Plant) => p.plant_type)).size;

      const gardenWithData = {
        ...garden,
        locations,
        plants,
        total_plants: plants.length,
        unique_types: uniqueTypes,
        member_count: memberCount,
      };

      return NextResponse.json(gardenWithData);
    } catch (error) {
      console.error('Error fetching garden data:', error);
      
      // Return basic garden info even if we can't get detailed data
      return NextResponse.json({
        ...garden,
        locations: [],
        plants: [],
        total_plants: 0,
        unique_types: 0,
        member_count: 0,
      });
    }

  } catch (error) {
    console.error('Error in public garden API:', error);
    return NextResponse.json({ error: 'Failed to fetch garden' }, { status: 500 });
  }
} 