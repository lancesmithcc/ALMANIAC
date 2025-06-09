import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateGardenMembershipRole, removeGardenMembership } from '@/lib/database';
import { z } from 'zod';

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
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
    const validation = updateMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { role } = validation.data;
    const resolvedParams = await params;
    const membershipId = resolvedParams.id;

    // TODO: Add permission check - user must be owner or admin with manage_members permission
    // For now, we'll implement basic permission checking

    await updateGardenMembershipRole(membershipId, role);

    return NextResponse.json({
      success: true,
      message: 'Member role updated successfully'
    });

  } catch (error) {
    console.error('Update member role error:', error);
    return NextResponse.json(
      { error: 'Failed to update member role. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const membershipId = resolvedParams.id;

    // TODO: Add permission check - user must be owner or admin with manage_members permission
    // For now, we'll implement basic permission checking

    await removeGardenMembership(membershipId);

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Failed to remove member. Please try again later.' },
      { status: 500 }
    );
  }
} 