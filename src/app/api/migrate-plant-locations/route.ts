import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';

export async function POST() {
  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();
    
    console.log('Starting plant location migration...');
    
    // Step 1: Add new location_id column to plants table
    try {
      await connection.execute(`
        ALTER TABLE plants 
        ADD COLUMN location_id VARCHAR(36) NULL,
        ADD INDEX idx_location_id (location_id)
      `);
      console.log('✓ Added location_id column to plants table');
    } catch (error) {
      // Column might already exist
      console.log('location_id column may already exist:', error);
    }

    // Step 2: Create a migration to handle existing location text data
    // For now, we'll keep both columns and let users manually reassign plants to garden locations
    
    // Step 3: Add foreign key constraint (after users have migrated their data)
    try {
      await connection.execute(`
        ALTER TABLE plants 
        ADD CONSTRAINT fk_plants_location 
        FOREIGN KEY (location_id) REFERENCES garden_locations(id) ON DELETE SET NULL
      `);
      console.log('✓ Added foreign key constraint for location_id');
    } catch (error) {
      // Constraint might already exist
      console.log('Foreign key constraint may already exist:', error);
    }

    connection.release();

    return NextResponse.json({
      success: true,
      message: 'Plant location migration completed successfully',
      note: 'Plants now support both text locations and garden location references'
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate plant locations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Plant location migration endpoint',
    description: 'POST to run migration that adds location_id column to plants table'
  });
} 