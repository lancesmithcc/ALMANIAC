'use client';

import React, { useState, useEffect } from 'react';
import { Brain, RefreshCw } from 'lucide-react';
import { AIRecommendation } from '@/types'; // Assuming you might use this type

const AIInsights: React.FC = () => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First, optionally trigger a new analysis if your backend supports it easily
      // For now, we'll assume new analysis is triggered elsewhere or not needed every time.
      // const analysisResponse = await fetch('/api/ai/analyze', { method: 'POST' });
      // if (!analysisResponse.ok) throw new Error('Failed to trigger AI analysis');

      // Then, fetch active recommendations
      const res = await fetch('/api/ai/analyze'); // GET request
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch AI insights');
      }
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations || []);
      } else {
        throw new Error(data.error || 'Failed to parse AI insights');
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setRecommendations([]); // Clear recommendations on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // Helper function to get styling based on priority
  const getPriorityStyles = (priority: AIRecommendation['priority']) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-500/10 text-red-400';
      case 'high': return 'border-orange-500 bg-orange-500/10 text-orange-400';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
      case 'low':
      default: return 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
    }
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
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="text-center py-4">
          <p className="text-red-400 text-sm">Error: {error}</p>
        </div>
      )}

      {!isLoading && !error && recommendations.length === 0 && (
        <div className="text-center text-gray-400 py-6 flex-grow flex flex-col justify-center items-center">
          <Brain className="w-12 h-12 text-gray-600 mb-3" />
          <p>No active AI recommendations at the moment.</p>
          <p className="text-xs text-gray-500">Try again later or ensure you have some plant data.</p>
        </div>
      )}

      {!error && recommendations.length > 0 && (
        <div className="space-y-3 overflow-y-auto flex-grow pr-1">
          {recommendations.map((rec) => (
            <div 
              key={rec.id} 
              className={`p-3 border rounded-lg ${getPriorityStyles(rec.priority)}`}
            >
              <p className="font-medium text-sm capitalize">
                {rec.type.replace(/_/g, ' ')} - <span className="font-normal">{rec.priority} priority</span>
              </p>
              <p className="text-xs mt-1">{rec.recommendation}</p>
              {rec.expires_at && (
                <p className="text-xs text-gray-500 mt-1">Expires: {new Date(rec.expires_at).toLocaleDateString()}</p>
              )}
            </div>
          ))}
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