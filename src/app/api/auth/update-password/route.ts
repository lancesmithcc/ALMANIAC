import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserById } from '@/lib/database';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.FREESQL_HOST || 'localhost',
  port: parseInt(process.env.FREESQL_DATABASE_PORT_NUMBER || '3306'),
  user: process.env.FREESQL_DATABASE_USER || 'root',
  password: process.env.FREESQL_DATABASE_PASSWORD || '',
  database: process.env.FREESQL_DATABASE_NAME || 'almaniac',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

function getDbPool() {
  return mysql.createPool(dbConfig);
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long").max(100, "Password cannot exceed 100 characters"),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updatePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { currentPassword, newPassword } = validation.data;

    // Get the current user to verify the current password
    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password
    const pool = getDbPool();
    await pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, session.user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Failed to update password. Please try again later.' },
      { status: 500 }
    );
  }
} 