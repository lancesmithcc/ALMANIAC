import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByUsername } from '@/lib/database';
import { z } from 'zod';

// Define schema for input validation
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long").max(50, "Username cannot exceed 50 characters"),
  password_plaintext: z.string().min(8, "Password must be at least 8 characters long").max(100, "Password cannot exceed 100 characters"),
  email: z.string().email("Invalid email address").optional(), // Optional email
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { username, password_plaintext, email } = validation.data;

    // Check if username already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 }); // 409 Conflict
    }

    // Create user
    const userId = await createUser({ username, password_plaintext, email });

    return NextResponse.json({
      success: true,
      userId,
      message: 'User created successfully'
    }, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('Signup error:', error);
    // Differentiate between known errors and unexpected ones
    if (error instanceof Error && error.message.includes("Duplicate entry")) { // Example for a more specific DB error
        return NextResponse.json({ error: 'Username or email already exists.' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Failed to create user. Please try again later.' },
      { status: 500 }
    );
  }
} 