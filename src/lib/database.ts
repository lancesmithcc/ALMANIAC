import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { Plant, WeatherRecord, ActivityLog, AIRecommendation, Location, Garden, GardenLocation, DailyWeatherTrend, User, GardenMembership, GardenInvitation, GardenMembershipWithUser, GardenInvitationWithDetails, DEFAULT_PERMISSIONS } from '@/types';
import bcrypt from 'bcryptjs';

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
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    INDEX idx_username (username)
  );

  -- Plants table
  CREATE TABLE IF NOT EXISTS plants (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plant_type VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    planting_date DATE NOT NULL,
    location VARCHAR(200) NOT NULL,
    location_id VARCHAR(36),
    notes TEXT,
    health_status ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
    stage ENUM('seed', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest') DEFAULT 'seed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    INDEX idx_plant_type (plant_type),
    INDEX idx_location (location),
    INDEX idx_health_status (health_status),
    INDEX idx_stage (stage),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES garden_locations(id) ON DELETE SET NULL
  );

  -- Weather records table
  CREATE TABLE IF NOT EXISTS weather_records (
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
  );

  -- Activity logs table
  CREATE TABLE IF NOT EXISTS activity_logs (
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
  );

  -- AI recommendations table
  CREATE TABLE IF NOT EXISTS ai_recommendations (
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
  );

  -- Gardens table (top-level entity)
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
  );

  -- Garden locations table (belongs to a garden)
  CREATE TABLE IF NOT EXISTS garden_locations (
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
  );

  -- Garden memberships table (for multi-user gardens)
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
  );

  -- Garden invitations table
  CREATE TABLE IF NOT EXISTS garden_invitations (
    id VARCHAR(36) PRIMARY KEY,
    garden_id VARCHAR(36) NOT NULL,
    invited_by_user_id VARCHAR(36) NOT NULL,
    invited_user_email VARCHAR(255) NOT NULL,
    invited_user_id VARCHAR(36),
    role ENUM('admin', 'member', 'viewer') NOT NULL DEFAULT 'member',
    status ENUM('pending', 'accepted', 'declined', 'expired') DEFAULT 'pending',
    message TEXT,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_garden_id (garden_id),
    INDEX idx_invited_user_email (invited_user_email),
    INDEX idx_invited_user_id (invited_user_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
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

// User Management Functions
export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'password_hash'> & { password_plaintext: string }): Promise<string> {
  const pool = getDbPool();
  const id = uuidv4();
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(user.password_plaintext, saltRounds);
  
  await pool.execute(
    'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
    [id, user.username, user.email || null, hashedPassword]
  );
  return id;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE username = ?', [username]);
  const users = rows as User[];
  if (users.length > 0) {
    // Ensure date fields are Date objects
    const user = users[0];
    user.created_at = new Date(user.created_at);
    if (user.updated_at) {
      user.updated_at = new Date(user.updated_at);
    }
    return user;
  }
  return null;
}

export async function getUserById(id: string): Promise<User | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE id = ?', [id]);
  const users = rows as User[];
   if (users.length > 0) {
    const user = users[0];
    user.created_at = new Date(user.created_at);
    if (user.updated_at) {
      user.updated_at = new Date(user.updated_at);
    }
    return user;
  }
  return null;
}

// Plant operations
export async function createPlant(plant: Omit<Plant, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const pool = getDbPool();
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO plants (id, user_id, plant_type, variety, planting_date, location, location_id, notes, health_status, stage)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, plant.user_id, plant.plant_type, plant.variety || null, plant.planting_date, plant.location, plant.location_id || null, plant.notes || null, plant.health_status, plant.stage]
  );
  return id;
}

export async function getPlants(userId: string): Promise<Plant[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT * FROM plants WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows as Plant[];
}

export async function getPlantById(id: string, userId: string): Promise<Plant | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT * FROM plants WHERE id = ? AND user_id = ?', [id, userId]);
  const plants = rows as Plant[];
  return plants.length > 0 ? plants[0] : null;
}

export async function updatePlant(id: string, userId: string, updates: Partial<Omit<Plant, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
  const pool = getDbPool();
  const fields = Object.keys(updates) as (keyof typeof updates)[];
  const values = fields.map(field => updates[field]);
  values.push(id);
  values.push(userId);

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  await pool.execute(
    `UPDATE plants SET ${setClause} WHERE id = ? AND user_id = ?`,
    values
  );
}

