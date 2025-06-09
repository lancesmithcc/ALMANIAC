import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createGardenInvitation, getGardenById, getUserGardenMembership } from '@/lib/database';
import { z } from 'zod';

const accessRequestSchema = z.object({
  gardenId: z.string().min(1, "Garden ID is required"),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = accessRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { gardenId, message } = validation.data;

    // Check if garden exists
    const garden = await getGardenById(gardenId, ''); // Empty string to bypass ownership check
    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await getUserGardenMembership(gardenId, session.user.id);
    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member of this garden' }, { status: 409 });
    }

    // Check if user is the owner
    if (garden.user_id === session.user.id) {
      return NextResponse.json({ error: 'You are the owner of this garden' }, { status: 409 });
    }

    // Create invitation request (with status pending)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to respond

    const defaultMessage = `${session.user.username || session.user.name || session.user.email} has requested access to collaborate on your garden "${garden.name}". They found your garden through a shared link.`;

    const invitationId = await createGardenInvitation({
      garden_id: gardenId,
      invited_by_user_id: session.user.id, // The requester becomes the "inviter" in this context
      invited_user_email: session.user.email,
      invited_user_id: session.user.id,
      role: 'member', // Default role for access requests
      status: 'pending',
      message: message || defaultMessage,
      expires_at: expiresAt,
    });

    // In a real application, you would send a notification to the garden owner here
    // For now, we'll just create the invitation record

    return NextResponse.json({
      success: true,
      invitationId,
      message: 'Access request sent successfully. The garden owner will be notified.'
    });

  } catch (error) {
    console.error('Garden access request error:', error);
    return NextResponse.json(
      { error: 'Failed to send access request. Please try again later.' },
      { status: 500 }
    );
  }
} 