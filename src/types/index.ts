// Database models and types for the Almanac app

export interface Plant {
  id: string;
  user_id: string;
  plant_type: string;
  variety?: string;
  planting_date: string | Date;
  location: string;
  notes?: string;
  health_status: 'excellent' | 'good' | 'fair' | 'poor';
  stage: 'seed' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';
  created_at: Date;
  updated_at: Date;
}

export interface WeatherRecord {
  id: string;
  location: string;
  user_id?: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  precipitation: number;
  condition: string;
  description: string;
  recorded_at: Date;
  created_at: Date;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  plant_id?: string;
  type: 'watering' | 'pruning' | 'planting' | 'harvest' | 'observation' | 'fertilizing' | 'pest_control';
  description: string;
  location?: string;
  timestamp: Date;
  notes?: string;
  created_at: Date;
}

export interface AIRecommendation {
  id: string;
  user_id: string;
  plant_id?: string;
  type: 'watering' | 'fertilizing' | 'pest_control' | 'harvesting' | 'general';
  recommendation: string;
  confidence: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'urgent';
  weather_factor?: boolean;
  created_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  size?: string;
  soil_type?: string;
  light_conditions?: 'full_sun' | 'partial_sun' | 'partial_shade' | 'full_shade';
  irrigation_type?: 'manual' | 'drip' | 'sprinkler' | 'none';
  created_at: Date;
  updated_at: Date;
}

// API Response types
export interface WeatherApiResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      date_epoch: number;
      day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        avgtemp_c: number;
        avgtemp_f: number;
        maxwind_mph: number;
        maxwind_kph: number;
        totalprecip_mm: number;
        totalprecip_in: number;
        totalsnow_cm: number;
        avgvis_km: number;
        avgvis_miles: number;
        avghumidity: number;
        daily_will_it_rain: number;
        daily_chance_of_rain: number;
        daily_will_it_snow: number;
        daily_chance_of_snow: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        uv: number;
      };
      astro: {
        sunrise: string;
        sunset: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: string;
        is_moon_up?: number;
        is_sun_up?: number;
        planetary_positions?: Record<string, string>;
      };
      hour: Array<{
        time_epoch: number;
        time: string;
        temp_c: number;
        temp_f: number;
        is_day: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        wind_mph: number;
        wind_kph: number;
        wind_degree: number;
        wind_dir: string;
        pressure_mb: number;
        pressure_in: number;
        precip_mm: number;
        precip_in: number;
        humidity: number;
        cloud: number;
        feelslike_c: number;
        feelslike_f: number;
        windchill_c: number;
        windchill_f: number;
        heatindex_c: number;
        heatindex_f: number;
        dewpoint_c: number;
        dewpoint_f: number;
        will_it_rain: number;
        chance_of_rain: number;
        will_it_snow: number;
        chance_of_snow: number;
        vis_km: number;
        vis_miles: number;
        gust_mph: number;
        gust_kph: number;
        uv: number;
      }>;
    }>;
  };
}

export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  description: string;
  icon: string;
  chanceOfRain: number;
  humidity: number;
  windSpeed: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon?: string;
  lastUpdated: string;
  uv?: number;
  feelsLike?: number;
  visibility?: number;
  forecast?: ForecastDay[];
  unit?: string;
  astro?: {
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    moon_phase: string;
    moon_illumination: string;
    is_moon_up?: number;
    is_sun_up?: number;
    planetary_positions?: Record<string, string>;
  };
}

export interface DeepSeekAnalysisRequest {
  plants: Plant[];
  weather: WeatherRecord[];
  activities: ActivityLog[];
  question?: string;
}

export interface DeepSeekAnalysisResponse {
  recommendations: Array<{
    type: string; // general, watering, fertilizing, pest_control, planting, harvesting, soil_management, permaculture_design, moon_phase_timing etc.
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    reasoning: string;
    confidence: number;
    plant_id?: string; // Optional: if the recommendation is specific to a plant
    timing?: string; // Optimal timing based on moon phase and astrological factors
    permaculture_principle?: string; // Which of the 12 permaculture principles this applies to
  }>;
  insights: {
    growth_trends: string[];
    weather_impacts: string[];
    health_observations: string[];
    astrological_influences: string[];
    permaculture_opportunities?: string[]; // Specific design improvements and system integrations
  };
  alerts: {
    type: 'warning' | 'info' | 'success';
    message: string;
    plant_id?: string;
  }[];
  moon_guidance?: string[]; // Specific lunar calendar advice for the next 7 days
  plant_astrology?: Array<{
    plant: string;
    astrological_profile: string;
    current_influence: string;
    recommendations: string[];
  }>; // Astrological readings for each plant type in the garden
}

// Form types
export interface PlantFormData {
  plant_type: string;
  variety?: string;
  planting_date: string;
  location: string;
  notes?: string;
  health_status: 'excellent' | 'good' | 'fair' | 'poor';
  stage: 'seed' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';
}

export interface ActivityFormData {
  plant_id?: string;
  type: 'watering' | 'pruning' | 'planting' | 'harvest' | 'observation' | 'fertilizing' | 'pest_control';
  description: string;
  location?: string;
  notes?: string;
}

// Dashboard analytics types
export interface DashboardStats {
  total_plants: number;
  active_plants: number;
  plants_needing_attention: number;
  recent_activities: number;
  average_health_score: number;
  next_harvest_days: number;
  weather_alerts: number;
}

export interface DailyWeatherTrend {
  date: string; // YYYY-MM-DD
  avg_temp: number | null;
  total_precip: number | null;
  avg_humidity: number | null;
}

export interface WeatherTrendData {
  period: string; // e.g., "last_7_days", "last_30_days"
  trends: DailyWeatherTrend[];
  summary?: {
    avg_temp_change?: number;
    total_precip_change?: number;
    avg_humidity_change?: number;
  };
}

// Define User type
export interface User {
  id: string;
  username: string;
  email?: string | null; // Make email explicitly optional or nullable
  password_hash: string; // This will not be sent to client
  created_at: Date;
  updated_at?: Date | null;
}

// For client-side User session data (omitting password_hash)
export interface SessionUser {
  id: string;
  username: string;
  email?: string | null;
} 