export async function deletePlant(id: string, userId: string): Promise<void> {
  const pool = getDbPool();
  await pool.execute('DELETE FROM plants WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function getPlantsByGardenId(gardenId: string): Promise<Plant[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute(`
    SELECT p.* 
    FROM plants p
    INNER JOIN garden_locations gl ON p.location_id = gl.id
    WHERE gl.garden_id = ?
    ORDER BY p.created_at DESC
  `, [gardenId]);
  
  return (rows as unknown[]).map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: row.id,
    user_id: row.user_id,
    plant_type: row.plant_type,
    variety: row.variety,
    planting_date: row.planting_date,
    location: row.location,
    location_id: row.location_id,
    notes: row.notes,
    health_status: row.health_status,
    stage: row.stage,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

// Weather operations
export async function saveWeatherRecord(weather: Omit<WeatherRecord, 'id' | 'created_at'>) {
  const pool = getDbPool();
  const id = uuidv4();
  
  // Try with user_id first, fallback to without user_id for backwards compatibility
  try {
    await pool.execute(
      `INSERT INTO weather_records (id, location, user_id, temperature, humidity, wind_speed, precipitation, \`condition\`, description, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, weather.location, weather.user_id || null, weather.temperature, weather.humidity, weather.wind_speed, weather.precipitation, weather.condition, weather.description, weather.recorded_at]
    );
  } catch (error: unknown) {
    // If user_id column doesn't exist, insert without it
    const mysqlError = error as { code?: string; sqlMessage?: string };
    if (mysqlError.code === 'ER_BAD_FIELD_ERROR' && mysqlError.sqlMessage?.includes('user_id')) {
      await pool.execute(
        `INSERT INTO weather_records (id, location, temperature, humidity, wind_speed, precipitation, \`condition\`, description, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, weather.location, weather.temperature, weather.humidity, weather.wind_speed, weather.precipitation, weather.condition, weather.description, weather.recorded_at]
      );
    } else {
      throw error;
    }
  }
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
export async function createActivity(activity: Omit<ActivityLog, 'id' | 'created_at'>): Promise<string> {
  const pool = getDbPool();
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO activity_logs (id, user_id, plant_id, type, description, location, timestamp, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, activity.user_id, activity.plant_id || null, activity.type, activity.description, activity.location || null, activity.timestamp, activity.notes || null]
  );
  return id;
}

export async function getRecentActivities(userId: string, limit: number = 10): Promise<ActivityLog[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
    [userId, limit]
  );
  return rows as ActivityLog[];
}

// AI Recommendations operations
export async function saveAIRecommendation(recommendation: Omit<AIRecommendation, 'id' | 'created_at'>): Promise<string> {
  const pool = getDbPool();
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO ai_recommendations (id, user_id, plant_id, type, recommendation, confidence, priority, weather_factor, expires_at, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, recommendation.user_id, recommendation.plant_id || null, recommendation.type, recommendation.recommendation, recommendation.confidence, recommendation.priority, recommendation.weather_factor || false, recommendation.expires_at || null, recommendation.is_active]
  );
  return id;
}

export async function getActiveRecommendations(userId: string): Promise<AIRecommendation[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    'SELECT * FROM ai_recommendations WHERE user_id = ? AND is_active = TRUE ORDER BY created_at DESC',
    [userId]
  );
  return rows as AIRecommendation[];
}

export async function deactivateAIRecommendation(id: string, userId: string): Promise<void> {
  const pool = getDbPool();
  await pool.execute('UPDATE ai_recommendations SET is_active = FALSE WHERE id = ? AND user_id = ?', [id, userId]);
}

// Location operations
export async function createLocation(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) {
  const pool = getDbPool();
  const id = uuidv4();
  await pool.execute(
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
interface PlantsCount {
  total: number;
}

interface HealthyPlants {
  healthy: number;
}

interface NeedsAttention {
  needs_attention: number;
}

interface RecentActivities {
  recent: number;
}

interface AvgHealth {
  avg_health: number;
}

export async function getDashboardStats(userId: string) {
  const pool = getDbPool();
  
  try {
    const [plantsCount] = await pool.execute('SELECT COUNT(*) as total FROM plants WHERE user_id = ?', [userId]);
    const [healthyPlants] = await pool.execute("SELECT COUNT(*) as healthy FROM plants WHERE user_id = ? AND health_status IN ('excellent', 'good')", [userId]);
    const [needsAttention] = await pool.execute("SELECT COUNT(*) as needs_attention FROM plants WHERE user_id = ? AND health_status IN ('fair', 'poor')", [userId]);
    const [recentActivities] = await pool.execute('SELECT COUNT(*) as recent FROM activity_logs WHERE user_id = ? AND timestamp > DATE_SUB(NOW(), INTERVAL 7 DAY)', [userId]);
    const [avgHealth] = await pool.execute(`
      SELECT AVG(
        CASE health_status 
          WHEN 'excellent' THEN 100
          WHEN 'good' THEN 80
          WHEN 'fair' THEN 60
          WHEN 'poor' THEN 40
          ELSE 50
        END
      ) as avg_health FROM plants WHERE user_id = ?
    `, [userId]);
    
    // Calculate next harvest estimate based on plant stages
    const [nextHarvest] = await pool.execute(`
      SELECT MIN(
        CASE stage 
          WHEN 'seedling' THEN 60
          WHEN 'vegetative' THEN 30
          WHEN 'flowering' THEN 14
          WHEN 'fruiting' THEN 7
          ELSE 30
        END
      ) as next_harvest_days FROM plants WHERE user_id = ? AND stage IN ('seedling', 'vegetative', 'flowering', 'fruiting')
    `, [userId]);

    // Check for weather alerts (simplified - could be enhanced with real weather API)
    const [recentWeather] = await pool.execute(`
      SELECT COUNT(*) as alerts FROM weather_records 
      WHERE recorded_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) 
      AND (temperature > 90 OR temperature < 32 OR precipitation > 1)
    `);

    const nextHarvestDays = (nextHarvest as { next_harvest_days?: number }[])[0]?.next_harvest_days || 30;
    const weatherAlerts = (recentWeather as { alerts?: number }[])[0]?.alerts || 0;

    return {
      total_plants: (plantsCount as PlantsCount[])[0].total,
      active_plants: (healthyPlants as HealthyPlants[])[0].healthy,
      plants_needing_attention: (needsAttention as NeedsAttention[])[0].needs_attention,
      recent_activities: (recentActivities as RecentActivities[])[0].recent,
      average_health_score: Math.round((avgHealth as AvgHealth[])[0].avg_health || 0),
      next_harvest_days: nextHarvestDays,
      weather_alerts: weatherAlerts
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

interface WeatherTrendRow {
  date: Date;
  avg_temp: number | null;
  total_precip: number | null;
  avg_humidity: number | null;
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
    return (rows as WeatherTrendRow[]).map(row => ({
      date: new Date(row.date).toISOString().split('T')[0], // Ensure YYYY-MM-DD format
      avg_temp: row.avg_temp !== null ? parseFloat(row.avg_temp.toString()) : null,
      total_precip: row.total_precip !== null ? parseFloat(row.total_precip.toString()) : null,
      avg_humidity: row.avg_humidity !== null ? parseFloat(row.avg_humidity.toString()) : null,
    }));
  } catch (error) {
    console.error(`Error fetching weather trends for last ${days} days:`, error);
    throw error;
  }
}

// Garden Location operations
// Garden Functions
export async function createGarden(garden: Omit<Garden, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const pool = getDbPool();
  const id = uuidv4();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Create the garden
    await connection.execute(
      'INSERT INTO gardens (id, user_id, name, description, notes) VALUES (?, ?, ?, ?, ?)',
      [id, garden.user_id, garden.name, garden.description || null, garden.notes || null]
    );
    
    // Create owner membership
    const membershipId = uuidv4();
    const ownerPermissions = DEFAULT_PERMISSIONS.owner;
    
    await connection.execute(
      `INSERT INTO garden_memberships (
        id, garden_id, user_id, role, 
        can_edit_garden, can_add_plants, can_edit_plants, can_delete_plants, 
        can_invite_users, can_manage_members, joined_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        membershipId, id, garden.user_id, 'owner',
        ownerPermissions.can_edit_garden, ownerPermissions.can_add_plants, ownerPermissions.can_edit_plants,
        ownerPermissions.can_delete_plants, ownerPermissions.can_invite_users, ownerPermissions.can_manage_members
      ]
    );
    
    await connection.commit();
    return id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getGardens(userId: string): Promise<Garden[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute(`
    SELECT DISTINCT g.*
    FROM gardens g
    LEFT JOIN garden_memberships gm ON g.id = gm.garden_id
    WHERE g.user_id = ? OR gm.user_id = ?
    ORDER BY g.created_at DESC
  `, [userId, userId]);
  
  return (rows as unknown[]).map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    notes: row.notes,
    created_at: new Date(row.created_at),
    updated_at: row.updated_at ? new Date(row.updated_at) : new Date(row.created_at),
  }));
}

