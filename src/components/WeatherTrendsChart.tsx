'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { WeatherTrendData, DailyWeatherTrend } from '@/types';
import { Loader2, AlertTriangle, Thermometer, Droplets, CloudRain } from 'lucide-react';

interface WeatherTrendsChartProps {
  initialPeriod?: '7' | '30' | '90';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-3 rounded-lg shadow-lg">
        <p className="label text-sm text-gray-300">{`${label}`}</p>
        {payload.map((pld: any) => (
          <div key={pld.dataKey} style={{ color: pld.color }} className="text-xs flex items-center">
            {pld.dataKey === 'avg_temp' && <Thermometer className="w-3 h-3 mr-1" />}
            {pld.dataKey === 'total_precip' && <CloudRain className="w-3 h-3 mr-1" />}
            {pld.dataKey === 'avg_humidity' && <Droplets className="w-3 h-3 mr-1" />}
            {`${pld.name}: ${pld.value.toFixed(1)}${pld.dataKey === 'avg_temp' ? '°F' : pld.dataKey === 'total_precip' ? 'in' : '%'}`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function WeatherTrendsChart({ initialPeriod = '30' }: WeatherTrendsChartProps) {
  const [trendData, setTrendData] = useState<WeatherTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7' | '30' | '90'>(initialPeriod);

  useEffect(() => {
    fetchTrendData(period);
  }, [period]);

  const fetchTrendData = async (currentPeriod: '7' | '30' | '90') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/weather/trends?period=${currentPeriod}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch weather trends');
      }
      const data: WeatherTrendData = await response.json();
      setTrendData(data);
    } catch (err) {
      console.error('Error fetching weather trends:', err);
      setError(err instanceof Error ? err.message : 'Could not load weather trends.');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: '7' | '30' | '90') => {
    setPeriod(newPeriod);
  };
  
  const formatXAxis = (tickItem: string) => {
    // Format date as MM/DD
    const date = new Date(tickItem + 'T00:00:00'); // Ensure correct parsing as local date
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
        <p className="ml-3 text-gray-300">Loading weather trends...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-red-900/10 backdrop-blur-sm rounded-xl p-6 border border-red-800/50">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-400 mb-2">Error loading weather trends</p>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={() => fetchTrendData(period)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!trendData || trendData.trends.length === 0) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <Droplets className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-gray-400">No weather trend data available for the selected period.</p>
        <p className="text-gray-500 text-sm">Try a different period or check back later if new data is expected.</p>
      </div>
    );
  }
  
  const { trends } = trendData;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 sm:mb-0">Weather Trends</h3>
        <div className="flex space-x-2">
          {(['7', '30', '90'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
                ${period === p 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'}
              `}
            >
              Last {p} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Temperature Chart */}
        <div className="h-80">
          <h4 className="text-md font-medium text-emerald-400 mb-2 text-center">Average Temperature (°F)</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" tickFormatter={formatXAxis} fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}/>
              <Legend wrapperStyle={{ fontSize: '12px' }}/>
              <Line type="monotone" dataKey="avg_temp" name="Avg Temp" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Precipitation Chart */}
        <div className="h-80">
          <h4 className="text-md font-medium text-emerald-400 mb-2 text-center">Total Precipitation (in)</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" tickFormatter={formatXAxis} fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}/>
              <Legend wrapperStyle={{ fontSize: '12px' }}/>
              <Bar dataKey="total_precip" name="Precipitation" fill="#60a5fa" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Humidity Chart (optional, could be added below or as another tab) */}
      <div className="mt-8 h-80">
        <h4 className="text-md font-medium text-emerald-400 mb-2 text-center">Average Humidity (%)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" tickFormatter={formatXAxis} fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}/>
            <Legend wrapperStyle={{ fontSize: '12px' }}/>
            <Line type="monotone" dataKey="avg_humidity" name="Avg Humidity" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 