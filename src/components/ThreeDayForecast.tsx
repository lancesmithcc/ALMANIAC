'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, Eye } from 'lucide-react';

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

interface ThreeDayForecastProps {
  expanded?: boolean;
}

const ThreeDayForecast: React.FC<ThreeDayForecastProps> = ({ expanded = false }) => {
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getWeatherDescription = (condition: string): string => {
    switch (condition) {
      case 'sunny': return 'Clear and sunny';
      case 'partly-cloudy': return 'Partly cloudy';
      case 'cloudy': return 'Overcast';
      case 'rainy': return 'Rain expected';
      default: return 'Variable conditions';
    }
  };

  const generateMockForecast = useCallback((): WeatherForecast[] => {
    const today = new Date();
    const days = ['Today', 'Tomorrow', 'Day 3'];
    
    return days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      
      // Generate realistic weather data
      const baseTemp = 72;
      const tempVariation = Math.random() * 20 - 10;
      const high = Math.round(baseTemp + tempVariation + 5);
      const low = Math.round(baseTemp + tempVariation - 5);
      
      const conditions = ['sunny', 'partly-cloudy', 'cloudy', 'rainy'];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      return {
        date: date.toISOString().split('T')[0],
        day,
        high,
        low,
        condition,
        humidity: Math.round(40 + Math.random() * 40),
        windSpeed: Math.round(5 + Math.random() * 15),
        precipitation: condition === 'rainy' ? Math.round(Math.random() * 50) : 0,
        description: getWeatherDescription(condition)
      };
    });
  }, []);

  const fetchForecast = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/weather/forecast');
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast');
      }
      
      const data = await response.json();
      if (data.success) {
        setForecast(data.forecast);
      }
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError('Failed to load forecast');
      // Fallback to mock data for now
      setForecast(generateMockForecast());
    } finally {
      setLoading(false);
    }
  }, [generateMockForecast]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-6 h-6 text-yellow-400" />;
      case 'partly-cloudy':
        return <Cloud className="w-6 h-6 text-gray-400" />;
      case 'cloudy':
        return <Cloud className="w-6 h-6 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="w-6 h-6 text-blue-400" />;
      case 'snow':
        return <CloudSnow className="w-6 h-6 text-blue-200" />;
      default:
        return <Cloud className="w-6 h-6 text-gray-400" />;
    }
  };

  const getGardeningAdvice = (forecast: WeatherForecast[]): string => {
    const today = forecast[0];
    if (!today) return "Check weather conditions before gardening.";
    
    if (today.condition === 'rainy') {
      return "🌧️ Great day for indoor plant care - avoid watering outdoor plants.";
    } else if (today.high > 85) {
      return "🌡️ Hot day ahead - water early morning or evening, provide shade.";
    } else if (today.high < 50) {
      return "🥶 Cool weather - protect sensitive plants, delay planting.";
    } else if (today.condition === 'sunny') {
      return "☀️ Perfect gardening weather - ideal for planting and maintenance.";
    }
    return "🌱 Good conditions for most garden activities.";
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          🌤️ 3-Day Forecast
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-700 rounded"></div>
                <div>
                  <div className="h-4 bg-gray-700 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-700 rounded w-12"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-700 rounded w-12 mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-8"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && forecast.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          🌤️ 3-Day Forecast
        </h3>
        <div className="text-center py-4">
          <p className="text-orange-400 mb-2">{error}</p>
          <button 
            onClick={fetchForecast}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          🌤️ 3-Day Forecast
        </h3>
        <button 
          onClick={fetchForecast}
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {forecast.map((day, index) => (
          <div
            key={day.date}
            className={`p-4 rounded-lg transition-colors ${
              index === 0 
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-gray-800/30 hover:bg-gray-800/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getWeatherIcon(day.condition)}
                <div>
                  <p className="font-medium text-white">{day.day}</p>
                  <p className="text-sm text-gray-400">{day.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-white">{day.high}°</span>
                  <span className="text-sm text-gray-400">{day.low}°</span>
                </div>
                {day.precipitation > 0 && (
                  <p className="text-xs text-blue-400">{day.precipitation}% rain</p>
                )}
              </div>
            </div>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-gray-700/50">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400">{day.humidity}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wind className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">{day.windSpeed} mph</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Clear</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gardening Advice */}
      <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <p className="text-sm text-emerald-400 font-medium">🌱 Garden Tip</p>
        <p className="text-sm text-gray-300 mt-1">{getGardeningAdvice(forecast)}</p>
      </div>
    </div>
  );
};

export default ThreeDayForecast; 