export async function getGardenById(id: string, userId: string): Promise<Garden | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute(`
    SELECT g.*
    FROM gardens g
    LEFT JOIN garden_memberships gm ON g.id = gm.garden_id
    WHERE g.id = ? AND (g.user_id = ? OR gm.user_id = ?)
  `, [id, userId, userId]);
  
  const gardens = rows as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (gardens.length > 0) {
    const row = gardens[0];
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      notes: row.notes,
      created_at: new Date(row.created_at),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(row.created_at),
    };
  }
  return null;
}

export async function updateGarden(id: string, userId: string, updates: Partial<Omit<Garden, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
  const pool = getDbPool();
  const fields = Object.keys(updates) as (keyof typeof updates)[];
  const values = fields.map(field => updates[field]);
  values.push(id);
  values.push(userId);

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  await pool.execute(
    `UPDATE gardens SET ${setClause}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
    values
  );
}

export async function deleteGarden(id: string, userId: string): Promise<void> {
  const pool = getDbPool();
  await pool.execute('DELETE FROM gardens WHERE id = ? AND user_id = ?', [id, userId]);
}

// Garden Location Functions
export async function createGardenLocation(location: Omit<GardenLocation, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const pool = getDbPool();
  const id = uuidv4();
  
  await pool.execute(
    `INSERT INTO garden_locations (
      id, garden_id, user_id, name, description, notes, size, soil_type, 
      light_conditions, irrigation_type, microclimate_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, location.garden_id, location.user_id, location.name, location.description || null, 
      location.notes || null, location.size || null, location.soil_type || null,
      location.light_conditions || null, location.irrigation_type || 'manual', 
      location.microclimate_notes || null
    ]
  );
  
  return id;
}

