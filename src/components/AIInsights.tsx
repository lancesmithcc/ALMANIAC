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

  // Helper function to get styling based on priority
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-500/10 text-red-400';
      case 'high': return 'border-orange-500 bg-orange-500/10 text-orange-400';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
      case 'low':
      default: return 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
    }
  };

  const renderRecommendations = () => {
    if (!analysisData?.analysis?.recommendations) return null;
    
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-emerald-400 mb-3">🌱 Recommendations</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {analysisData.analysis.recommendations.map((rec, index) => (
            <div 
              key={index} 
              className={`p-3 border rounded-lg ${getPriorityStyles(rec.priority)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-sm capitalize">
                  {rec.type.replace(/_/g, ' ')}
                </p>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm mb-2">{rec.description}</p>
              <p className="text-xs text-gray-400 mb-1">{rec.reasoning}</p>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Timing: {rec.timing}</span>
                <span className="text-gray-500">Confidence: {rec.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInsights = () => {
    if (!analysisData?.analysis?.insights) return null;
    
    const insights = analysisData.analysis.insights;
    
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-blue-400 mb-3">🔍 Garden Insights</h4>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
          {insights.growth_trends.length > 0 && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h5 className="font-medium text-blue-400 mb-2">Growth Trends</h5>
              <ul className="text-sm space-y-1">
                {insights.growth_trends.map((trend, index) => (
                  <li key={index} className="text-gray-300">• {trend}</li>
                ))}
              </ul>
            </div>
          )}
          
          {insights.permaculture_opportunities.length > 0 && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <h5 className="font-medium text-green-400 mb-2">Permaculture Opportunities</h5>
              <ul className="text-sm space-y-1">
                {insights.permaculture_opportunities.slice(0, 3).map((opp, index) => (
                  <li key={index} className="text-gray-300">• {opp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMoonGuidance = () => {
    if (!analysisData?.analysis?.moon_guidance) return null;
    
    return (
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-purple-400 mb-3">🌙 Lunar Guidance</h4>
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg max-h-32 overflow-y-auto">
          <ul className="text-sm space-y-1">
            {analysisData.analysis.moon_guidance.slice(0, 4).map((guidance, index) => (
              <li key={index} className="text-gray-300">• {guidance}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 md:p-6 rounded-xl border border-gray-700/50 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-emerald-400 flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          AI-Powered Insights
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
        <div className="space-y-6 overflow-y-auto flex-grow pr-1">
          {/* Metadata */}
          {analysisData.metadata && (
            <div className="text-xs text-gray-500 p-2 bg-gray-700/30 rounded border">
              <div className="flex justify-between">
                <span>Plants: {analysisData.metadata.plants_analyzed}</span>
                <span>AI Enhanced: {analysisData.metadata.ai_enhanced ? '✅' : '🔄'}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Weather: {analysisData.metadata.weather_records > 0 ? '✅' : '❌'}</span>
                <span>Moon Phase: {analysisData.metadata.moon_phase_included ? '🌙' : '❌'}</span>
              </div>
            </div>
          )}

          {/* Alerts */}
          {analysisData.analysis.alerts && analysisData.analysis.alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-orange-400">⚠️ Alerts</h4>
              {analysisData.analysis.alerts.map((alert, index) => (
                <div key={index} className="p-2 bg-orange-500/10 border border-orange-500/30 rounded text-sm">
                  {alert.message}
                </div>
              ))}
            </div>
          )}

          {renderRecommendations()}
          {renderInsights()}
          {renderMoonGuidance()}
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