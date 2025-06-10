import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const pool = getDbPool();
    
    // Get invitation details
    const invitationId = request.nextUrl.searchParams.get('invitationId');
    const userId = request.nextUrl.searchParams.get('userId');
    const gardenId = request.nextUrl.searchParams.get('gardenId');
    
    if (invitationId) {
      // Check specific invitation
      const [invitationRows] = await pool.execute(
        'SELECT * FROM garden_invitations WHERE id = ?',
        [invitationId]
      );
      
      // If we have the garden ID, also check memberships
      const invitationArray = invitationRows as unknown[];
      if (invitationArray.length > 0) {
        const invitation = invitationArray[0] as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        const [membershipRows] = await pool.execute(
          'SELECT * FROM garden_memberships WHERE garden_id = ?',
          [invitation.garden_id]
        );
        
        return NextResponse.json({
          invitation: invitationArray[0],
          memberships: membershipRows,
          gardenId: invitation.garden_id
        });
      }
      
      return NextResponse.json({
        invitation: invitationArray[0] || null
      });
    }
    
    if (userId && gardenId) {
      // Check user's membership in specific garden
      const [membershipRows] = await pool.execute(
        'SELECT * FROM garden_memberships WHERE garden_id = ? AND user_id = ?',
        [gardenId, userId]
      );
      
      const [invitationRows] = await pool.execute(
        'SELECT * FROM garden_invitations WHERE garden_id = ? AND invited_user_id = ?',
        [gardenId, userId]
      );
      
      return NextResponse.json({
        memberships: membershipRows,
        invitations: invitationRows,
        gardenId,
        userId
      });
    }
    
    // General debug info
    const [tables] = await pool.execute('SHOW TABLES');
    
    return NextResponse.json({
      tables,
      message: 'Add ?invitationId=<id> to debug a specific invitation, or ?userId=<id>&gardenId=<id> to check memberships'
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Add a POST method to clean up issues
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, invitationId, userId, gardenId } = body;
    
    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }
    
    const pool = getDbPool();
    
    if (action === 'fix-invitation' && invitationId) {
      // Force update invitation status to accepted
      await pool.execute(
        'UPDATE garden_invitations SET status = "accepted", updated_at = NOW() WHERE id = ?',
        [invitationId]
      );
      
      return NextResponse.json({ success: true, message: 'Invitation status updated' });
    }
    
    if (action === 'check-membership' && userId && gardenId) {
      // Check if user is a member
      const [membershipRows] = await pool.execute(
        'SELECT * FROM garden_memberships WHERE garden_id = ? AND user_id = ?',
        [gardenId, userId]
      );
      
             return NextResponse.json({ 
         isMember: (membershipRows as unknown[]).length > 0,
         memberships: membershipRows
       });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Debug POST error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 