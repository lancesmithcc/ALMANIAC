import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const pool = getDbPool();
    
    // Get invitation details
    const invitationId = request.nextUrl.searchParams.get('invitationId');
    
    if (invitationId) {
      // Check specific invitation
      const [invitationRows] = await pool.execute(
        'SELECT * FROM garden_invitations WHERE id = ?',
        [invitationId]
      );
      
      // Check garden_memberships table exists and structure
      const [membershipTableRows] = await pool.execute(
        'DESCRIBE garden_memberships'
      );
      
      // Check garden_invitations table exists and structure  
      const [invitationTableRows] = await pool.execute(
        'DESCRIBE garden_invitations'
      );
      
      return NextResponse.json({
        invitation: invitationRows,
        membershipTableStructure: membershipTableRows,
        invitationTableStructure: invitationTableRows
      });
    }
    
    // General debug info
    const [tables] = await pool.execute('SHOW TABLES');
    
    return NextResponse.json({
      tables,
      message: 'Add ?invitationId=<id> to debug a specific invitation'
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 