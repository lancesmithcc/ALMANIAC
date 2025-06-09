import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { WeatherApiResponse, ForecastDay } from '@/types';
import { saveWeatherRecord } from '@/lib/database';
import { WeatherRecord } from '@/types';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    const unit = searchParams.get('unit') || 'celsius'; // Default to celsius
    
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      // Return mock weather data when API key is not configured
      console.log('Weather API key not configured, returning mock data');
      const mockWeatherData = {
        location: 'Mock Location',
        temperature: 22,
        humidity: 65,
        windSpeed: 8,
        precipitation: 0,
        condition: 'partly-cloudy',
        description: 'Partly Cloudy',
        icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
        lastUpdated: new Date().toISOString(),
        uv: 5,
        feelsLike: 24,
        visibility: 10,
        forecast: [
          {
            date: new Date().toISOString().split('T')[0],
            maxTemp: 25,
            minTemp: 18,
            condition: 'partly-cloudy',
            description: 'Partly Cloudy',
            icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
            chanceOfRain: 20,
            humidity: 65,
            windSpeed: 8
          },
          {
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            maxTemp: 27,
            minTemp: 19,
            condition: 'sunny',
            description: 'Sunny',
            icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
            chanceOfRain: 10,
            humidity: 60,
            windSpeed: 6
          },
          {
            date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
            maxTemp: 23,
            minTemp: 16,
            condition: 'cloudy',
            description: 'Cloudy',
            icon: '//cdn.weatherapi.com/weather/64x64/day/119.png',
            chanceOfRain: 40,
            humidity: 70,
            windSpeed: 10
          }
        ],
        unit: unit
      };
      
      return NextResponse.json(mockWeatherData);
    }

    // Construct API URL with forecast if requested
    const baseUrl = 'https://api.weatherapi.com/v1';
    const endpoint = includeForecast ? 'forecast.json' : 'current.json';
    const forecastDays = includeForecast ? '&days=3' : '';
    const apiUrl = `${baseUrl}/${endpoint}?key=${apiKey}&q=${location}&aqi=no${forecastDays}`;

    // Fetch weather data from WeatherAPI.com
    const response = await axios.get<WeatherApiResponse>(apiUrl);
    const weatherData = response.data;
    
    // Helper function to get temperature based on unit preference
    const getTemp = (tempC: number, tempF: number) => unit === 'fahrenheit' ? tempF : tempC;
    const getSpeed = (mph: number, kph: number) => unit === 'fahrenheit' ? mph : kph;
    const getDistance = (miles: number, km: number) => unit === 'fahrenheit' ? miles : km;
    const getPrecip = (inches: number, mm: number) => unit === 'fahrenheit' ? inches : mm;

    // Save weather record to database (always save in the user's preferred unit)
    try {
      await saveWeatherRecord({
        location: `${weatherData.location.name}, ${weatherData.location.region}`,
        temperature: getTemp(weatherData.current.temp_c, weatherData.current.temp_f),
        humidity: weatherData.current.humidity,
        wind_speed: getSpeed(weatherData.current.wind_mph, weatherData.current.wind_kph),
        precipitation: getPrecip(weatherData.current.precip_in, weatherData.current.precip_mm),
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
        maxTemp: getTemp(day.day.maxtemp_c, day.day.maxtemp_f),
        minTemp: getTemp(day.day.mintemp_c, day.day.mintemp_f),
        condition: day.day.condition.text.toLowerCase().replace(/\s+/g, '-'),
        description: day.day.condition.text,
        icon: day.day.condition.icon,
        chanceOfRain: day.day.daily_chance_of_rain,
        humidity: day.day.avghumidity,
        windSpeed: getSpeed(day.day.maxwind_mph, day.day.maxwind_kph)
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
      temperature: getTemp(weatherData.current.temp_c, weatherData.current.temp_f),
      humidity: weatherData.current.humidity,
      windSpeed: getSpeed(weatherData.current.wind_mph, weatherData.current.wind_kph),
      precipitation: getPrecip(weatherData.current.precip_in, weatherData.current.precip_mm),
      condition: weatherData.current.condition.text.toLowerCase().replace(/\s+/g, '-'),
      description: weatherData.current.condition.text,
      icon: weatherData.current.condition.icon,
      lastUpdated: weatherData.current.last_updated,
      uv: weatherData.current.uv,
      feelsLike: getTemp(weatherData.current.feelslike_c, weatherData.current.feelslike_f),
      visibility: getDistance(weatherData.current.vis_miles, weatherData.current.vis_km),
      forecast: forecast,
      astro: astroData,
      unit: unit // Include the unit in the response
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.location || typeof body.temperature !== 'number' || typeof body.humidity !== 'number' || typeof body.wind_speed !== 'number' || !body.condition) {
      return NextResponse.json({ error: 'Missing required fields or invalid data types' }, { status: 400 });
    }

    const weatherRecord: Omit<WeatherRecord, 'id' | 'created_at'> = {
      location: body.location,
      user_id: session.user.id,
      temperature: body.temperature,
      humidity: body.humidity,
      wind_speed: body.wind_speed,
      precipitation: body.precipitation || 0,
      condition: body.condition,
      description: body.description || '',
      recorded_at: body.recorded_at ? new Date(body.recorded_at) : new Date(),
    };

    const recordId = await saveWeatherRecord(weatherRecord);
    return NextResponse.json({ success: true, id: recordId, message: 'Weather record created' });
  } catch (error) {
    console.error('Error saving weather data:', error);
    return NextResponse.json(
      { error: 'Failed to save weather data' },
      { status: 500 }
    );
  }
} 