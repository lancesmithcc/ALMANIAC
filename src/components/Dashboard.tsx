'use client';

import { useState, useEffect } from 'react';
import { 
  CloudRain, 
  Sprout, 
  TrendingUp, 
  Calendar,
  Brain,
  RefreshCw
} from 'lucide-react';
import WeatherWidget from './WeatherWidget';
import PlantEntryForm from '@/components/PlantEntryForm';
import AnalyticsCards from '@/components/AnalyticsCards';
import RecentEntries from '@/components/RecentEntries';
import WeatherTrendsChart from '@/components/WeatherTrendsChart';
import { AIRecommendation } from '@/types';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [loadingAI, setLoadingAI] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchAIRecommendations();
    }
  }, [activeTab]);

  const fetchAIRecommendations = async () => {
    try {
      setLoadingAI(true);
      setAiError(null);
      
      // First trigger new analysis
      const analysisResponse = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: "Provide permaculture tips and recommendations based on my current garden conditions.",
          includeWeather: true,
          includeActivities: true
        })
      });
      
      if (!analysisResponse.ok) {
        throw new Error('Failed to generate AI analysis');
      }
      
      // Then get saved recommendations
      const response = await fetch('/api/ai/analyze');
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI recommendations');
      }
      
      const data = await response.json();
      if (data.success) {
        setAiRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
      setAiError('Failed to load AI insights');
    } finally {
      setLoadingAI(false);
    }
  };

  const generateNewInsights = async () => {
    try {
      setLoadingAI(true);
      setAiError(null);
      
      // Trigger new AI analysis
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: "Provide fresh permaculture tips and sustainable farming recommendations based on my current garden conditions, weather, and lunar phase.",
          includeWeather: true,
          includeActivities: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }
      
      // Fetch updated recommendations
      await fetchAIRecommendations();
    } catch (err) {
      console.error('Error generating insights:', err);
      setAiError('Failed to generate new insights');
      setLoadingAI(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'high':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'medium':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'low':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '💡';
      case 'low': return 'ℹ️';
      default: return '📝';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'watering': return '💧';
      case 'fertilizing': return '🌿';
      case 'pest_control': return '🛡️';
      case 'harvesting': return '🌾';
      case 'general': return '🧠';
      default: return '📝';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <Sprout className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Almaniac
                </h1>
                <p className="text-sm text-gray-400">Smart Farming Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Welcome back! 👋</p>
                <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-gray-800/50 bg-gray-950/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'plants', label: 'Plants & Land', icon: Sprout },
              { id: 'weather', label: 'Weather', icon: CloudRain },
              { id: 'analytics', label: 'Analytics', icon: Calendar },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Weather Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WeatherWidget />
              </div>
              <div className="space-y-6">
                <AnalyticsCards />
              </div>
            </div>

            {/* Recent Activity and AI Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentEntries />
              
              {/* AI Insights */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    🌱 Permaculture Tips
                  </h3>
                  <button 
                    onClick={generateNewInsights}
                    disabled={loadingAI}
                    className="flex items-center space-x-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAI ? 'animate-spin' : ''}`} />
                    <span>{loadingAI ? 'Generating tips...' : 'New Tips'}</span>
                  </button>
                </div>
                
                {loadingAI ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-4 bg-gray-800/30 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                ) : aiError ? (
                  <div className="text-center py-4">
                    <p className="text-orange-400 mb-2">{aiError}</p>
                    <button 
                      onClick={fetchAIRecommendations}
                      className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : aiRecommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">No permaculture tips available</p>
                    <p className="text-gray-500 text-sm">Add some plants and activities to get personalized permaculture recommendations</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {aiRecommendations.slice(0, 3).map((rec) => (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{getPriorityEmoji(rec.priority)}</span>
                            <span className="text-sm">{getTypeEmoji(rec.type)}</span>
                            <p className="text-sm font-medium capitalize">
                              {rec.type.replace('_', ' ')} • {rec.priority}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {rec.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          {rec.recommendation}
                        </p>
                        {rec.expires_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Expires: {new Date(rec.expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                    
                    {aiRecommendations.length > 3 && (
                      <div className="text-center pt-2">
                        <p className="text-xs text-gray-500">
                          +{aiRecommendations.length - 3} more recommendations available
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plants' && (
          <div className="space-y-8">
            <PlantEntryForm />
          </div>
        )}

        {activeTab === 'weather' && (
          <div className="space-y-8">
            <WeatherWidget detailed />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-white">Farm Analytics</h2>
            
            {/* Placeholder for other analytics sections if any */}
            {/* For example, overall farm health, yield predictions, etc. */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800/50">
                <h3 className="text-lg font-medium text-emerald-400 mb-3">Overall Farm Health</h3>
                 Content 
              </div>
              <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800/50">
                <h3 className="text-lg font-medium text-emerald-400 mb-3">Yield Projections</h3>
                 Content 
              </div>
            </div> */}

            <WeatherTrendsChart />

            <div className="text-center py-12 mt-8 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50">
              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">More Analytics Coming Soon</h3>
              <p className="text-gray-500">We are working on providing more detailed insights into your farm&apos;s performance.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 