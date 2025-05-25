import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { Plant, WeatherRecord, ActivityLog, AIRecommendation, Location, DailyWeatherTrend } from '@/types';

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

// Create connection pool
let pool: mysql.Pool | null = null;

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Database initialization scripts
export const createTablesSQL = `
  -- Plants table
  CREATE TABLE IF NOT EXISTS plants (
    id VARCHAR(36) PRIMARY KEY,
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
    INDEX idx_stage (stage)
  );

  -- Weather records table
  CREATE TABLE IF NOT EXISTS weather_records (
    id VARCHAR(36) PRIMARY KEY,
    location VARCHAR(200) NOT NULL,
    temperature DECIMAL(5,2) NOT NULL,
    humidity INT NOT NULL,
    wind_speed DECIMAL(5,2) NOT NULL,
    precipitation DECIMAL(5,2) DEFAULT 0,
    \`condition\` VARCHAR(100) NOT NULL,
    description TEXT,
    recorded_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_location (location),
    INDEX idx_recorded_at (recorded_at)
  );

  -- Activity logs table
  CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    plant_id VARCHAR(36),
    type ENUM('watering', 'pruning', 'planting', 'harvest', 'observation', 'fertilizing', 'pest_control') NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(200),
    timestamp DATETIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL,
    INDEX idx_plant_id (plant_id),
    INDEX idx_type (type),
    INDEX idx_timestamp (timestamp)
  );

  -- AI recommendations table
  CREATE TABLE IF NOT EXISTS ai_recommendations (
    id VARCHAR(36) PRIMARY KEY,
    plant_id VARCHAR(36),
    type ENUM('watering', 'fertilizing', 'pest_control', 'harvesting', 'general') NOT NULL,
    recommendation TEXT NOT NULL,
    confidence INT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    weather_factor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    INDEX idx_plant_id (plant_id),
    INDEX idx_priority (priority),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
  );

  -- Locations table
  CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    size VARCHAR(100),
    soil_type VARCHAR(100),
    light_conditions ENUM('full_sun', 'partial_sun', 'partial_shade', 'full_shade'),
    irrigation_type ENUM('manual', 'drip', 'sprinkler', 'none') DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    INDEX idx_name (name)
  );
`;

// Initialize database tables
export async function initializeDatabase() {
  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();
    
    // Split and execute each CREATE TABLE statement
    const statements = createTablesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      await connection.execute(statement);
    }
    
    connection.release();
    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// Plant operations