export async function getGardenLocations(userId: string): Promise<GardenLocation[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT * FROM garden_locations WHERE user_id = ? ORDER BY name ASC', [userId]);
  return rows as GardenLocation[];
}

export async function getGardenLocationsByGardenId(gardenId: string): Promise<GardenLocation[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT * FROM garden_locations WHERE garden_id = ? ORDER BY name ASC', [gardenId]);
  return rows as GardenLocation[];
}

export async function getGardenLocationById(id: string, userId: string): Promise<GardenLocation | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT * FROM garden_locations WHERE id = ? AND user_id = ?', [id, userId]);
  const locations = rows as GardenLocation[];
  return locations.length > 0 ? locations[0] : null;
}

export async function updateGardenLocation(id: string, userId: string, updates: Partial<Omit<GardenLocation, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
  const pool = getDbPool();
  const fields = Object.keys(updates) as (keyof typeof updates)[];
  const values = fields.map(field => updates[field]);
  values.push(id);
  values.push(userId);

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  await pool.execute(
    `UPDATE garden_locations SET ${setClause}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
    values
  );
}

export async function deleteGardenLocation(id: string, userId: string): Promise<void> {
  const pool = getDbPool();
  await pool.execute('DELETE FROM garden_locations WHERE id = ? AND user_id = ?', [id, userId]);
}

// Garden Membership Functions
export async function createGardenMembership(membership: Omit<GardenMembership, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const pool = getDbPool();
  const id = uuidv4();
  const permissions = DEFAULT_PERMISSIONS[membership.role as keyof typeof DEFAULT_PERMISSIONS];
  
  await pool.execute(
    `INSERT INTO garden_memberships (
      id, garden_id, user_id, role, 
      can_edit_garden, can_add_plants, can_edit_plants, can_delete_plants, 
      can_invite_users, can_manage_members, joined_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, membership.garden_id, membership.user_id, membership.role,
      permissions.can_edit_garden, permissions.can_add_plants, permissions.can_edit_plants, 
      permissions.can_delete_plants, permissions.can_invite_users, permissions.can_manage_members,
      membership.joined_at
    ]
  );
  return id;
}

