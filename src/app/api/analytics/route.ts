import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/database';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 