export async function createPlant(plant: Omit<Plant, 'id' | 'created_at' | 'updated_at'>) {
  const pool = getDbPool();
  const id = uuidv4();
  const [result] = await pool.execute(
    `INSERT INTO plants (id, plant_type, variety, planting_date, location, notes, health_status, stage)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, plant.plant_type, plant.variety || null, plant.planting_date, plant.location, plant.notes || null, plant.health_status, plant.stage]
  );
  return id;
}

export async function getPlants(): Promise<Plant[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT * FROM plants ORDER BY created_at DESC');
  return rows as Plant[];
}

export async function getPlantById(id: string): Promise<Plant | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT * FROM plants WHERE id = ?', [id]);
  const plants = rows as Plant[];
  return plants.length > 0 ? plants[0] : null;
}

export async function updatePlant(id: string, updates: Partial<Plant>) {
  const pool = getDbPool();
  const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
  const values = fields.map(field => (updates as any)[field]);
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  await pool.execute(
    `UPDATE plants SET ${setClause} WHERE id = ?`,
    [...values, id]
  );
}

export async function deletePlant(id: string) {
  const pool = getDbPool();
  await pool.execute('DELETE FROM plants WHERE id = ?', [id]);
}

// Weather operations
export async function saveWeatherRecord(weather: Omit<WeatherRecord, 'id' | 'created_at'>) {
  const pool = getDbPool();
  const id = uuidv4();
  const [result] = await pool.execute(
    `INSERT INTO weather_records (id, location, temperature, humidity, wind_speed, precipitation, \`condition\`, description, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, weather.location, weather.temperature, weather.humidity, weather.wind_speed, weather.precipitation, weather.condition, weather.description, weather.recorded_at]
  );
  return id;
}

export async function getRecentWeather(limit: number = 10): Promise<WeatherRecord[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    'SELECT * FROM weather_records ORDER BY recorded_at DESC LIMIT ?',
    [limit]
  );
  return rows as WeatherRecord[];
}

// Activity operations
export async function createActivity(activity: Omit<ActivityLog, 'id' | 'created_at'>) {
  const pool = getDbPool();
  const id = uuidv4();
  const [result] = await pool.execute(
    `INSERT INTO activity_logs (id, plant_id, type, description, location, timestamp, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, activity.plant_id || null, activity.type, activity.description, activity.location || null, activity.timestamp, activity.notes || null]
  );
  return id;
}

export async function getRecentActivities(limit: number = 20): Promise<ActivityLog[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    'SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
  return rows as ActivityLog[];
}

// AI Recommendations operations
export async function saveAIRecommendation(recommendation: Omit<AIRecommendation, 'id' | 'created_at'>) {
  const pool = getDbPool();
  const id = uuidv4();
  const [result] = await pool.execute(
    `INSERT INTO ai_recommendations (id, plant_id, type, recommendation, confidence, priority, weather_factor, expires_at, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, recommendation.plant_id || null, recommendation.type, recommendation.recommendation, recommendation.confidence, recommendation.priority, recommendation.weather_factor || false, recommendation.expires_at || null, recommendation.is_active]
  );
  return id;
}

export async function getActiveRecommendations(): Promise<AIRecommendation[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    `SELECT * FROM ai_recommendations 
     WHERE is_active = TRUE 
     AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY priority DESC, created_at DESC`
  );
  return rows as AIRecommendation[];
}

// Location operations
export async function createLocation(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) {
  const pool = getDbPool();
  const id = uuidv4();
  const [result] = await pool.execute(
    `INSERT INTO locations (id, name, description, size, soil_type, light_conditions, irrigation_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, location.name, location.description || null, location.size || null, location.soil_type || null, location.light_conditions || null, location.irrigation_type || 'manual']
  );
  return id;
}

export async function getLocations(): Promise<Location[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT * FROM locations ORDER BY name');
  return rows as Location[];
}

// Dashboard analytics
export async function getDashboardStats() {
  const pool = getDbPool();
  
  try {
    const [plantsCount] = await pool.execute('SELECT COUNT(*) as total FROM plants');
    const [healthyPlants] = await pool.execute("SELECT COUNT(*) as healthy FROM plants WHERE health_status IN ('excellent', 'good')");
    const [needsAttention] = await pool.execute("SELECT COUNT(*) as needs_attention FROM plants WHERE health_status IN ('fair', 'poor')");
    const [recentActivities] = await pool.execute('SELECT COUNT(*) as recent FROM activity_logs WHERE timestamp > DATE_SUB(NOW(), INTERVAL 7 DAY)');
    const [avgHealth] = await pool.execute(`
      SELECT AVG(
        CASE health_status 
          WHEN 'excellent' THEN 100
          WHEN 'good' THEN 80
          WHEN 'fair' THEN 60
          WHEN 'poor' THEN 40
          ELSE 50
        END
      ) as avg_health FROM plants
    `);
    
    return {
      total_plants: (plantsCount as any)[0].total,
      active_plants: (healthyPlants as any)[0].healthy,
      plants_needing_attention: (needsAttention as any)[0].needs_attention,
      recent_activities: (recentActivities as any)[0].recent,
      average_health_score: Math.round((avgHealth as any)[0].avg_health || 0),
      next_harvest_days: 7, // This would be calculated based on plant stages and growth data
      weather_alerts: 0 // This would be based on weather conditions
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      total_plants: 0,
      active_plants: 0,
      plants_needing_attention: 0,
      recent_activities: 0,
      average_health_score: 0,
      next_harvest_days: 0,
      weather_alerts: 0
    };
  }
}

// Test database connection
export async function testConnection() {
  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export async function getWeatherTrends(days: 7 | 30 | 90 = 30): Promise<DailyWeatherTrend[]> {
  const pool = getDbPool();
  const query = `
    SELECT 
      DATE(recorded_at) as date,
      AVG(temperature) as avg_temp,
      SUM(precipitation) as total_precip,
      AVG(humidity) as avg_humidity
    FROM weather_records
    WHERE recorded_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(recorded_at)
    ORDER BY date ASC;
  `;
  
  try {
    const [rows] = await pool.execute(query, [days]);
    return (rows as any[]).map(row => ({
      date: new Date(row.date).toISOString().split('T')[0], // Ensure YYYY-MM-DD format
      avg_temp: row.avg_temp !== null ? parseFloat(row.avg_temp) : null,
      total_precip: row.total_precip !== null ? parseFloat(row.total_precip) : null,
      avg_humidity: row.avg_humidity !== null ? parseFloat(row.avg_humidity) : null,
    }));
  } catch (error) {
    console.error(`Error fetching weather trends for last ${days} days:`, error);
    throw error;
  }
}