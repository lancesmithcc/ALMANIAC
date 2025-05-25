import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { WeatherApiResponse, ForecastDay } from '@/types';
import { saveWeatherRecord } from '@/lib/database';

// Helper function to determine zodiac sign based on planet position
// In a real implementation, this would fetch data from an astrological API
function getCurrentZodiacSign(planet: string): string {
  // This is a simplified mock implementation that returns different 
  // zodiac signs based on the current date and planet
  const date = new Date();
  const month = date.getMonth(); // 0-11
  
  // Different offsets for different planets to simulate varying positions
  const offsets: Record<string, number> = {
    sun: 0,
    moon: 2,
    mercury: 1,
    venus: 3,
    mars: 5,
    jupiter: 8,
    saturn: 10,
    uranus: 7,
    neptune: 11,
    pluto: 9
  };
  
  // Add the offset to the current month (modulo 12 to wrap around)
  const adjustedMonth = (month + (offsets[planet] || 0)) % 12;
  
  // Zodiac signs mapped to month ranges (simplified)
  const zodiacSigns = [
    "Capricorn", // Jan
    "Aquarius",  // Feb
    "Pisces",    // Mar
    "Aries",     // Apr
    "Taurus",    // May
    "Gemini",    // Jun
    "Cancer",    // Jul
    "Leo",       // Aug
    "Virgo",     // Sep
    "Libra",     // Oct
    "Scorpio",   // Nov
    "Sagittarius" // Dec
  ];
  
  return zodiacSigns[adjustedMonth];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || 'auto:ip';
    const includeForecast = searchParams.get('forecast') !== 'false'; // Default to true
    
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Weather API key not configured' },
        { status: 500 }
      );
    }

    // Construct API URL with forecast if requested
    const baseUrl = 'https://api.weatherapi.com/v1';
    const endpoint = includeForecast ? 'forecast.json' : 'current.json';
    const forecastDays = includeForecast ? '&days=3' : '';
    const apiUrl = `${baseUrl}/${endpoint}?key=${apiKey}&q=${location}&aqi=no${forecastDays}`;

    // Fetch weather data from WeatherAPI.com
    const response = await axios.get<WeatherApiResponse>(apiUrl);
    const weatherData = response.data;
    
    // Save weather record to database
    try {
      await saveWeatherRecord({
        location: `${weatherData.location.name}, ${weatherData.location.region}`,
        temperature: weatherData.current.temp_f,
        humidity: weatherData.current.humidity,
        wind_speed: weatherData.current.wind_mph,
        precipitation: weatherData.current.precip_in,
        condition: weatherData.current.condition.text,
        description: weatherData.current.condition.text,
        recorded_at: new Date(weatherData.current.last_updated)
      });
    } catch (dbError) {
      console.error('Failed to save weather data to database:', dbError);
      // Continue even if database save fails
    }

    // Process forecast data if available
    let forecast: ForecastDay[] = [];
    if (weatherData.forecast && weatherData.forecast.forecastday) {
      forecast = weatherData.forecast.forecastday.map(day => ({
        date: day.date,
        maxTemp: day.day.maxtemp_f,
        minTemp: day.day.mintemp_f,
        condition: day.day.condition.text.toLowerCase().replace(/\s+/g, '-'),
        description: day.day.condition.text,
        icon: day.day.condition.icon,
        chanceOfRain: day.day.daily_chance_of_rain,
        humidity: day.day.avghumidity,
        windSpeed: day.day.maxwind_mph
      }));
    }

    // Fetch planetary positions from an external API
    let planetaryPositions = null;
    try {
      // Note: In a real implementation, you would fetch this from an astrology API
      // For this example, we're creating mock data
      planetaryPositions = {
        sun: getCurrentZodiacSign("sun"),
        moon: getCurrentZodiacSign("moon"),
        mercury: getCurrentZodiacSign("mercury"),
        venus: getCurrentZodiacSign("venus"),
        mars: getCurrentZodiacSign("mars"),
        jupiter: getCurrentZodiacSign("jupiter"),
        saturn: getCurrentZodiacSign("saturn"),
        uranus: getCurrentZodiacSign("uranus"),
        neptune: getCurrentZodiacSign("neptune"),
        pluto: getCurrentZodiacSign("pluto")
      };
    } catch (astroError) {
      console.error('Failed to fetch planetary positions:', astroError);
      // We'll still continue even if astrology data fails
    }

    // Create astro data with planetary positions
    const astroData = weatherData.forecast?.forecastday[0]?.astro 
      ? {
          ...weatherData.forecast.forecastday[0].astro,
          planetary_positions: planetaryPositions
        } 
      : undefined;

    // Return formatted weather data
    return NextResponse.json({
      location: `${weatherData.location.name}, ${weatherData.location.region}`,
      temperature: weatherData.current.temp_f,
      humidity: weatherData.current.humidity,
      windSpeed: weatherData.current.wind_mph,
      precipitation: weatherData.current.precip_in,
      condition: weatherData.current.condition.text.toLowerCase().replace(/\s+/g, '-'),
      description: weatherData.current.condition.text,
      icon: weatherData.current.condition.icon,
      lastUpdated: weatherData.current.last_updated,
      uv: weatherData.current.uv,
      feelsLike: weatherData.current.feelslike_f,
      visibility: weatherData.current.vis_miles,
      forecast: forecast,
      astro: astroData
    });

  } catch (error) {
    console.error('Weather API error:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || 'Failed to fetch weather data';
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, temperature, humidity, wind_speed, precipitation, condition, description } = body;

    // Validate required fields
    if (!location || temperature === undefined || humidity === undefined || wind_speed === undefined) {
      return NextResponse.json(
        { error: 'Missing required weather data fields' },
        { status: 400 }
      );
    }

    // Save manual weather entry to database
    const weatherRecord = await saveWeatherRecord({
      location,
      temperature,
      humidity,
      wind_speed,
      precipitation: precipitation || 0,
      condition: condition || 'manual-entry',
      description: description || 'Manual weather entry',
      recorded_at: new Date()
    });

    return NextResponse.json({
      success: true,
      id: weatherRecord,
      message: 'Weather data saved successfully'
    });

  } catch (error) {
    console.error('Error saving weather data:', error);
    return NextResponse.json(
      { error: 'Failed to save weather data' },
      { status: 500 }
    );
  }
} 