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

// Simple email sending function using a service like Resend
async function sendInvitationEmail(
  toEmail: string,
  fromUsername: string,
  gardenName: string,
  gardenId: string,
  role: string,
  customMessage?: string
) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const gardenUrl = `${baseUrl}/garden/${gardenId}`;
    
    const defaultMessage = `${fromUsername} has invited you to collaborate on their garden "${gardenName}" as a ${role}.`;
    const message = customMessage || defaultMessage;
    
    const emailContent = `
      <h2>Garden Collaboration Invitation</h2>
      <p>${message}</p>
      <p><strong>Garden:</strong> ${gardenName}</p>
      <p><strong>Your Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
      <p><strong>What you can do:</strong></p>
      <ul>
        ${role === 'viewer' ? '<li>View all plants and garden locations</li>' : ''}
        ${role === 'member' ? '<li>View and add plants</li><li>Edit existing plants</li>' : ''}
        ${role === 'admin' ? '<li>Full access to manage plants and locations</li><li>Invite other members</li>' : ''}
      </ul>
      <p><a href="${gardenUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Garden</a></p>
      <p>To accept this invitation and start collaborating, please:</p>
      <ol>
        <li>Visit the garden link above</li>
        <li>Create an account or sign in if you already have one</li>
        <li>Accept the invitation from your dashboard</li>
      </ol>
      <p><small>This invitation will expire in 7 days.</small></p>
    `;

    // For now, we'll log the email content instead of actually sending it
    // In production, you would integrate with an email service like Resend, SendGrid, etc.
    console.log('=== GARDEN INVITATION EMAIL ===');
    console.log('To:', toEmail);
    console.log('Subject: Garden Collaboration Invitation');
    console.log('Content:', emailContent);
    console.log('================================');
    
    // Return success for now - in production, return the result of your email service
    return { success: true };
    
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

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

    // Send email notification
    if (garden) {
      const emailResult = await sendInvitationEmail(
        email,
        session.user.username || session.user.name || 'A user',
        garden.name,
        gardenId,
        role,
        message
      );
      
      if (!emailResult.success) {
        console.warn('Failed to send invitation email, but invitation was created');
      }
    }

    return NextResponse.json({
      success: true,
      invitationId,
      message: 'Invitation sent successfully! They will receive an email with instructions.'
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