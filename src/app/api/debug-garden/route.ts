import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGardens, getUserGardenMembership } from '@/lib/database';
import { Garden, GardenMembership } from '@/types';

interface MembershipCheck {
  gardenId: string;
  gardenName: string;
  membership?: GardenMembership | null;
  canEditGarden: boolean;
  error?: string;
}

interface DebugInfo {
  userId: string;
  username: string;
  gardens: Garden[];
  membershipChecks: MembershipCheck[];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's gardens
    const gardens = await getGardens(session.user.id);
    
    const debugInfo: DebugInfo = {
      userId: session.user.id,
      username: session.user.username || 'Unknown',
      gardens: gardens,
      membershipChecks: []
    };

    // Check membership for each garden
    for (const garden of gardens) {
      try {
        const membership = await getUserGardenMembership(garden.id, session.user.id);
        debugInfo.membershipChecks.push({
          gardenId: garden.id,
          gardenName: garden.name,
          membership: membership,
          canEditGarden: membership?.permissions?.can_edit_garden || false
        });
      } catch (error) {
        debugInfo.membershipChecks.push({
          gardenId: garden.id,
          gardenName: garden.name,
          membership: null,
          canEditGarden: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 