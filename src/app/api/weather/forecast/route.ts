import { NextResponse } from 'next/server';

interface WeatherForecast {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  description: string;
}

export async function GET() {
  try {
    // For now, generate realistic mock data
    // In production, this would call a real weather API like OpenWeatherMap
    const forecast = generateRealisticForecast();
    
    return NextResponse.json({
      success: true,
      forecast
    });
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather forecast' },
      { status: 500 }
    );
  }
}

function generateRealisticForecast(): WeatherForecast[] {
  const today = new Date();
  const days = ['Today', 'Tomorrow', 'Day 3'];
  
  // Base weather on current season
  const month = today.getMonth();
  let baseTemp = 70;
  let basePrecipitation = 20;
  
  // Seasonal adjustments
  if (month >= 11 || month <= 2) { // Winter
    baseTemp = 45;
    basePrecipitation = 30;
  } else if (month >= 3 && month <= 5) { // Spring
    baseTemp = 65;
    basePrecipitation = 40;
  } else if (month >= 6 && month <= 8) { // Summer
    baseTemp = 80;
    basePrecipitation = 15;
  } else { // Fall
    baseTemp = 60;
    basePrecipitation = 25;
  }
  
  return days.map((day, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    
    // Add some realistic variation
    const tempVariation = (Math.random() - 0.5) * 20;
    const high = Math.round(baseTemp + tempVariation + 8);
    const low = Math.round(baseTemp + tempVariation - 8);
    
    // Weather conditions based on temperature and season
    const precipChance = basePrecipitation + (Math.random() - 0.5) * 30;
    let condition: string;
    
    if (precipChance > 60) {
      condition = 'rainy';
    } else if (precipChance > 40) {
      condition = 'cloudy';
    } else if (precipChance > 20) {
      condition = 'partly-cloudy';
    } else {
      condition = 'sunny';
    }
    
    return {
      date: date.toISOString().split('T')[0],
      day,
      high: Math.max(high, low + 5), // Ensure high > low
      low,
      condition,
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(3 + Math.random() * 12),
      precipitation: condition === 'rainy' ? Math.round(precipChance) : Math.round(precipChance * 0.3),
      description: getWeatherDescription(condition, high)
    };
  });
}

function getWeatherDescription(condition: string, temp: number): string {
  const tempDesc = temp > 80 ? 'warm' : temp > 60 ? 'mild' : temp > 40 ? 'cool' : 'cold';
  
  switch (condition) {
    case 'sunny':
      return `Clear and ${tempDesc}`;
    case 'partly-cloudy':
      return `Partly cloudy, ${tempDesc}`;
    case 'cloudy':
      return `Overcast and ${tempDesc}`;
    case 'rainy':
      return `Rain expected, ${tempDesc}`;
    default:
      return `Variable conditions, ${tempDesc}`;
  }
} 