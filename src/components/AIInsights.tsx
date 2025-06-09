'use client';

import React, { useState, useEffect } from 'react';
import { Brain, RefreshCw } from 'lucide-react';



interface AIAnalysisResponse {
  success: boolean;
  analysis?: {
    recommendations: Array<{
      type: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      description: string;
      reasoning: string;
      confidence: number;
      timing: string;
      permaculture_principle: string;
    }>;
    insights: {
      growth_trends: string[];
      weather_impacts: string[];
      health_observations: string[];
      permaculture_opportunities: string[];
      astrological_influences: string[];
    };
    alerts: Array<{
      type: string;
      message: string;
      plant_id?: string;
    }>;
    moon_guidance: string[];
    plant_astrology: Array<{
      plant: string;
      astrological_profile: string;
      current_influence: string;
      recommendations: string[];
    }>;
  };
  metadata?: {
    plants_analyzed: number;
    weather_records: number;
    activities_reviewed: number;
    moon_phase_included: boolean;
    ai_enhanced: boolean;
    timestamp: string;
  };
  error?: string;
}

const AIInsights: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<AIAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First, trigger a new AI analysis
      console.log('Triggering AI analysis...');
      const analysisResponse = await fetch('/api/ai/analyze', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'Provide comprehensive insights for my garden',
          includeWeather: true,
          includeActivities: true
        })
      });
      
      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || 'Failed to generate AI analysis');
      }
      
      const analysisResult = await analysisResponse.json();
      console.log('AI analysis completed:', analysisResult);
      
      if (analysisResult.success && analysisResult.analysis) {
        setAnalysisData(analysisResult);
      } else {
        throw new Error(analysisResult.error || 'Failed to parse AI analysis');
      }
    } catch (err) {
      console.error('Error fetching Insights:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setAnalysisData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);



  const renderContent = () => {
    if (!analysisData?.analysis) return null;

    const { recommendations, insights, alerts, moon_guidance } = analysisData.analysis;
    const allContent = [];

    // Add alerts first (highest priority)
    if (alerts && alerts.length > 0) {
      allContent.push({
        type: 'alerts',
        title: '⚠️ Urgent Alerts',
        color: 'orange',
        items: alerts.map(alert => alert.message)
      });
    }

    // Add high priority recommendations
    const urgentRecs = recommendations?.filter(r => r.priority === 'urgent' || r.priority === 'high') || [];
    if (urgentRecs.length > 0) {
      allContent.push({
        type: 'urgent_recommendations',
        title: '🚨 Priority Actions',
        color: 'red',
        items: urgentRecs.map(rec => `${rec.description} (${rec.timing})`)
      });
    }

    // Add moon guidance
    if (moon_guidance && moon_guidance.length > 0) {
      allContent.push({
        type: 'moon_guidance',
        title: '🌙 Lunar Calendar',
        color: 'purple',
        items: moon_guidance.slice(0, 3)
      });
    }

    // Add growth trends
    if (insights?.growth_trends && insights.growth_trends.length > 0) {
      allContent.push({
        type: 'growth_trends',
        title: '📈 Garden Status',
        color: 'blue',
        items: insights.growth_trends.slice(0, 4)
      });
    }

    // Add permaculture opportunities
    if (insights?.permaculture_opportunities && insights.permaculture_opportunities.length > 0) {
      allContent.push({
        type: 'permaculture',
        title: '🌿 Permaculture Tips',
        color: 'green',
        items: insights.permaculture_opportunities.slice(0, 3)
      });
    }

    // Add medium/low priority recommendations
    const normalRecs = recommendations?.filter(r => r.priority === 'medium' || r.priority === 'low') || [];
    if (normalRecs.length > 0) {
      allContent.push({
        type: 'recommendations',
        title: '💡 Suggestions',
        color: 'emerald',
        items: normalRecs.slice(0, 4).map(rec => `${rec.description} (${rec.timing})`)
      });
    }

    // Add weather impacts
    if (insights?.weather_impacts && insights.weather_impacts.length > 0) {
      allContent.push({
        type: 'weather',
        title: '🌤️ Weather Insights',
        color: 'cyan',
        items: insights.weather_impacts.slice(0, 3)
      });
    }

    return allContent;
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'orange': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'yellow': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'emerald': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'green': return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'blue': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'cyan': return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
      case 'purple': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default: return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 md:p-6 rounded-xl border border-gray-700/50 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-emerald-400 flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          Insights
        </h3>
        <button
          onClick={fetchInsights}
          disabled={isLoading}
          className="text-sm text-emerald-400 hover:text-emerald-300 disabled:opacity-50 flex items-center transition-colors"
          title="Refresh Insights"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="text-center py-4">
          <p className="text-red-400 text-sm mb-2">Error: {error}</p>
          <button 
            onClick={fetchInsights}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && !analysisData && (
        <div className="text-center text-gray-400 py-6 flex-grow flex flex-col justify-center items-center">
          <Brain className="w-12 h-12 text-gray-600 mb-3" />
          <p>No Insights available at the moment.</p>
          <p className="text-xs text-gray-500">Try refreshing or add some plant data.</p>
        </div>
      )}

      {!error && analysisData?.analysis && (
        <div className="space-y-4 flex-grow">
          {/* Metadata */}
          {analysisData.metadata && (
            <div className="text-xs text-gray-500 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <div className="flex justify-between items-center">
                <span>🌱 Plants: {analysisData.metadata.plants_analyzed}</span>
                <span>🤖 AI Enhanced: {analysisData.metadata.ai_enhanced ? '✅' : '🔄'}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span>🌤️ Weather: {analysisData.metadata.weather_records > 0 ? '✅' : '❌'}</span>
                <span>🌙 Moon Phase: {analysisData.metadata.moon_phase_included ? '✅' : '❌'}</span>
              </div>
            </div>
          )}

          {/* Sequential Content */}
          {renderContent()?.map((section, index) => (
            <div key={index} className={`p-4 border rounded-lg ${getColorClasses(section.color)}`}>
              <h4 className="font-semibold mb-3">{section.title}</h4>
              <div className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="text-sm text-gray-200 leading-relaxed">
                    • {item}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* No content message */}
          {(renderContent()?.length || 0) === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Brain className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p>No specific insights available yet.</p>
              <p className="text-xs text-gray-500 mt-1">Add some plants to get personalized recommendations!</p>
            </div>
          )}
        </div>
      )}
      
      {isLoading && !error && (
        <div className="space-y-3 pt-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 border border-gray-700 rounded-lg animate-pulse bg-gray-700/50">
              <div className="h-4 bg-gray-600 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-full"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIInsights; 