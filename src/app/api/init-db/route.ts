import { NextResponse } from 'next/server';
import { testConnection, getDbPool } from '@/lib/database';

const createTablesSQLArray = [
  // Users table MUST be created first (other tables reference it)
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    INDEX idx_username (username)
  )`,

  `CREATE TABLE IF NOT EXISTS plants (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plant_type VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    planting_date DATE NOT NULL,
    location VARCHAR(200) NOT NULL,
    notes TEXT,
    health_status ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
    stage ENUM('seed', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest') DEFAULT 'seed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    INDEX idx_plant_type (plant_type),
    INDEX idx_location (location),
    INDEX idx_health_status (health_status),
    INDEX idx_stage (stage),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  
  `CREATE TABLE IF NOT EXISTS weather_records (
    id VARCHAR(36) PRIMARY KEY,
    location VARCHAR(200) NOT NULL,
    user_id VARCHAR(36),
    temperature DECIMAL(5,2) NOT NULL,
    humidity INT NOT NULL,
    wind_speed DECIMAL(5,2) NOT NULL,
    precipitation DECIMAL(5,2) DEFAULT 0,
    \`condition\` VARCHAR(100) NOT NULL,
    description TEXT,
    recorded_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_location (location),
    INDEX idx_recorded_at (recorded_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plant_id VARCHAR(36),
    type ENUM('watering', 'pruning', 'planting', 'harvest', 'observation', 'fertilizing', 'pest_control') NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(200),
    timestamp DATETIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL,
    INDEX idx_plant_id (plant_id),
    INDEX idx_type (type),
    INDEX idx_timestamp (timestamp)
  )`,

  `CREATE TABLE IF NOT EXISTS ai_recommendations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plant_id VARCHAR(36),
    type ENUM('watering', 'fertilizing', 'pest_control', 'harvesting', 'general') NOT NULL,
    recommendation TEXT NOT NULL,
    confidence INT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    weather_factor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    INDEX idx_plant_id (plant_id),
    INDEX idx_priority (priority),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
  )`,

  `CREATE TABLE IF NOT EXISTS garden_locations (
    id VARCHAR(36) PRIMARY KEY,
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_name (name),
    UNIQUE KEY unique_user_location (user_id, name)
  )`
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

    // Initialize database tables one by one
    const pool = getDbPool();
    const connection = await pool.getConnection();
    
    const results = [];
    
    for (let i = 0; i < createTablesSQLArray.length; i++) {
      const statement = createTablesSQLArray[i];
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