export async function getGardenMemberships(gardenId: string): Promise<GardenMembershipWithUser[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute(`
    SELECT 
      gm.id, gm.garden_id, gm.user_id, gm.role,
      gm.can_edit_garden, gm.can_add_plants, gm.can_edit_plants, 
      gm.can_delete_plants, gm.can_invite_users, gm.can_manage_members,
      gm.joined_at, gm.created_at,
      u.username, u.email
    FROM garden_memberships gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.garden_id = ?
    ORDER BY gm.role = 'owner' DESC, gm.role = 'admin' DESC, gm.created_at ASC
  `, [gardenId]);
  
  return (rows as unknown[]).map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: row.id,
    garden_id: row.garden_id,
    user_id: row.user_id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: {
      can_edit_garden: Boolean(row.can_edit_garden),
      can_add_plants: Boolean(row.can_add_plants),
      can_edit_plants: Boolean(row.can_edit_plants),
      can_delete_plants: Boolean(row.can_delete_plants),
      can_invite_users: Boolean(row.can_invite_users),
      can_manage_members: Boolean(row.can_manage_members),
    },
    joined_at: new Date(row.joined_at),
    created_at: new Date(row.created_at),
  }));
}

export async function getUserGardenMembership(gardenId: string, userId: string): Promise<GardenMembership | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute(`
    SELECT * FROM garden_memberships 
    WHERE garden_id = ? AND user_id = ?
  `, [gardenId, userId]);
  
  const memberships = rows as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (memberships.length > 0) {
    const row = memberships[0];
    return {
      id: row.id,
      garden_id: row.garden_id,
      user_id: row.user_id,
      role: row.role,
      permissions: {
        can_edit_garden: Boolean(row.can_edit_garden),
        can_add_plants: Boolean(row.can_add_plants),
        can_edit_plants: Boolean(row.can_edit_plants),
        can_delete_plants: Boolean(row.can_delete_plants),
        can_invite_users: Boolean(row.can_invite_users),
        can_manage_members: Boolean(row.can_manage_members),
      },
      joined_at: new Date(row.joined_at),
      created_at: new Date(row.created_at),
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }
  return null;
}

export async function updateGardenMembershipRole(membershipId: string, role: 'admin' | 'member' | 'viewer'): Promise<void> {
  const pool = getDbPool();
  const permissions = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS];
  
  await pool.execute(`
    UPDATE garden_memberships SET 
      role = ?, 
      can_edit_garden = ?, can_add_plants = ?, can_edit_plants = ?, 
      can_delete_plants = ?, can_invite_users = ?, can_manage_members = ?,
      updated_at = NOW()
    WHERE id = ?
  `, [
    role, permissions.can_edit_garden, permissions.can_add_plants, permissions.can_edit_plants,
    permissions.can_delete_plants, permissions.can_invite_users, permissions.can_manage_members,
    membershipId
  ]);
}

export async function removeGardenMembership(membershipId: string): Promise<void> {
  const pool = getDbPool();
  await pool.execute('DELETE FROM garden_memberships WHERE id = ?', [membershipId]);
}

