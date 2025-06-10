import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGardenLocationsByGardenId, getPlantsByGardenId, getGardenMemberships, getUserGardenMembership } from '@/lib/database';
import { Plant } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// New function to get garden for public access - doesn't require membership
async function getGardenForPublicAccess(gardenId: string) {
  const { getDbPool } = await import('@/lib/database');
  const pool = getDbPool();
  
  const [rows] = await pool.execute(`
    SELECT id, user_id, name, description, notes, created_at, updated_at
    FROM gardens 
    WHERE id = ?
  `, [gardenId]);
  
  const gardens = rows as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (gardens.length > 0) {
    const row = gardens[0];
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      notes: row.notes,
      created_at: new Date(row.created_at),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(row.created_at),
    };
  }
  return null;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: gardenId } = await params;
    const session = await getServerSession(authOptions);

    // Get garden details using public access method
    const garden = await getGardenForPublicAccess(gardenId);
    
    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }

    // Check if user has special access to this garden (owner or member)
    let hasSpecialAccess = false;
    let userRole: string | null = null;
    
    if (session?.user?.id) {
      // Check if user is owner
      if (garden.user_id === session.user.id) {
        hasSpecialAccess = true;
        userRole = 'owner';
      } else {
        // Check if user has membership
        const membership = await getUserGardenMembership(gardenId, session.user.id);
        if (membership) {
          hasSpecialAccess = true;
          userRole = membership.role;
        }
      }
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
        user_role: userRole,
        has_special_access: hasSpecialAccess,
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
        user_role: userRole,
        has_special_access: hasSpecialAccess,
      });
    }

  } catch (error) {
    console.error('Error in public garden API:', error);
    return NextResponse.json({ error: 'Failed to fetch garden' }, { status: 500 });
  }
} 