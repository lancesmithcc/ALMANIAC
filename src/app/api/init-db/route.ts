import { NextResponse } from 'next/server';
import { testConnection, getDbPool, createTablesSQL } from '@/lib/database';

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

    // Initialize database tables using the createTablesSQL from database module
    const pool = getDbPool();
    const connection = await pool.getConnection();
    
    const results = [];
    
    // Split and execute each CREATE TABLE statement
    const statements = createTablesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || `table_${i}`;
      
      try {
        console.log(`Creating table: ${tableName}`);
        await connection.execute(statement);
        results.push({ table: tableName, status: 'success' });
        console.log(`✓ Table ${tableName} created successfully`);
      } catch (error) {
        console.error(`✗ Failed to create table ${tableName}:`, error);
        results.push({ 
          table: tableName, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    connection.release();

    const failedTables = results.filter(r => r.status === 'error');
    if (failedTables.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Some tables failed to create',
        results
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All database tables initialized successfully',
      results
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error instanceof Error ? error.message : 'Unknown error' },
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