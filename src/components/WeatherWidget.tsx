'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  Cloud, 
  CloudRain,
  MapPin,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { WeatherData } from '@/types';

interface WeatherWidgetProps {
  detailed?: boolean;
}

export default function WeatherWidget({ detailed = false }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationMethod, setLocationMethod] = useState<'gps' | 'ip' | 'manual'>('gps');
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [manualLocation, setManualLocation] = useState<string>('');

  const getUserLocation = useCallback((): Promise<{ lat: number; lon: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation not supported, falling back to IP location');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Got user location via GPS');
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error, falling back to IP location:', error.message);
          resolve(null);
        },
        {
          timeout: 10000,
          enableHighAccuracy: false
        }
      );
    });
  }, []);

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let locationParam = 'auto:ip';
      
      // Check for manual location first
      const savedLocation = localStorage.getItem('almaniac-location');
      if (savedLocation) {
        locationParam = savedLocation;
        setLocationMethod('manual');
      } else {
        // Try to get user's precise location
        const coords = await getUserLocation();
        if (coords) {
          locationParam = `${coords.lat},${coords.lon}`;
          setLocationMethod('gps');
        } else {
          setLocationMethod('ip');
        }
      }
      
      const response = await fetch(`/api/weather?location=${encodeURIComponent(locationParam)}&forecast=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to load weather data');
      // Show error instead of fallback mock data
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, [getUserLocation]);

  useEffect(() => {
    // Check if there's a saved manual location
    const savedLocation = localStorage.getItem('almaniac-location');
    if (savedLocation) {
      setManualLocation(savedLocation);
      setLocationMethod('manual');
    }
    fetchWeatherData();
  }, [fetchWeatherData]);

  const handleSaveLocation = () => {
    if (manualLocation.trim()) {
      localStorage.setItem('almaniac-location', manualLocation.trim());
      setLocationMethod('manual');
      setShowLocationSettings(false);
      fetchWeatherData();
    }
  };

  const handleUseAutoLocation = () => {
    localStorage.removeItem('almaniac-location');
    setManualLocation('');
    setLocationMethod('gps');
    setShowLocationSettings(false);
    fetchWeatherData();
  };

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return <Sun className="w-8 h-8 text-yellow-400" />;
    } else if (conditionLower.includes('cloud')) {
      return <Cloud className="w-8 h-8 text-gray-400" />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain className="w-8 h-8 text-blue-400" />;
    } else {
      return <Sun className="w-8 h-8 text-yellow-400" />;
    }
  };

  const getLocationBadge = () => {
    switch (locationMethod) {
      case 'gps':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
            📍 GPS Location
          </span>
        );
      case 'ip':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
            🌐 IP Location
          </span>
        );
      case 'manual':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
            📍 Manual Location
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            🌤️ Weather Status
          </h3>
          <button 
            onClick={fetchWeatherData}
            className="flex items-center space-x-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
        <div className="text-center py-4">
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-gray-500 text-sm">Weather data unavailable. Please check your connection.</p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            🌤️ Weather Status
          </h3>
          <button 
            onClick={fetchWeatherData}
            className="flex items-center space-x-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-400 mb-2">No weather data available</p>
          <p className="text-gray-500 text-sm">Unable to load weather information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          🌤️ Current Weather
        </h3>
        <div className="flex items-center space-x-3">
          {getLocationBadge()}
          <div className="flex items-center text-sm text-gray-400">
            <MapPin className="w-4 h-4 mr-1" />
            {weather?.location}
          </div>
          <button 
            onClick={() => setShowLocationSettings(true)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Location settings"
          >
            <MapPin className="w-4 h-4" />
          </button>
          <button 
            onClick={fetchWeatherData}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Refresh weather data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Location Settings Modal */}
      {showLocationSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-800">
            <h3 className="text-xl font-semibold mb-4">Weather Location Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Manual Location
                </label>
                <input
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter city, zip code, or coordinates"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Examples: &quot;New York&quot;, &quot;90210&quot;, &quot;40.7128,-74.0060&quot;
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSaveLocation}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Save Location
                </button>
                <button
                  onClick={handleUseAutoLocation}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Use Auto-Detect
                </button>
              </div>
              
              <button
                onClick={() => setShowLocationSettings(false)}
                className="w-full text-gray-400 hover:text-white transition-colors py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temperature */}
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Temperature</p>
              <p className="text-2xl font-bold text-orange-400">{weather?.temperature}°F</p>
              {weather?.feelsLike && (
                <p className="text-xs text-gray-500">Feels like {weather.feelsLike}°F</p>
              )}
            </div>
            <Thermometer className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Humidity</p>
              <p className="text-2xl font-bold text-blue-400">{weather?.humidity}%</p>
            </div>
            <Droplets className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        {/* Wind Speed */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Wind Speed</p>
              <p className="text-2xl font-bold text-emerald-400">{weather?.windSpeed} mph</p>
            </div>
            <Wind className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        {/* Condition */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Condition</p>
              <p className="text-sm font-medium text-purple-400">{weather?.description}</p>
            </div>
            {getWeatherIcon(weather?.condition || '')}
          </div>
        </div>
      </div>

      {/* Compact Forecast Preview (non-detailed view) */}
      {!detailed && weather?.forecast && weather.forecast.length > 0 && (
        <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Next 3 Days
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {weather.forecast.map((day, index) => {
              const date = new Date(day.date);
              const isToday = index === 0;
              const dayName = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
              
              return (
                <div key={day.date} className="text-center">
                  <p className="text-xs text-gray-500 mb-1">{dayName}</p>
                  <div className="flex justify-center mb-1">
                    {day.icon ? (
                      <img 
                        src={`https:${day.icon}`} 
                        alt={day.description}
                        className="w-6 h-6"
                      />
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center">
                        {getWeatherIcon(day.condition)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs">
                    <p className="text-white font-medium">{Math.round(day.maxTemp)}°</p>
                    <p className="text-gray-500">{Math.round(day.minTemp)}°</p>
                  </div>
                  <p className="text-xs text-blue-400 mt-1">{day.chanceOfRain}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {detailed && (
        <div className="mt-6 space-y-4">
          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {weather?.uv && (
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <p className="text-sm text-gray-400">UV Index</p>
                <p className="text-lg font-semibold text-yellow-400">{weather.uv}</p>
              </div>
            )}
            {weather?.visibility && (
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <p className="text-sm text-gray-400">Visibility</p>
                <p className="text-lg font-semibold text-cyan-400">{weather.visibility} mi</p>
              </div>
            )}
            <div className="p-4 bg-gray-800/30 rounded-lg">
              <p className="text-sm text-gray-400">Last Updated</p>
              <p className="text-lg font-semibold text-gray-300">{new Date(weather?.lastUpdated || '').toLocaleTimeString()}</p>
            </div>
          </div>
          
          {/* 3-Day Forecast */}
          {weather?.forecast && weather.forecast.length > 0 && (
            <div className="p-4 bg-gray-800/30 rounded-lg">
              <h4 className="font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                3-Day Forecast
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {weather.forecast.map((day, index) => {
                  const date = new Date(day.date);
                  const isToday = index === 0;
                  const dayName = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                  
                  return (
                    <div key={day.date} className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-300 mb-2">{dayName}</p>
                        <p className="text-xs text-gray-500 mb-3">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        
                        {/* Weather Icon */}
                        <div className="flex justify-center mb-3">
                          {day.icon ? (
                            <img 
                              src={`https:${day.icon}`} 
                              alt={day.description}
                              className="w-12 h-12"
                            />
                          ) : (
                            getWeatherIcon(day.condition)
                          )}
                        </div>
                        
                        {/* Temperature */}
                        <div className="mb-3">
                          <p className="text-lg font-bold text-white">
                            {Math.round(day.maxTemp)}°
                          </p>
                          <p className="text-sm text-gray-400">
                            {Math.round(day.minTemp)}°
                          </p>
                        </div>
                        
                        {/* Condition */}
                        <p className="text-xs text-gray-400 mb-3 leading-tight">
                          {day.description}
                        </p>
                        
                        {/* Details */}
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">💧 Rain:</span>
                            <span className="text-blue-400">{day.chanceOfRain}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">💨 Wind:</span>
                            <span className="text-emerald-400">{Math.round(day.windSpeed)} mph</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">💧 Humidity:</span>
                            <span className="text-cyan-400">{day.humidity}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Forecast unavailable message */}
          {weather?.forecast && weather.forecast.length === 0 && (
            <div className="p-4 bg-gray-800/30 rounded-lg text-center">
              <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Forecast data not available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 