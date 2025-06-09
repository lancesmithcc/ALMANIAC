import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { acceptGardenInvitation, declineGardenInvitation } from '@/lib/database';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = actionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid action", 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { action } = validation.data;
    const resolvedParams = await params;
    const invitationId = resolvedParams.id;

    if (action === 'accept') {
      await acceptGardenInvitation(invitationId, session.user.id);
      return NextResponse.json({
        success: true,
        message: 'Invitation accepted successfully'
      });
    } else if (action === 'decline') {
      await declineGardenInvitation(invitationId);
      return NextResponse.json({
        success: true,
        message: 'Invitation declined'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Invitation action error:', error);
    return NextResponse.json(
      { error: 'Failed to process invitation. Please try again later.' },
      { status: 500 }
    );
  }
} 