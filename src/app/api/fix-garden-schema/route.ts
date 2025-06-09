import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbPool } from '@/lib/database';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if garden_locations table exists and what columns it has
      const [tableInfo] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'garden_locations'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('Current garden_locations columns:', tableInfo);
      
      // STEP 1: Create gardens table first (needed for foreign key)
      console.log('Step 1: Creating gardens table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS gardens (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_name (name)
        )
      `);
      
      // STEP 2: Create garden_memberships table
      console.log('Step 2: Creating garden_memberships table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS garden_memberships (
          id VARCHAR(36) PRIMARY KEY,
          garden_id VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          role ENUM('owner', 'admin', 'member', 'viewer') NOT NULL DEFAULT 'member',
          can_edit_garden BOOLEAN DEFAULT FALSE,
          can_add_plants BOOLEAN DEFAULT TRUE,
          can_edit_plants BOOLEAN DEFAULT TRUE,
          can_delete_plants BOOLEAN DEFAULT FALSE,
          can_invite_users BOOLEAN DEFAULT FALSE,
          can_manage_members BOOLEAN DEFAULT FALSE,
          joined_at DATETIME,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_garden_user (garden_id, user_id),
          INDEX idx_garden_id (garden_id),
          INDEX idx_user_id (user_id),
          INDEX idx_role (role)
        )
      `);
      
      // STEP 3: Drop the old garden_locations table if it exists with wrong schema
      console.log('Step 3: Dropping old garden_locations table...');
      await connection.execute('DROP TABLE IF EXISTS garden_locations');
      
      // STEP 4: Create the new garden_locations table with correct schema
      console.log('Step 4: Creating new garden_locations table...');
      await connection.execute(`
        CREATE TABLE garden_locations (
          id VARCHAR(36) PRIMARY KEY,
          garden_id VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          notes TEXT,
          size VARCHAR(100),
          soil_type VARCHAR(100),
          light_conditions ENUM('full_sun', 'partial_sun', 'partial_shade', 'full_shade'),
          irrigation_type ENUM('manual', 'drip', 'sprinkler', 'none') DEFAULT 'manual',
          microclimate_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_garden_id (garden_id),
          INDEX idx_user_id (user_id),
          INDEX idx_name (name),
          UNIQUE KEY unique_garden_location (garden_id, name)
        )
      `);
      
      await connection.commit();
      console.log('Schema fix completed successfully!');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Garden schema fixed successfully',
        originalColumns: tableInfo,
        steps: [
          'Created gardens table',
          'Created garden_memberships table', 
          'Dropped old garden_locations table',
          'Created new garden_locations table with garden_id column'
        ]
      });
      
    } catch (error) {
      console.error('Schema fix step failed:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Schema fix error:', error);
    
    // Extract more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      // @ts-expect-error - MySQL specific error properties not in base Error type
      code: error?.code || 'No error code',
      // @ts-expect-error - MySQL specific error number property
      errno: error?.errno || 'No errno',
      // @ts-expect-error - MySQL specific error message property
      sqlMessage: error?.sqlMessage || 'No SQL message',
      // @ts-expect-error - MySQL specific SQL statement property
      sql: error?.sql || 'No SQL statement'
    };
    
    return NextResponse.json({
      error: 'Failed to fix schema',
      details: errorDetails
    }, { status: 500 });
  }
} 