// Garden Invitation Functions
export async function createGardenInvitation(invitation: Omit<GardenInvitation, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const pool = getDbPool();
  const id = uuidv4();
  
  await pool.execute(
    `INSERT INTO garden_invitations (
      id, garden_id, invited_by_user_id, invited_user_email, 
      invited_user_id, role, status, message, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, invitation.garden_id, invitation.invited_by_user_id, 
      invitation.invited_user_email, invitation.invited_user_id || null,
      invitation.role, invitation.status, invitation.message || null, invitation.expires_at
    ]
  );
  return id;
}

export async function getGardenInvitations(gardenId: string): Promise<GardenInvitationWithDetails[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute(`
    SELECT 
      gi.*, g.name as garden_name, u.username as invited_by_username
    FROM garden_invitations gi
    JOIN gardens g ON gi.garden_id = g.id
    JOIN users u ON gi.invited_by_user_id = u.id
    WHERE gi.garden_id = ?
    ORDER BY gi.created_at DESC
  `, [gardenId]);
  
  return (rows as unknown[]).map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: row.id,
    garden_id: row.garden_id,
    garden_name: row.garden_name,
    invited_by_user_id: row.invited_by_user_id,
    invited_by_username: row.invited_by_username,
    invited_user_email: row.invited_user_email,
    invited_user_id: row.invited_user_id,
    role: row.role,
    status: row.status,
    message: row.message,
    expires_at: new Date(row.expires_at),
    created_at: new Date(row.created_at),
  }));
}

export async function getUserInvitations(userEmail: string): Promise<GardenInvitationWithDetails[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute(`
    SELECT 
      gi.*, g.name as garden_name, u.username as invited_by_username
    FROM garden_invitations gi
    JOIN gardens g ON gi.garden_id = g.id
    JOIN users u ON gi.invited_by_user_id = u.id
    WHERE gi.invited_user_email = ? AND gi.status = 'pending' AND gi.expires_at > NOW()
    ORDER BY gi.created_at DESC
  `, [userEmail]);
  
  return (rows as unknown[]).map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: row.id,
    garden_id: row.garden_id,
    garden_name: row.garden_name,
    invited_by_user_id: row.invited_by_user_id,
    invited_by_username: row.invited_by_username,
    invited_user_email: row.invited_user_email,
    invited_user_id: row.invited_user_id,
    role: row.role,
    status: row.status,
    message: row.message,
    expires_at: new Date(row.expires_at),
    created_at: new Date(row.created_at),
  }));
}

export async function acceptGardenInvitation(invitationId: string, userId: string): Promise<void> {
  const pool = getDbPool();
  const connection = await pool.getConnection();
  
  try {
    console.log('Accepting invitation:', { invitationId, userId });
    await connection.beginTransaction();
    
    // Get invitation details
    const [invitationRows] = await connection.execute(
      'SELECT * FROM garden_invitations WHERE id = ? AND status = "pending"',
      [invitationId]
    );
    
    const invitations = invitationRows as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log('Found invitations:', invitations.length);
    
    if (invitations.length === 0) {
      throw new Error('Invitation not found or already processed');
    }
    
    const invitation = invitations[0];
    console.log('Invitation details:', { 
      garden_id: invitation.garden_id, 
      role: invitation.role,
      email: invitation.invited_user_email 
    });
    
    // Check if user is already a member
    const [existingMemberRows] = await connection.execute(
      'SELECT id, role FROM garden_memberships WHERE garden_id = ? AND user_id = ?',
      [invitation.garden_id, userId]
    );
    
    const existingMembers = existingMemberRows as unknown[];
    if (existingMembers.length > 0) {
      console.log('User is already a member, just updating invitation status');
      
      // User is already a member, just update the invitation status
      await connection.execute(
        'UPDATE garden_invitations SET status = "accepted", invited_user_id = ?, updated_at = NOW() WHERE id = ?',
        [userId, invitationId]
      );
      
      console.log('Invitation marked as accepted for existing member');
      await connection.commit();
      return; // Exit successfully
    }
    
    // Get permissions for role
    const permissions = DEFAULT_PERMISSIONS[invitation.role as keyof typeof DEFAULT_PERMISSIONS];
    console.log('Role permissions:', permissions);
    
    if (!permissions) {
      throw new Error(`Invalid role: ${invitation.role}`);
    }
    
    // Create garden membership
    const membershipId = uuidv4();
    console.log('Creating membership with ID:', membershipId);
    
    await connection.execute(
      `INSERT INTO garden_memberships (
        id, garden_id, user_id, role, 
        can_edit_garden, can_add_plants, can_edit_plants, can_delete_plants, 
        can_invite_users, can_manage_members, joined_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        membershipId, invitation.garden_id, userId, invitation.role,
        permissions.can_edit_garden, permissions.can_add_plants, permissions.can_edit_plants,
        permissions.can_delete_plants, permissions.can_invite_users, permissions.can_manage_members
      ]
    );
    
    console.log('Membership created, updating invitation status');
    
    // Update invitation status
    await connection.execute(
      'UPDATE garden_invitations SET status = "accepted", invited_user_id = ?, updated_at = NOW() WHERE id = ?',
      [userId, invitationId]
    );
    
    console.log('Invitation accepted successfully');
    await connection.commit();
  } catch (error) {
    console.error('Error accepting invitation:', error);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function declineGardenInvitation(invitationId: string): Promise<void> {
  const pool = getDbPool();
  await pool.execute(
    'UPDATE garden_invitations SET status = "declined", updated_at = NOW() WHERE id = ?',
    [invitationId]
  );
}

export async function getUserAccessibleGardens(userId: string): Promise<Garden[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute(`
    SELECT DISTINCT g.*
    FROM gardens g
    LEFT JOIN garden_memberships gm ON g.id = gm.garden_id
    WHERE g.user_id = ? OR gm.user_id = ?
    ORDER BY g.created_at DESC
  `, [userId, userId]);
  
  return (rows as unknown[]).map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    notes: row.notes,
    created_at: new Date(row.created_at),
    updated_at: row.updated_at ? new Date(row.updated_at) : new Date(row.created_at),
  }));
}