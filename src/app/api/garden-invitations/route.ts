import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createGardenInvitation, getUserInvitations, getUserByUsername, getGardenById, getUserGardenMembership } from '@/lib/database';
import { z } from 'zod';

const createInvitationSchema = z.object({
  gardenId: z.string().min(1, "Garden ID is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(['admin', 'member', 'viewer']),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { gardenId, email, role, message } = validation.data;

    // Check if user has permission to invite others to this garden
    const userMembership = await getUserGardenMembership(gardenId, session.user.id);
    const garden = await getGardenById(gardenId, session.user.id);
    
    // User must be owner of the garden OR have invite permissions
    const canInvite = garden?.user_id === session.user.id || userMembership?.permissions.can_invite_users;
    
    if (!canInvite) {
      return NextResponse.json({ error: 'You do not have permission to invite users to this garden' }, { status: 403 });
    }

    // Check if user being invited exists (optional - they can sign up later)
    const invitedUser = await getUserByUsername(email);

    // Check if user is already a member
    if (invitedUser) {
      const existingMembership = await getUserGardenMembership(gardenId, invitedUser.id);
      if (existingMembership) {
        return NextResponse.json({ error: 'User is already a member of this garden' }, { status: 409 });
      }
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitationId = await createGardenInvitation({
      garden_id: gardenId,
      invited_by_user_id: session.user.id,
      invited_user_email: email,
      invited_user_id: invitedUser?.id,
      role,
      status: 'pending',
      message,
      expires_at: expiresAt,
    });

    return NextResponse.json({
      success: true,
      invitationId,
      message: 'Invitation sent successfully'
    });

  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's pending invitations
    const invitations = await getUserInvitations(session.user.email);

    return NextResponse.json({
      success: true,
      invitations
    });

  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      { error: 'Failed to get invitations. Please try again later.' },
      { status: 500 }
    );
  }
} 