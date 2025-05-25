import { NextRequest, NextResponse } from 'next/server';
import { getWeatherTrends } from '@/lib/database';
import { DailyWeatherTrend, WeatherTrendData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || '30'; // Default to 30 days
    let days: 7 | 30 | 90;

    switch (periodParam) {
      case '7':
        days = 7;
        break;
      case '90':
        days = 90;
        break;
      case '30':
      default:
        days = 30;
        break;
    }

    const trends: DailyWeatherTrend[] = await getWeatherTrends(days);
    
    const responseData: WeatherTrendData = {
      period: `last_${days}_days`,
      trends,
      // Summary could be calculated here if needed
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching weather trends API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather trend data' },
      { status: 500 }
    );
  }
} 