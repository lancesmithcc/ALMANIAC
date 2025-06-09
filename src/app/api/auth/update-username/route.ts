import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserByUsername, getUserById } from '@/lib/database';
import { z } from 'zod';
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

const updateUsernameSchema = z.object({
  newUsername: z.string().min(3, "Username must be at least 3 characters long").max(50, "Username cannot exceed 50 characters"),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateUsernameSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { newUsername } = validation.data;

    // Check if the new username is already taken
    const existingUser = await getUserByUsername(newUsername);
    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    // Update the username
    const pool = getDbPool();
    await pool.execute(
      'UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?',
      [newUsername, session.user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Username updated successfully'
    });

  } catch (error) {
    console.error('Update username error:', error);
    return NextResponse.json(
      { error: 'Failed to update username. Please try again later.' },
      { status: 500 }
    );
  }
} 