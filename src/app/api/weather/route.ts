import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { WeatherApiResponse, ForecastDay } from '@/types';
import { saveWeatherRecord } from '@/lib/database';

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
      forecast: forecast
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