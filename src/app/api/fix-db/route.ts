import { NextResponse } from 'next/server';
import { testConnection, getDbPool } from '@/lib/database';

const alterTablesSQLArray = [
  // Add user_id column to plants table (MySQL compatible syntax)
  `ALTER TABLE plants ADD COLUMN user_id VARCHAR(36) NOT NULL DEFAULT ''`,
  
  // Add user_id column to weather_records table
  `ALTER TABLE weather_records ADD COLUMN user_id VARCHAR(36)`,
  
  // Add user_id column to activity_logs table
  `ALTER TABLE activity_logs ADD COLUMN user_id VARCHAR(36) NOT NULL DEFAULT ''`,
  
  // Add user_id column to ai_recommendations table
  `ALTER TABLE ai_recommendations ADD COLUMN user_id VARCHAR(36) NOT NULL DEFAULT ''`,
  
  // Add foreign key constraints (these will fail if they already exist, which is fine)
  `ALTER TABLE plants ADD CONSTRAINT fk_plants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`,
  `ALTER TABLE weather_records ADD CONSTRAINT fk_weather_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`,
  `ALTER TABLE ai_recommendations ADD CONSTRAINT fk_ai_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
];

export async function POST() {
  try {
    // Test database connection first
    const connectionTest = await testConnection();
    if (!connectionTest) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Alter database tables one by one
    const pool = getDbPool();
    const connection = await pool.getConnection();
    
    const results = [];
    
    for (let i = 0; i < alterTablesSQLArray.length; i++) {
      const statement = alterTablesSQLArray[i];
      const operation = statement.includes('ADD COLUMN') ? 'add_column' : 'add_constraint';
      
      try {
        console.log(`Executing: ${statement}`);
        await connection.execute(statement);
        results.push({ operation, status: 'success', statement });
        console.log(`✓ Successfully executed: ${operation}`);
      } catch (error) {
        console.error(`✗ Failed to execute ${operation}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Some errors are expected (like column/constraint already exists)
        if (errorMessage.includes('Duplicate column name') || 
            errorMessage.includes('Duplicate key name') || 
            errorMessage.includes('already exists') ||
            errorMessage.includes('Column already exists')) {
          results.push({ 
            operation, 
            status: 'skipped', 
            message: 'Already exists',
            statement 
          });
        } else {
          results.push({ 
            operation, 
            status: 'error', 
            error: errorMessage,
            statement 
          });
        }
      }
    }
    
    connection.release();

    const failedOperations = results.filter(r => r.status === 'error');
    if (failedOperations.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Some operations failed',
        results
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database tables updated successfully',
      results
    });

  } catch (error) {
    console.error('Database update error:', error);
    return NextResponse.json(
      { error: 'Failed to update database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const connectionTest = await testConnection();
    
    return NextResponse.json({
      success: true,
      connected: connectionTest,
      message: connectionTest ? 'Database connection successful' : 'Database connection failed'
    });

  } catch (error) {
    console.error('Database connection test error:', error);
    return NextResponse.json(
      { error: 'Failed to test database connection' },
      { status: 500 }
    );
  }
} 