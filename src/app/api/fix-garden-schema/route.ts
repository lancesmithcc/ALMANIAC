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
      
      // Drop the old table if it exists with wrong schema
      await connection.execute('DROP TABLE IF EXISTS garden_locations');
      
      // Create the new garden_locations table with correct schema
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
      
      // Check if gardens table exists, create if not
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
      
      // Check if garden_memberships table exists, create if not
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
      
      await connection.commit();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Garden schema fixed successfully',
        originalColumns: tableInfo
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Schema fix error:', error);
    return NextResponse.json({
      error: 'Failed to fix schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 